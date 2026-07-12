import { describe, it, expect } from "bun:test";

function escTag(n: string) { return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function extractXmlTag(xml: string, tagName: string): string {
  const e = escTag(tagName);
  const m = xml.match(new RegExp("<" + e + "(?=[\\s>\\/])([\\s\\S]*?)>(.*?)<\\/" + e + ">", "s"));
  if (m) return m[2].trim();
  const sm = xml.match(new RegExp("<" + e + "(?=[\\s>\\/])([\\s\\S]*?)\\/>", "s"));
  if (sm) return "";
  return "";
}

function extractXmlAttribute(xml: string, tagName: string, attr: string): string {
  const m = xml.match(new RegExp("<" + escTag(tagName) + "(?=[\\s>\\/])([^>]*)" + attr + "=[\"']([^\"']*)[\"']", "s"));
  return m ? m[2] : "";
}

function extractSAMLAttributes(xml: string): Record<string, string> {
  const a: Record<string, string> = {};
  const e = escTag("saml:Attribute");
  const re = new RegExp("<" + e + "(?=[\\s>\\/])([\\s\\S]*?)>(.*?)<\\/" + e + ">", "gs");
  let m;
  while ((m = re.exec(xml)) !== null) {
    const nm = m[1].match(/Name=["']([^"']*)["']/);
    if (!nm) continue;
    let v = extractXmlTag(m[2], "saml:AttributeValue");
    if (!v) v = extractXmlTag(m[2], "AttributeValue");
    a[nm[1]] = v;
  }
  return a;
}

function parseIdPMetadata(xml: string): { success: boolean; metadata?: { entityId: string; ssoUrl: string; sloUrl: string; certificate: string }; error?: string } {
  const eid = extractXmlAttribute(xml, "md:EntityDescriptor", "entityID") || extractXmlAttribute(xml, "EntityDescriptor", "entityID");
  if (!eid) return { success: false, error: "No entityID" };
  const sso = extractXmlAttribute(xml, "md:SingleSignOnService", "Location") || extractXmlAttribute(xml, "SingleSignOnService", "Location");
  const slo = extractXmlAttribute(xml, "md:SingleLogoutService", "Location") || extractXmlAttribute(xml, "SingleLogoutService", "Location") || "";
  let cert = "";
  const cm = xml.match(/<X509Certificate>([^<]+)<\/X509Certificate>/s);
  if (cm) cert = cm[1].replace(/\s+/g, "");
  return { success: true, metadata: { entityId: eid, ssoUrl: sso, sloUrl: slo, certificate: cert } };
}

function mapSAMLAttributes(a: Record<string, string>, m: Record<string, string>): Record<string, string> {
  return { email: a[m.email||"email"]||"", name: a[m.name||"displayName"]||"", role: a[m.role||"role"]||"rep", team: a[m.team||"department"]||"" };
}

const SAMPLE_RESPONSE = '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r1" Version="2.0" IssueInstant="2026-07-11T12:00:00Z" Destination="https://elevate-ai.ctonew.app/api/auth/saml/callback"><saml:Issuer>http://www.okta.com/exkqwerty123</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion ID="_a1" Version="2.0" IssueInstant="2026-07-11T12:00:00Z"><saml:Issuer>http://www.okta.com/exkqwerty123</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">john@example.com</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="2026-07-11T14:00:00Z" Recipient="https://elevate-ai.ctonew.app/api/auth/saml/callback" InResponseTo=""/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2026-07-11T11:00:00Z" NotOnOrAfter="2026-07-11T14:00:00Z"><saml:AudienceRestriction><saml:Audience>https://elevate-ai.ctonew.app</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2026-07-11T12:00:00Z" SessionIndex="_si1"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>john@example.com</saml:AttributeValue></saml:Attribute><saml:Attribute Name="displayName"><saml:AttributeValue>John Doe</saml:AttributeValue></saml:Attribute><saml:Attribute Name="role"><saml:AttributeValue>admin</saml:AttributeValue></saml:Attribute><saml:Attribute Name="department"><saml:AttributeValue>Sales</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>';

const OKTA_META = '<?xml version="1.0"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="http://www.okta.com/exkqwerty123"><md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALb/testCert123</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://okta.com/app/elevateai/sso/saml"/><md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://okta.com/app/elevateai/slo/saml"/><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat></md:IDPSSODescriptor></md:EntityDescriptor>';

describe("extractXmlTag", () => {
  it("extracts simple tag", () => expect(extractXmlTag(SAMPLE_RESPONSE, "saml:Issuer")).toBe("http://www.okta.com/exkqwerty123"));
  it("extracts NameID", () => expect(extractXmlTag(SAMPLE_RESPONSE, "saml:NameID")).toBe("john@example.com"));
  it("extracts Audience without matching AudienceRestriction", () => expect(extractXmlTag(SAMPLE_RESPONSE, "saml:Audience")).toBe("https://elevate-ai.ctonew.app"));
  it("returns empty for missing tag", () => expect(extractXmlTag(SAMPLE_RESPONSE, "saml:Missing")).toBe(""));
});

describe("extractXmlAttribute", () => {
  it("extracts Recipient", () => expect(extractXmlAttribute(SAMPLE_RESPONSE, "saml:SubjectConfirmationData", "Recipient")).toBe("https://elevate-ai.ctonew.app/api/auth/saml/callback"));
  it("extracts Format", () => expect(extractXmlAttribute(SAMPLE_RESPONSE, "saml:NameID", "Format")).toBe("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"));
  it("extracts entityID", () => expect(extractXmlAttribute(OKTA_META, "md:EntityDescriptor", "entityID")).toBe("http://www.okta.com/exkqwerty123"));
});

describe("extractSAMLAttributes", () => {
  it("extracts all attributes", () => {
    const as = extractXmlTag(SAMPLE_RESPONSE, "saml:Assertion");
    const a = extractSAMLAttributes(as);
    expect(a.email).toBe("john@example.com");
    expect(a.displayName).toBe("John Doe");
    expect(a.role).toBe("admin");
    expect(a.department).toBe("Sales");
  });
  it("returns empty for no attributes", () => expect(extractSAMLAttributes("<x/>")).toEqual({}));
});

describe("parseIdPMetadata", () => {
  it("parses Okta metadata", () => {
    const r = parseIdPMetadata(OKTA_META);
    expect(r.success).toBe(true);
    expect(r.metadata?.entityId).toBe("http://www.okta.com/exkqwerty123");
    expect(r.metadata?.ssoUrl).toBe("https://okta.com/app/elevateai/sso/saml");
    expect(r.metadata?.sloUrl).toBe("https://okta.com/app/elevateai/slo/saml");
    expect(r.metadata?.certificate).toContain("MIIDXTCCAkWgAwIBAgIJALb");
  });
  it("fails on empty", () => expect(parseIdPMetadata("<x/>").success).toBe(false));
});

describe("mapSAMLAttributes", () => {
  it("maps with defaults", () => {
    const r = mapSAMLAttributes({ email: "a@b.com", displayName: "A B", role: "rep" }, { email: "email", name: "displayName", role: "role" });
    expect(r.email).toBe("a@b.com");
    expect(r.name).toBe("A B");
    expect(r.role).toBe("rep");
  });
  it("handles Azure names", () => {
    const r = mapSAMLAttributes({ "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "a@b.com" }, { email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" });
    expect(r.email).toBe("a@b.com");
  });
});

describe("SAML Structure", () => {
  it("parses assertion", () => expect(extractXmlTag(SAMPLE_RESPONSE, "saml:Assertion")).toContain("saml:Issuer"));
  it("parses status", () => expect(extractXmlAttribute(SAMPLE_RESPONSE, "samlp:StatusCode", "Value")).toContain("Success"));
  it("parses destination", () => expect(extractXmlAttribute(SAMPLE_RESPONSE, "samlp:Response", "Destination")).toBe("https://elevate-ai.ctonew.app/api/auth/saml/callback"));
});

describe("SP Metadata", () => {
  const md = '<?xml version="1.0"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://elevate-ai.ctonew.app/api/auth/saml/metadata"><md:SPSSODescriptor><md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://elevate-ai.ctonew.app/api/auth/saml/callback" index="0" isDefault="true"/></md:SPSSODescriptor></md:EntityDescriptor>';
  it("has entityID", () => expect(md).toContain("saml/metadata"));
  it("has ACS", () => expect(extractXmlAttribute(md, "md:AssertionConsumerService", "Location")).toBe("https://elevate-ai.ctonew.app/api/auth/saml/callback"));
});

describe("AuthnRequest", () => {
  const ar = '<?xml version="1.0"?><samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_tid" Version="2.0" IssueInstant="2026-07-11T12:00:00Z" AssertionConsumerServiceURL="https://elevate-ai.ctonew.app/api/auth/saml/callback"><saml:Issuer>https://elevate-ai.ctonew.app/api/auth/saml/metadata</saml:Issuer></samlp:AuthnRequest>';
  it("has Issuer", () => expect(extractXmlTag(ar, "saml:Issuer")).toBe("https://elevate-ai.ctonew.app/api/auth/saml/metadata"));
  it("has ACS", () => expect(ar).toContain("saml/callback"));
});