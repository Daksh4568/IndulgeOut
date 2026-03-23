/**
 * Generate a sample PDF ticket for MSG91 template review.
 * 
 * Usage:  node scripts/generateSampleTicketPdf.js
 * Output: scripts/sample-ticket.pdf
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'sample-ticket.pdf');

const doc = new PDFDocument({ size: 'A4', margin: 40 });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const pageWidth = doc.page.width - 80;

// ── Header Banner (brand gradient) ──
const grad = doc.linearGradient(0, 0, 0, 90);
grad.stop(0, '#7878E9').stop(1, '#3D3DD4');
doc.rect(0, 0, doc.page.width, 90).fill(grad);
doc.fill('#ffffff').fontSize(28).font('Helvetica-Bold')
  .text('IndulgeOut', 40, 25, { align: 'center' });
doc.fontSize(13).font('Helvetica')
  .text('Event Ticket', 40, 58, { align: 'center' });

let y = 120;

// ── Placeholder for Event Poster ──
const posterWidth = 400;
const posterX = (doc.page.width - posterWidth) / 2;
doc.rect(posterX, y, posterWidth, 180).lineWidth(1).strokeColor('#d1d5db').stroke();
doc.fill('#9ca3af').fontSize(14).font('Helvetica')
  .text('[Event Poster Image]', posterX, y + 78, { width: posterWidth, align: 'center' });
y += 195;

// ── Event Title ──
doc.fill('#111827').fontSize(22).font('Helvetica-Bold')
  .text('Sunset Yoga at Cubbon Park', 40, y, { width: pageWidth, align: 'center' });
y += 35;

// ── Divider ──
doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).strokeColor('#d1d5db').stroke();
y += 15;

// ── Ticket Details ──
const details = [
  { label: 'Attendee', value: 'Rahul Sharma' },
  { label: 'Date', value: 'Sat, 22 Mar, 2026' },
  { label: 'Time', value: '5:00 PM - 7:00 PM' },
  { label: 'Venue', value: 'Cubbon Park, Bangalore' },
  { label: 'Tickets', value: '2' },
  { label: 'Booking ID', value: 'TKT-ABC12345' },
];

for (const { label, value } of details) {
  doc.fill('#6b7280').fontSize(11).font('Helvetica')
    .text(label, 60, y, { width: 100 });
  doc.fill('#111827').fontSize(12).font('Helvetica-Bold')
    .text(value, 170, y, { width: pageWidth - 130 });
  y += 22;
}

y += 10;
doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).strokeColor('#d1d5db').stroke();
y += 20;

// ── QR Code Placeholder ──
const qrSize = 160;
const qrX = (doc.page.width - qrSize) / 2;
doc.rect(qrX, y, qrSize, qrSize).lineWidth(1).strokeColor('#d1d5db').stroke();
doc.fill('#9ca3af').fontSize(12).font('Helvetica')
  .text('[QR Code]', qrX, y + 70, { width: qrSize, align: 'center' });
y += qrSize + 10;

doc.fill('#6b7280').fontSize(10).font('Helvetica')
  .text('Scan this QR code at the venue for entry', 40, y, { width: pageWidth, align: 'center' });
y += 25;

// ── Footer ──
doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
y += 12;

doc.fill('#9ca3af').fontSize(9).font('Helvetica')
  .text('This ticket is valid for the number of spots shown above.', 40, y, { width: pageWidth, align: 'center' });
y += 14;
doc.fill('#3D3DD4').text('Contact Us', 40, y, {
  width: pageWidth,
  align: 'center',
  link: 'https://www.indulgeout.com/contact-us',
  underline: true,
});
y += 14;
doc.text('Terms & Conditions', 40, y, {
  width: pageWidth,
  align: 'center',
  link: 'https://www.indulgeout.com/terms-conditions',
  underline: true,
});
y += 14;
doc.fill('#9ca3af').text('© 2025 IndulgeOut. All rights reserved.', 40, y, { width: pageWidth, align: 'center' });

doc.end();

stream.on('finish', () => {
  console.log(`✅ Sample ticket PDF generated: ${outputPath}`);
});
