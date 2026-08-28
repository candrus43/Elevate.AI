/**
 * Dependency-free document sectioning.
 *
 * Chunks plain-text / markdown content into sections for the
 * `compliance_document_sections` table. No external parsers.
 *
 * This is the clean seam for future PDF/DOCX support: those binary formats will
 * first be converted to text by a separate extraction step, then fed into
 * `chunkDocumentIntoSections` — the sectioning logic below stays format-agnostic.
 */

export interface DocumentSection {
  section_title: string;
  content_text: string;
  sort_order: number;
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
