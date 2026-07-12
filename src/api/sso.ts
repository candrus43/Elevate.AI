import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, makeSetCookie, SESSION_COOKIE, SESSION_MAX_AGE } from "./middleware";

interface SSOConfig {
  id: string; company_id: string; entity_id: string; acs_url: string; audience_url: string;
  idp_entity_id: string; idp_sso_url: string; idp_slo_url: string; idp_certificate: string;
  idp_metadata: string; attribute_mapping: string; enabled: 0 | 1; created_at: string; updated_at: string;
}
interface AttributeMapping { email?: string; name?: string; role?: string; team?: string; }
interface ParsedAssertion {
  issuer: string; nameId: string; nameIdFormat: string; attributes: Record<string, string>; sessionIndex: string;
  subjectConfirmationData: { recipient: string; notOnOrAfter: string; inResponseTo: string; };
  authnContext: string; conditions: { notBefore: string; notOnOrAfter: string; audience: string[]; };
}

function escTag(n: string) { return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function extractXmlTag(xml: string, tagName: string): string {
  const e = escTag(tagName);
  const re = new RegExp("<" + e + "(?=[\\s>\\/])([\\s\\S]*?)>(.*?)<\\/" + e + ">", "s");
  const m = xml.match(re);
  if (m) return m[2].trim();
  const sr = new RegExp("<" + e + "(?=[\\s>\\/])([\\s\\S]*?)\\/>", "s");
  const sm = xml.match(sr);
  if (sm) return "";
  return "";
}

function extractXmlAttribute(xml: string, tagName: string, attr: string): string {
  const e = escTag(tagName);
  const re = new RegExp("<" + e + "(?=[\\s>\\/])([^>]*)" + attr + "=[\"']([^\"']*)[\"']", "s");
  const m = xml.match(re);
  return m ? m[2] : "";
}

function extractAllXmlTags(xml: string, tagName: string): string[] {
  const e = escTag(tagName);
  const r: string[] = [];
  const re = new RegExp("<" + e + "(?=[\\s>\\/])([\\s\\S]*?)>(.*?)<\\/" + e + ">", "gs");
  let m;
  while ((m = re.exec(xml)) !== null) r.push(m[2].trim());
  return r;
}

function extractSAMLAttributes(xml: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const blocks = extractAllXmlTags(xml, "saml:Attribute").concat(extractAllXmlTags(xml, "Attribute"));
  for (const b of blocks) {
    const nm = b.match(/Name=["']([^"']*)["']/);
    if (!nm) continue;
    let v = extractXmlTag(b, "saml:AttributeValue");
    if (!v) v = extractXmlTag(b, "AttributeValue");
    attrs[nm[1]] = v;
  }
  return attrs;
}

function validateSAMLResponseStructure(xml: string, cfg: SSOConfig): { valid: boolean; error?: string } {
  if (!xml.includes("<samlp:Response") && !xml.includes("<Response")) return { valid: false, error: "Missing SAML Response" };
  const iss = extractXmlTag(xml, "saml:Issuer") || extractXmlTag(xml, "Issuer");
  if (iss && cfg.idp_entity_id && iss !== cfg.idp_entity_id) return { valid: false, error: "Issuer mismatch" };
  const as = extractXmlTag(xml, "saml:Assertion") || extractXmlTag(xml, "Assertion");
  if (!as) return { valid: false, error: "Missing SAML Assertion" };
  const scd = extractXmlTag(as, "saml:SubjectConfirmationData") || extractXmlTag(as, "SubjectConfirmationData");
  const rcp = extractXmlAttribute(scd, "saml:SubjectConfirmationData", "Recipient") || extractXmlAttribute(scd, "SubjectConfirmationData", "Recipient");
  if (rcp && rcp !== cfg.acs_url) return { valid: false, error: "Recipient mismatch" };
  const cond = extractXmlTag(as, "saml:Conditions") || extractXmlTag(as, "Conditions");
  const aud = extractXmlTag(cond, "saml:Audience") || extractXmlTag(cond, "Audience");
  if (aud && aud !== cfg.audience_url && aud !== cfg.entity_id) return { valid: false, error: "Audience mismatch" };
  return { valid: true };
}

function parseSAMLAssertion(xml: string): ParsedAssertion | null {
  try {
    const sub = extractXmlTag(xml, "saml:Subject") || extractXmlTag(xml, "Subject");
    const cond = extractXmlTag(xml, "saml:Conditions") || extractXmlTag(xml, "Conditions");
    const as = extractXmlTag(xml, "saml:AuthnStatement") || extractXmlTag(xml, "AuthnStatement");
    return {
      issuer: extractXmlTag(xml, "saml:Issuer") || extractXmlTag(xml, "Issuer") || "",
      nameId: extractXmlTag(sub, "saml:NameID") || extractXmlTag(sub, "NameID") || "",
      nameIdFormat: extractXmlAttribute(sub, "saml:NameID", "Format") || "",
      attributes: extractSAMLAttributes(xml),
      sessionIndex: extractXmlAttribute(as, "saml:AuthnStatement", "SessionIndex") || "",
      subjectConfirmationData: {
        recipient: extractXmlAttribute(sub, "saml:SubjectConfirmationData", "Recipient") || "",
        notOnOrAfter: extractXmlAttribute(sub, "saml:SubjectConfirmationData", "NotOnOrAfter") || "",
        inResponseTo: extractXmlAttribute(sub, "saml:SubjectConfirmationData", "InResponseTo") || "",
      },
      authnContext: extractXmlTag(as, "saml:AuthnContextClassRef") || "",
      conditions: {
        notBefore: extractXmlAttribute(cond, "saml:Conditions", "NotBefore") || "",
        notOnOrAfter: extractXmlAttribute(cond, "saml:Conditions", "NotOnOrAfter") || "",
        audience: [extractXmlTag(cond, "saml:Audience") || extractXmlTag(cond, "Audience")].filter(Boolean),
      },
    };
  } catch (e) { console.error("parse error:", e); return null; }
}

function parseSAMLResponse(xml: string): { assertion: ParsedAssertion | null; rawAssertion: string; issuer: string; status: string } {
  const sv = extractXmlAttribute(xml, "samlp:StatusCode", "Value") || extractXmlAttribute(xml, "StatusCode", "Value");
  const iss = extractXmlTag(xml, "saml:Issuer") || extractXmlTag(xml, "Issuer");
  const ra = extractXmlTag(xml, "saml:Assertion") || extractXmlTag(xml, "Assertion");
  return { assertion: ra ? parseSAMLAssertion(ra) : null, rawAssertion: ra, issuer: iss, status: sv && sv.includes("Success") ? "success" : "failure" };
}

interface IdPParsedMetadata { entityId: string; ssoUrl: string; sloUrl: string; certificate: string; }

function parseIdPMetadata(xml: string): { success: boolean; metadata?: IdPParsedMetadata; error?: string } {
  try {
    const eid = extractXmlAttribute(xml, "md:EntityDescriptor", "entityID") || extractXmlAttribute(xml, "EntityDescriptor", "entityID");
    if (!eid) return { success: false, error: "No entityID" };
    const sso = extractXmlAttribute(xml, "md:SingleSignOnService", "Location") || extractXmlAttribute(xml, "SingleSignOnService", "Location");
    const slo = extractXmlAttribute(xml, "md:SingleLogoutService", "Location") || extractXmlAttribute(xml, "SingleLogoutService", "Location") || "";
    let cert = "";
    const ur = /<(md:)?KeyDescriptor[^>]*use=["']signing["'][^>]*>[\s\S]*?<X509Certificate>([^<]+)<\/X509Certificate>[\s\S]*?<\/(md:)?KeyDescriptor>/s;
    const um = xml.match(ur);
    if (um) { cert = um[2].replace(/\s+/g, ""); } else { const cm = xml.match(/<X509Certificate>([^<]+)<\/X509Certificate>/s); if (cm) cert = cm[1].replace(/\s+/g, ""); }
    return { success: true, metadata: { entityId: eid, ssoUrl: sso, sloUrl: slo, certificate: cert } };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : "Parse failed" }; }
}

const DEFAULT_ATTR_MAP: AttributeMapping = { email: "email", name: "displayName", role: "role", team: "department" };

const KNOWN_IDP_MAP: Record<string, Partial<AttributeMapping>> = {
  "okta.com": { email: "email", name: "displayName", role: "role", team: "department" },
  "azure.com": { email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/displayname", role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", team: "department" },
  "google.com": { email: "email", name: "displayName", role: "role", team: "department" },
  "onelogin.com": { email: "email", name: "displayName", role: "role", team: "department" },
};

async function getConfig(cid: string): Promise<SSOConfig | null> {
  const r = await db(sql("SELECT * FROM sso_config WHERE company_id = '" + cid.replace(/'/g, "''") + "'"));
  return r.length > 0 ? r[0] : null;
}

async function upsertConfig(cid: string, c: Partial<SSOConfig>): Promise<void> {
  const existing = await getConfig(cid);
  const id = existing?.id || crypto.randomUUID();
  if (existing) {
    const ups: string[] = [];
    const fields = ["entity_id","acs_url","audience_url","idp_entity_id","idp_sso_url","idp_slo_url","idp_certificate","idp_metadata","attribute_mapping","enabled"];
    for (const [k, v] of Object.entries(c)) { if (fields.includes(k) && v !== undefined) { ups.push(k + " = " + (typeof v === "string" ? "'" + v.replace(/'/g, "''") + "'" : String(v))); } }
    ups.push("updated_at = datetime('now')");
    await db(sql("UPDATE sso_config SET " + ups.join(", ") + " WHERE id = '" + id + "'"));
  } else {
    await db(sql("INSERT INTO sso_config (id,company_id,entity_id,acs_url,audience_url,idp_entity_id,idp_sso_url,idp_slo_url,idp_certificate,idp_metadata,attribute_mapping,enabled) VALUES ('" + id + "','" + cid + "','" + (c.entity_id||"") + "','" + (c.acs_url||"") + "','" + (c.audience_url||"") + "','" + (c.idp_entity_id||"") + "','" + (c.idp_sso_url||"") + "','" + (c.idp_slo_url||"") + "','" + (c.idp_certificate||"") + "','" + (c.idp_metadata||"") + "','" + (c.attribute_mapping||JSON.stringify(DEFAULT_ATTR_MAP)) + "'," + (c.enabled !== undefined ? (c.enabled?1:0) : 0) + ")"));
  }
}

async function findOrCreateUser(cid: string, a: ParsedAssertion, cfg: SSOConfig): Promise<{ user: any; isNew: boolean }> {
  const m: AttributeMapping = JSON.parse(cfg.attribute_mapping || "{}");
  const email = (a.attributes[m.email||"email"] || a.nameId);
  const name = (a.attributes[m.name||"displayName"] || a.nameId.split("@")[0] || "SAML User");
  const role = (a.attributes[m.role||"role"] || "rep");
  const team = (a.attributes[m.team||"department"] || "");
  if (!email) throw new Error("No email in SAML");
  const ex = await db(sql("SELECT id,email,name,role,company_id,is_active FROM users WHERE email = '" + email.replace(/'/g, "''") + "' AND company_id = '" + cid + "'"));
  if (ex.length > 0) {
    if (!ex[0].is_active) throw new Error("Account disabled");
    await db(sql("UPDATE users SET last_login_at = datetime('now') WHERE id = '" + ex[0].id + "'"));
    return { user: ex[0], isNew: false };
  }
  const uid = crypto.randomUUID();
  const ph = await Bun.password.hash(crypto.randomUUID());
  await db(sql("INSERT INTO users (id,company_id,email,password_hash,name,role,team_id,is_active) VALUES ('" + uid + "','" + cid + "','" + email.replace(/'/g, "''") + "','" + ph + "','" + name.replace(/'/g, "''") + "','" + role + "'," + (team ? "'" + team + "'" : "NULL") + ",1)"));
  return { user: { id: uid, email, name, role, company_id: cid }, isNew: true };
}

async function createSession(uid: string): Promise<string> {
  const t = crypto.randomUUID() + crypto.randomUUID();
  await db(sql("INSERT INTO sessions (id,user_id,token,expires_at) VALUES ('" + crypto.randomUUID() + "','" + uid + "','" + t + "','" + new Date(Date.now() + 7*24*60*60*1000).toISOString() + "')"));
  return t;
}

function genSampleResponse(cfg: SSOConfig, email: string, name: string, role: string): string {
  const n = new Date();
  return '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_' + crypto.randomUUID().replace(/-/g,"") + '" Version="2.0" IssueInstant="' + n.toISOString() + '" Destination="' + cfg.acs_url + '"><saml:Issuer>' + cfg.idp_entity_id + '</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion ID="_' + crypto.randomUUID().replace(/-/g,"") + '" Version="2.0" IssueInstant="' + n.toISOString() + '"><saml:Issuer>' + cfg.idp_entity_id + '</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">' + email + '</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="' + new Date(n.getTime()+5*60*1000).toISOString() + '" Recipient="' + cfg.acs_url + '"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="' + new Date(n.getTime()-5*60*1000).toISOString() + '" NotOnOrAfter="' + new Date(n.getTime()+5*60*1000).toISOString() + '"><saml:AudienceRestriction><saml:Audience>' + (cfg.audience_url||cfg.entity_id) + '</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="' + n.toISOString() + '" SessionIndex="' + crypto.randomUUID() + '"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>' + email + '</saml:AttributeValue></saml:Attribute><saml:Attribute Name="displayName"><saml:AttributeValue>' + name + '</saml:AttributeValue></saml:Attribute><saml:Attribute Name="role"><saml:AttributeValue>' + role + '</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>';
}

export async function handleGetSSOSettings(req: Request): Promise<Response> {
  try {
    const u = await getAuthUser(req);
    if (!u) return jsonResponse({ error: "Not authenticated" }, 401);
    if (u.role !== "admin") return jsonResponse({ error: "Admin access required" }, 403);
    const c = await getConfig(u.companyId);
    if (!c) return jsonResponse({ enabled: false, config: { entity_id: "https://elevate-ai.ctonew.app/api/auth/saml/metadata", acs_url: "https://elevate-ai.ctonew.app/api/auth/saml/callback", audience_url: "https://elevate-ai.ctonew.app", attribute_mapping: DEFAULT_ATTR_MAP } });
    return jsonResponse({ enabled: !!c.enabled, config: { id: c.id, entity_id: c.entity_id, acs_url: c.acs_url, audience_url: c.audience_url, idp_entity_id: c.idp_entity_id, idp_sso_url: c.idp_sso_url, idp_slo_url: c.idp_slo_url, idp_certificate: c.idp_certificate ? c.idp_certificate.substring(0,50)+"..." : "", has_idp_certificate: !!c.idp_certificate, has_idp_metadata: !!c.idp_metadata, attribute_mapping: JSON.parse(c.attribute_mapping||"{}") } });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}

export async function handleUpdateSSOSettings(req: Request): Promise<Response> {
  try {
    const u = await getAuthUser(req);
    if (!u) return jsonResponse({ error: "Not authenticated" }, 401);
    if (u.role !== "admin") return jsonResponse({ error: "Admin access required" }, 403);
    const b = await req.json();
    await upsertConfig(u.companyId, { entity_id: b.entity_id, acs_url: b.acs_url, audience_url: b.audience_url, idp_entity_id: b.idp_entity_id, idp_sso_url: b.idp_sso_url, idp_slo_url: b.idp_slo_url, idp_certificate: b.idp_certificate, attribute_mapping: b.attribute_mapping ? JSON.stringify(b.attribute_mapping) : undefined, enabled: b.enabled });
    return jsonResponse({ success: true });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}

export async function handleImportIdPMetadata(req: Request): Promise<Response> {
  try {
    const u = await getAuthUser(req);
    if (!u) return jsonResponse({ error: "Not authenticated" }, 401);
    if (u.role !== "admin") return jsonResponse({ error: "Admin access required" }, 403);
    const b = await req.json();
    let xml;
    if (b.metadata_url) { try { const r = await fetch(b.metadata_url); if (!r.ok) return jsonResponse({ error: "HTTP "+r.status }, 400); xml = await r.text(); } catch(e) { return jsonResponse({ error: e.message }, 400); } }
    else if (b.metadata_xml) { xml = b.metadata_xml; } else { return jsonResponse({ error: "metadata_url or metadata_xml required" }, 400); }
    const p = parseIdPMetadata(xml);
    if (!p.success) return jsonResponse({ error: p.error }, 400);
    if (!p.metadata) return jsonResponse({ error: "No metadata" }, 400);
    const pk = Object.keys(KNOWN_IDP_MAP).find(k => p.metadata!.entityId.toLowerCase().includes(k));
    await upsertConfig(u.companyId, { idp_entity_id: p.metadata.entityId, idp_sso_url: p.metadata.ssoUrl, idp_slo_url: p.metadata.sloUrl, idp_certificate: p.metadata.certificate, idp_metadata: xml, attribute_mapping: JSON.stringify(pk ? KNOWN_IDP_MAP[pk] : DEFAULT_ATTR_MAP) });
    return jsonResponse({ success: true, metadata: p.metadata, detected_provider: pk ? pk.replace(".com","") : "custom" });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}

export async function handleGetSPMetadata(req: Request): Promise<Response> {
  try {
    const u = await getAuthUser(req);
    if (!u) return jsonResponse({ error: "Not authenticated" }, 401);
    if (u.role !== "admin") return jsonResponse({ error: "Admin access required" }, 403);
    const c = await getConfig(u.companyId);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="' + (c?.entity_id||"https://elevate-ai.ctonew.app/api/auth/saml/metadata") + '"><md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="' + (c?.acs_url||"https://elevate-ai.ctonew.app/api/auth/saml/callback") + '" index="0" isDefault="true"/><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat></md:SPSSODescriptor></md:EntityDescriptor>', { headers: { "Content-Type": "application/xml" } });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}

export async function handleTestSAMLConnection(req: Request): Promise<Response> {
  try {
    const u = await getAuthUser(req);
    if (!u) return jsonResponse({ error: "Not authenticated" }, 401);
    if (u.role !== "admin") return jsonResponse({ error: "Admin access required" }, 403);
    const c = await getConfig(u.companyId);
    if (!c || !c.enabled) return jsonResponse({ error: "SSO disabled" }, 400);
    const b = await req.json().catch(()=>({}));
    const xml = b.saml_response || genSampleResponse(c, u.email, u.name, u.role);
    const v = validateSAMLResponseStructure(xml, c);
    if (!v.valid) return jsonResponse({ error: v.error }, 400);
    const p = parseSAMLResponse(xml);
    if (!p.assertion) return jsonResponse({ error: "Parse failed" }, 400);
    return jsonResponse({ success: true, details: { issuer: p.assertion.issuer, nameId: p.assertion.nameId, attributes: p.assertion.attributes, status: p.status } });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}

export async function handleSAMLLogin(req: Request): Promise<Response> {
  try {
    const cid = new URL(req.url).searchParams.get("company_id");
    if (!cid) return jsonResponse({ error: "company_id required" }, 400);
    const c = await getConfig(cid);
    if (!c || !c.enabled || !c.idp_sso_url) return jsonResponse({ error: "SSO not configured" }, 400);
    const ru = new URL(c.idp_sso_url);
    ru.searchParams.set("SAMLRequest", btoa(unescape(encodeURIComponent('<?xml version="1.0"?><samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_' + crypto.randomUUID().replace(/-/g,"") + '" Version="2.0" IssueInstant="' + new Date().toISOString() + '" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="' + c.acs_url + '"><saml:Issuer>' + c.entity_id + '</saml:Issuer></samlp:AuthnRequest>'))));
    return new Response(null, { status: 302, headers: { Location: ru.toString() } });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}

export async function handleSAMLCallback(req: Request): Promise<Response> {
  try {
    let sr, rs = "";
    const ct = req.headers.get("content-type")||"";
    if (ct.includes("x-www-form-urlencoded")) { const fd = await req.formData(); sr = fd.get("SAMLResponse"); rs = fd.get("RelayState")||""; }
    else { const b = await req.json().catch(()=>({})); sr = b.SAMLResponse||b.saml_response||""; rs = b.RelayState||""; }
    if (!sr) return jsonResponse({ error: "Missing SAMLResponse" }, 400);
    let cid = rs;
    if (!cid) {
      const d = extractXmlAttribute(sr, "samlp:Response", "Destination")||"";
      if (!d) return jsonResponse({ error: "Cannot determine company" }, 400);
      const cfgs = await db(sql("SELECT company_id FROM sso_config WHERE acs_url = '" + d.replace(/'/g,"''") + "' AND enabled = 1"));
      if (cfgs.length === 0) return jsonResponse({ error: "No SSO config" }, 400);
      cid = cfgs[0].company_id;
    }
    const c = await getConfig(cid);
    if (!c || !c.enabled) return jsonResponse({ error: "SSO disabled" }, 403);
    const v = validateSAMLResponseStructure(sr, c);
    if (!v.valid) return jsonResponse({ error: v.error }, 400);
    const p = parseSAMLResponse(sr);
    if (!p.assertion || p.status !== "success") return jsonResponse({ error: "SAML auth failed" }, 401);
    const { user, isNew } = await findOrCreateUser(cid, p.assertion, c);
    const token = await createSession(user.id);
    return jsonResponse({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, isNew }, redirect: "/dashboard" }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) });
  } catch (e) { console.error(e); return jsonResponse({ error: "Callback failed" }, 500); }
}

export async function handleSAMLLogout(req: Request): Promise<Response> {
  try {
    const ch = req.headers.get("cookie");
    if (ch) {
      const cs = {};
      ch.split(";").forEach(p => { const i = p.indexOf("="); if (i>0) cs[p.substring(0,i).trim()] = decodeURIComponent(p.substring(i+1).trim()); });
      const t = cs[SESSION_COOKIE];
      if (t) await db(sql("DELETE FROM sessions WHERE token = '" + t.replace(/'/g,"''") + "'"));
    }
    return jsonResponse({ success: true }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, "", 0) });
  } catch (e) { console.error(e); return jsonResponse({ error: "Failed" }, 500); }
}