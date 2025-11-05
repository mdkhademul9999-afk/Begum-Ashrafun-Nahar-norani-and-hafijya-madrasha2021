const PDFDocument = require('pdfkit');

function studentMarksheetPDF(res, student, results) {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(20).text('Marksheet', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('Name: ' + student.name);
  doc.text('Class: ' + (student.className||'N/A'));
  doc.moveDown();
  results.forEach(r => {
    doc.text(`${r.subject}: ${r.marks} / ${r.total}`);
  });
  doc.end();
}

module.exports = { studentMarksheetPDF };
