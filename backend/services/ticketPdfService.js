const PDFDocument = require('pdfkit');
const axios = require('axios');
const { uploadToS3 } = require('../config/s3');

/**
 * Fetch an image from a URL and return it as a Buffer.
 * Returns null on failure (non-critical).
 */
async function fetchImageBuffer(url) {
  if (!url) return null;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return Buffer.from(response.data);
  } catch (err) {
    console.error(`⚠️ [TicketPDF] Failed to fetch image: ${url}`, err.message);
    return null;
  }
}

/**
 * Generate a branded PDF ticket and upload to S3.
 *
 * @param {object} opts
 * @param {string} opts.ticketNumber  - e.g. "TKT-ABC12345"
 * @param {string} opts.userName      - Attendee name
 * @param {string} opts.eventName     - Event title
 * @param {string} opts.eventDate     - Formatted date
 * @param {string} opts.eventTime     - Formatted time
 * @param {string} opts.venueName     - Venue address
 * @param {number|string} opts.spots  - Number of spots
 * @param {object} [opts.genderBreakdown] - { male: number, female: number }
 * @param {string} opts.qrCodeUrl     - Hosted QR code image URL (S3/CloudFront)
 * @param {string} [opts.qrCodeBase64] - Base64 QR code (fallback)
 * @param {string} [opts.eventImageUrl] - Event poster URL
 * @returns {Promise<{url: string, key: string}|null>}
 */
async function generateTicketPdf(opts) {
  const {
    ticketNumber,
    userName,
    eventName,
    eventDate,
    eventTime,
    venueName,
    spots,
    genderBreakdown,
    qrCodeUrl,
    qrCodeBase64,
    eventImageUrl,
    pricingTier,
  } = opts;

  // Fetch images in parallel
  const [qrBuffer, posterBuffer] = await Promise.all([
    fetchImageBuffer(qrCodeUrl),
    fetchImageBuffer(eventImageUrl),
  ]);

  // Fallback: decode base64 QR if hosted URL failed
  let qrImageBuffer = qrBuffer;
  if (!qrImageBuffer && qrCodeBase64) {
    try {
      const base64Data = qrCodeBase64.replace(/^data:image\/\w+;base64,/, '');
      qrImageBuffer = Buffer.from(base64Data, 'base64');
    } catch {
      // no QR at all
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const result = await uploadToS3(
            pdfBuffer,
            'tickets',
            `${ticketNumber}.pdf`,
            'application/pdf'
          );
          console.log(`✅ [TicketPDF] Uploaded ${ticketNumber}.pdf → ${result.url}`);
          resolve(result);
        } catch (uploadErr) {
          console.error('❌ [TicketPDF] S3 upload failed:', uploadErr.message);
          resolve(null);
        }
      });
      doc.on('error', (err) => {
        console.error('❌ [TicketPDF] PDF generation error:', err.message);
        resolve(null);
      });

      const pageWidth = doc.page.width - 80; // 40 margin each side

      // ── Header Banner (brand gradient approximation) ──
      const grad = doc.linearGradient(0, 0, 0, 90);
      grad.stop(0, '#7878E9').stop(1, '#3D3DD4');
      doc.rect(0, 0, doc.page.width, 90).fill(grad);
      doc.fill('#ffffff').fontSize(28).font('Helvetica-Bold')
        .text('IndulgeOut', 40, 25, { align: 'center' });
      doc.fontSize(13).font('Helvetica')
        .text('Event Ticket', 40, 58, { align: 'center' });

      doc.moveDown(2);
      let y = 110;

      // ── Event Poster ──
      if (posterBuffer) {
        try {
          const posterWidth = Math.min(pageWidth, 350);
          const posterX = (doc.page.width - posterWidth) / 2;
          doc.image(posterBuffer, posterX, y, {
            width: posterWidth,
            height: 150,
            fit: [posterWidth, 150],
            align: 'center',
          });
          y += 158;
        } catch {
          // skip poster if format unsupported
        }
      }

      // ── Event Title ──
      doc.fill('#111827').fontSize(20).font('Helvetica-Bold')
        .text(eventName, 40, y, { width: pageWidth, align: 'center' });
      y += 30;

      // ── Divider ──
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).strokeColor('#d1d5db').stroke();
      y += 15;

      // ── Ticket Details ──
      // Build tickets value with gender breakdown if applicable
      let ticketsValue = `${spots} ${Number(spots) === 1 ? 'Spot' : 'Spots'}`;
      if (genderBreakdown && (genderBreakdown.male > 0 || genderBreakdown.female > 0)) {
        const parts = [];
        if (genderBreakdown.male > 0) parts.push(`Male: ${genderBreakdown.male}`);
        if (genderBreakdown.female > 0) parts.push(`Female: ${genderBreakdown.female}`);
        ticketsValue = `${spots} ${Number(spots) === 1 ? 'Spot' : 'Spots'} (${parts.join(', ')})`;
      }

      const details = [
        { label: 'Attendee', value: userName },
        { label: 'Date', value: eventDate },
        { label: 'Time', value: eventTime },
        { label: 'Venue', value: venueName },
        { label: 'Tickets', value: ticketsValue },
        ...(pricingTier ? [{ label: 'Pricing Tier', value: pricingTier }] : []),
        { label: 'Booking ID', value: ticketNumber },
      ];

      for (const { label, value } of details) {
        doc.fill('#6b7280').fontSize(11).font('Helvetica')
          .text(label, 60, y, { width: 100 });
        const textHeight = doc.heightOfString(value || 'N/A', { width: pageWidth - 130 });
        doc.fill('#111827').fontSize(12).font('Helvetica-Bold')
          .text(value || 'N/A', 170, y, { width: pageWidth - 130 });
        y += Math.max(20, textHeight + 6);
      }

      y += 5;
      // ── Divider ──
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).strokeColor('#d1d5db').stroke();
      y += 20;

      // ── QR Code ──
      if (qrImageBuffer) {
        const qrSize = 120;
        const qrX = (doc.page.width - qrSize) / 2;
        try {
          doc.image(qrImageBuffer, qrX, y, { width: qrSize, height: qrSize });
          y += qrSize + 8;
        } catch {
          // skip QR if format issue
        }
      }

      doc.fill('#6b7280').fontSize(10).font('Helvetica')
        .text('Scan this QR code at the venue for entry', 40, y, { width: pageWidth, align: 'center' });
      y += 20;

      // ── Footer ──
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
      y += 10;

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
      doc.fill('#9ca3af').text('© 2026 IndulgeOut. All rights reserved.', 40, y, { width: pageWidth, align: 'center' });

      doc.end();
    } catch (err) {
      console.error('❌ [TicketPDF] Failed to build PDF:', err.message);
      resolve(null);
    }
  });
}

module.exports = { generateTicketPdf };
