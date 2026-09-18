const fs = require('fs');
const { PDFDocument, PDFName, PDFStream, PDFRawStream } = require('pdf-lib');

async function test() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText('Hello', { color: require('pdf-lib').rgb(1, 0, 0) });
  const pdfBytes = await pdfDoc.save();
  
  const doc = await PDFDocument.load(pdfBytes);
  const p = doc.getPages()[0];
  const contents = p.node.Contents();
  console.log(contents ? contents.toString() : 'no contents');
}
test();
