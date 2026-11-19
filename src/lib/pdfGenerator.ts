/**
 * Generates a valid, self-contained PDF Blob URL on the client for official
 * Student Manch notices and college brochures when an uploaded binary PDF URL
 * is stored or synthesized.
 */
function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLines(text: string, maxChars = 76): string[] {
  const clean = text.replace(/[^\x20-\x7E\n]/g, ' ');
  const paragraphs = clean.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > maxChars) {
        if (current) lines.push(current);
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) lines.push(current);
    lines.push('');
  }
  return lines.slice(0, 34);
}

export function createDocumentPdfDataUri(opts: {
  title: string;
  subtitle: string;
  body: string;
  footer?: string;
}): string {
  const lines = [
    'STUDENT MANCH (studentmanch.online) - OFFICIAL DOCUMENT',
    '================================================================',
    '',
    opts.title,
    opts.subtitle,
    '----------------------------------------------------------------',
    '',
    ...wrapLines(opts.body),
    '',
    '----------------------------------------------------------------',
    opts.footer || 'Verified Educational Resource | https://studentmanch.online',
  ];

  let y = 760;
  const textOps: string[] = ['BT', '/F1 11 Tf'];
  for (const line of lines) {
    if (y < 55) break;
    textOps.push(`1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`);
    y -= 17;
  }
  textOps.push('ET');
  const streamContent = textOps.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new TextEncoder().encode(pdf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

export function triggerPdfDownload(url: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.pdf';
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
