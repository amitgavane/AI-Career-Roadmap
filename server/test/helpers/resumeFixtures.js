import JSZip from 'jszip';

/**
 * Creates a valid, well-formed minimal PDF 1.4 buffer containing extractable text.
 */
export const createValidPdfBuffer = () => {
  const content = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    '4 0 obj << /Length 135 >> stream',
    'BT',
    '/F1 12 Tf',
    '72 712 Td',
    '(Alex Morgan - Final Year B.Tech Computer Science Student) Tj',
    '0 -20 Td',
    '(Skills: JavaScript, React, Node.js, Express, MongoDB, Git, Docker, REST APIs) Tj',
    'ET',
    'endstream',
    'endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000244 00000 n ',
    '0000000430 00000 n ',
    'trailer << /Size 6 /Root 1 0 R >>',
    'startxref',
    '504',
    '%%EOF',
  ].join('\n');

  return Buffer.from(content, 'utf-8');
};

/**
 * Creates an empty PDF (valid PDF structure but no text content in streams)
 */
export const createEmptyPdfBuffer = () => {
  const content = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj',
    '4 0 obj << /Length 0 >> stream',
    'endstream',
    'endobj',
    'xref',
    '0 5',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000216 00000 n ',
    'trailer << /Size 5 /Root 1 0 R >>',
    'startxref',
    '267',
    '%%EOF',
  ].join('\n');

  return Buffer.from(content, 'utf-8');
};

/**
 * Creates a corrupted PDF buffer with invalid header and bytes
 */
export const createCorruptedPdfBuffer = () => {
  return Buffer.from('NOT_A_PDF_CORRUPTED_BYTES_%%EOF_CORRUPT', 'utf-8');
};

/**
 * Creates a valid, well-formed minimal DOCX buffer with extractable text
 */
export const createValidDocxBuffer = async () => {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>'
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>'
  );

  // word/document.xml
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      '<w:p><w:r><w:t>Samantha Reed - Full Stack Web Developer Resume.</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Technical Skills: JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Docker, AWS, Git.</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Education: B.Tech Computer Science and Engineering, 2022 - 2026.</w:t></w:r></w:p>' +
      '</w:body>' +
      '</w:document>'
  );

  return zip.generateAsync({ type: 'nodebuffer' });
};

/**
 * Creates an empty DOCX buffer (valid archive with empty body)
 */
export const createEmptyDocxBuffer = async () => {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>'
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>'
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body></w:body>' +
      '</w:document>'
  );
  return zip.generateAsync({ type: 'nodebuffer' });
};

/**
 * Creates a corrupted DOCX buffer with invalid zip headers
 */
export const createCorruptedDocxBuffer = () => {
  return Buffer.from('CORRUPTED_PK_ZIP_HEADER_INVALID_DOCX_STREAM', 'utf-8');
};

/**
 * Creates an oversized buffer exceeding 5MB (e.g. 5.5MB)
 */
export const createOversizedBuffer = () => {
  return Buffer.alloc(5.5 * 1024 * 1024, 'a');
};

/**
 * Creates an unsupported file buffer (e.g. plain text or executable bytes)
 */
export const createUnsupportedBuffer = () => {
  return Buffer.from('Plain text file content which is not PDF or DOCX', 'utf-8');
};
