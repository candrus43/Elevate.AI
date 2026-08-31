/**
 * Document parsing + sectioning (dependency-free).
 *
 * `extractTextFromBuffer` converts policy documents into plain text:
 *   - DOCX (.docx/.docm): ZIP container → `word/document.xml` → paragraph text
 *   - PDF: content streams (FlateDecode via node:zlib) → text-showing operators
 *   - TXT/MD: decoded as UTF-8 text
 *
 * `chunkDocumentIntoSections` then sections any text content for the
 * `compliance_document_sections` table. No third-party parsers — only Node's
 * built-in `zlib` for the binary formats.
 */

import { inflateRawSync } from "node:zlib";

export interface DocumentSection {
  section_title: string;
  content_text: string;
  sort_order: number;
}

export interface ExtractedDocumentText {
  text: string;
  fileType: string;
}

/** Supported binary / text input formats for compliance document ingestion. */
export const SUPPORTED_DOCUMENT_EXTENSIONS = ["txt", "md", "markdown", "text", "pdf", "docx", "docm"] as const;

function detectFormat(fileName: string, mimeType?: string): "docx" | "pdf" | "text" {
  const lower = (fileName || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  if (/\.(docx|docm)$/.test(lower) || mime.includes("wordprocessingml")) return "docx";
  if (/\.pdf$/.test(lower) || mime === "application/pdf") return "pdf";
  return "text";
}

// ─── Minimal ZIP reader (DOCX is a ZIP container) ──────────────────────────
function u16(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}
function u32(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function readZipEntries(data: Uint8Array): ZipEntry[] {
  // Locate End Of Central Directory (EOCD) signature 0x06054b50.
  let eocd = -1;
  for (let i = data.length - 22; i >= 0; i--) {
    if (u32(data, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return [];
  const count = u16(data, eocd + 10);
  let off = u32(data, eocd + 16); // central directory offset
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (u32(data, off) !== 0x02014b50) break;
    const method = u16(data, off + 10);
    const compressedSize = u32(data, off + 20);
    const nameLen = u16(data, off + 28);
    const extraLen = u16(data, off + 30);
    const commentLen = u16(data, off + 32);
    const localHeaderOffset = u32(data, off + 42);
    const name = new TextDecoder().decode(data.slice(off + 46, off + 46 + nameLen));
    entries.push({ name, method, compressedSize, localHeaderOffset });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readZipEntryData(data: Uint8Array, entry: ZipEntry): Uint8Array {
  const off = entry.localHeaderOffset;
  const nameLen = u16(data, off + 26);
  const extraLen = u16(data, off + 28);
  const start = off + 30 + nameLen + extraLen;
  const compressed = data.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return compressed; // stored
  if (entry.method === 8) return new Uint8Array(inflateRawSync(Buffer.from(compressed))); // deflate
  return new Uint8Array(0);
}

function xmlUnescape(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Extract readable text from WordprocessingML (word/document.xml). */
function extractDocxText(documentXml: string): string {
  const tokenRe = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<\/w:p>|<w:tab[^>]*\/?>|<w:br[^>]*\/?>/g;
  let out = "";
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(documentXml)) !== null) {
    const tok = m[0];
    if (tok.startsWith("<w:t")) out += xmlUnescape(m[1] ?? "");
    else if (tok === "</w:p>") out += "\n";
    else if (tok.includes("w:tab")) out += "\t";
    else if (tok.includes("w:br")) out += "\n";
  }
  return out;
}

// ─── PDF (content streams → text-showing operators) ───────────────────────
function decodePdfString(s: string): string {
  return s
    .replace(/\\\r?\n/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_m, oct: string) => String.fromCharCode(parseInt(oct, 8)));
}

function extractPdfText(data: Uint8Array): string {
  const src = Buffer.from(data).toString("latin1");
  const streams: string[] = [];
  const streamRe = /stream[\r\n]+/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(src)) !== null) {
    const start = m.index + m[0].length;
    const end = src.indexOf("endstream", start);
    if (end < 0) break;
    const dict = src.slice(Math.max(0, m.index - 256), m.index);
    let chunk = src.slice(start, end);
    if (/\/FlateDecode/.test(dict)) {
      try {
        chunk = inflateRawSync(Buffer.from(chunk, "latin1")).toString("latin1");
      } catch {
        chunk = "";
      }
    }
    streams.push(chunk);
  }

  const content = streams.join("\n");
  const out: string[] = [];

  // Array form: [ (text) -250 (text) ] TJ
  const arrRe = /\[((?:[^\[\]]|\\.)*)\]\s*TJ/g;
  let am: RegExpExecArray | null;
  while ((am = arrRe.exec(content)) !== null) {
    const lits = am[1].match(/\((?:\\.|[^()\\])*\)/g) ?? [];
    out.push(lits.map((l) => decodePdfString(l.slice(1, -1))).join(""));
    out.push("\n");
  }

  // Single-string form: (text) Tj
  const tjRe = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
  let tm: RegExpExecArray | null;
  while ((tm = tjRe.exec(content)) !== null) {
    out.push(decodePdfString(tm[1]));
    out.push("\n");
  }

  return out.join("").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Extract plain text from a policy document buffer (dependency-free).
 * - DOCX (.docx / .docm): ZIP + WordprocessingML
 * - PDF: FlateDecode content streams
 * - everything else: UTF-8 text (txt / md / markdown)
 */
export function extractTextFromBuffer(
  fileName: string,
  data: Uint8Array,
  mimeType?: string,
): ExtractedDocumentText {
  const format = detectFormat(fileName, mimeType);

  if (format === "docx") {
    const entries = readZipEntries(data);
    const docEntry = entries.find((e) => e.name === "word/document.xml");
    if (!docEntry) {
      return { text: "", fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    }
    const xml = new TextDecoder("utf-8").decode(readZipEntryData(data, docEntry));
    return {
      text: extractDocxText(xml),
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  if (format === "pdf") {
    return { text: extractPdfText(data), fileType: "application/pdf" };
  }

  const text = new TextDecoder("utf-8").decode(data);
  const fileType = /\.(md|markdown)$/i.test(fileName || "") ? "text/markdown" : "text/plain";
  return { text, fileType };
}

interface HeadingRule {
  pattern: RegExp;
  title: (match: RegExpMatchArray) => string;
}

const HEADING_RULES: HeadingRule[] = [
  // Markdown ATX heading: "# Title", "## Subtitle", etc.
  { pattern: /^#{1,6}\s+(.+?)\s*#*\s*$/, title: (m) => m[1].trim() },
  // Numbered heading: "1.2.3 Title" / "1.2.3) Title"
  { pattern: /^\d+(?:\.\d+)+[.)]\s+(.+)$/, title: (m) => m[1].trim() },
  // "Section N", "Article N", "Part N" — with optional trailing title
  { pattern: /^(?:Section|Article|Part)\s+\d+[.:)]?\s*(.*)$/i, title: (m) => (m[1] || "").trim() || m[0].trim() },
];

/** A short, all-caps line (no sentence-ending punctuation) reads as a heading. */
function isAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  if (!/[A-Z]/.test(trimmed)) return false;
  if (!/^[A-Z][A-Z0-9 &/\\\-–—'’()]+$/.test(trimmed)) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  return true;
}

function detectHeading(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  for (const rule of HEADING_RULES) {
    const match = trimmed.match(rule.pattern);
    if (match) return rule.title(match);
  }
  if (isAllCapsHeading(trimmed)) return trimmed;
  return null;
}

/**
 * Chunk a document into ordered sections.
 * - When headings are present, content is grouped under the nearest preceding heading.
 * - When no headings are found, falls back to blank-line-separated paragraphs.
 */
export function chunkDocumentIntoSections(content: string): DocumentSection[] {
  const normalized = (content ?? "").replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  const sections: DocumentSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];
  let headingCount = 0;

  const flush = (): void => {
    const body = currentLines.join("\n").trim();
    if (currentTitle || body) {
      sections.push({
        section_title: currentTitle || `Section ${sections.length + 1}`,
        content_text: body,
        sort_order: sections.length,
      });
    }
    currentTitle = "";
    currentLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    const heading = detectHeading(line);
    if (heading !== null) {
      headingCount += 1;
      flush();
      currentTitle = heading;
    } else {
      currentLines.push(line);
    }
  }
  flush();

  if (headingCount === 0) {
    return chunkByParagraphs(normalized);
  }
  return sections;
}

function chunkByParagraphs(content: string): DocumentSection[] {
  const paragraphs = content
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((paragraph, index) => ({
    section_title: `Section ${index + 1}`,
    content_text: paragraph,
    sort_order: index,
  }));
}
