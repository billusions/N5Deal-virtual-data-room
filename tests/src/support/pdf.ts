/** A minimal, structurally valid single-page PDF — small enough to keep upload tests fast. */
export function makeValidPdf(): Buffer {
  const content =
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n' +
    '%%EOF';
  return Buffer.from(content, 'utf-8');
}

/** Plain-text bytes masquerading under a .pdf name — used to test content-sniffing, not just extension checks. */
export function makeFakePdfBytes(): Buffer {
  return Buffer.from('this is not a real pdf, just text pretending to be one', 'utf-8');
}
