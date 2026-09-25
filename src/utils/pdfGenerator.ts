import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { MemberInvoice, GymSettings } from '../types';
import { numberToWords } from './numberToWords';
import { formatDatePretty } from './dateUtils';
import { getRasterLogo } from './logoUtils';

/**
 * Downloads a Blob reliably across browser environments and sandboxed iframes.
 * Uses native link.click() which triggers standard browser download handling.
 */
export interface PdfGenerationResult {
  success: boolean;
  blobUrl?: string;
  dataUri?: string;
  filename: string;
}

/**
 * Downloads a Blob reliably across browser environments and sandboxed iframes.
 * Generates both object URL and Base64 Data URI for robust download and viewing.
 */
export function triggerDirectDownload(blob: Blob, filename: string, dataUri?: string): { blobUrl: string; dataUri?: string } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blobUrl: '', dataUri };
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  link.download = filename;
  link.style.position = 'fixed';
  link.style.left = '-9999px';
  link.style.top = '0';
  link.style.opacity = '0';
  document.body.appendChild(link);

  try {
    link.click();
  } catch (err) {
    console.warn('Standard link.click() error with blob, trying dataUri fallback:', err);
    if (dataUri) {
      try {
        link.href = dataUri;
        link.click();
      } catch (e2) {
        console.warn('Fallback link.click() with dataUri failed:', e2);
      }
    }
  }

  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch {
      // ignore
    }
  }, 2500);

  return { blobUrl, dataUri };
}

/**
 * Direct Vector jsPDF Fallback
 * Guarantees a clean, sharp A4 PDF without canvas dependency.
 * Replaces non-ASCII currency glyphs (like ₹) with 'Rs.' so Helvetica doesn't produce broken symbols.
 */
export function generateDirectVectorPdf(
  invoice: MemberInvoice,
  settings: GymSettings,
  rasterLogo?: string
): PdfGenerationResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const rightAlignX = pageWidth - margin;
  let currentY = 15;

  // Use ASCII-safe currency string for jsPDF's built-in Helvetica font
  const cur = settings.currencySymbol === '₹' ? 'Rs.' : settings.currencySymbol;

  // 1. Header: Gym Logo Image (Left)
  const logoBoxSize = 22; // 22mm x 22mm
  let textStartX = margin;
  let logoDrawn = false;

  const logoImg = rasterLogo || settings.logoBase64;
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', margin, currentY + 1, logoBoxSize, logoBoxSize);
      logoDrawn = true;
      textStartX = margin + logoBoxSize + 4;
    } catch {
      try {
        doc.addImage(logoImg, 'JPEG', margin, currentY + 1, logoBoxSize, logoBoxSize);
        logoDrawn = true;
        textStartX = margin + logoBoxSize + 4;
      } catch {
        // Continue to fallback emblem
      }
    }
  }

  if (!logoDrawn) {
    // Draw crisp Gym Emblem Badge
    doc.setFillColor(245, 158, 11); // Amber
    doc.roundedRect(margin, currentY + 1, logoBoxSize, logoBoxSize, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TBT', margin + logoBoxSize / 2, currentY + 10.5, { align: 'center' });
    doc.setFontSize(4.5);
    doc.text('FITNESS', margin + logoBoxSize / 2, currentY + 16, { align: 'center' });
    textStartX = margin + logoBoxSize + 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.gymName || 'The Body Town Gym & Spa', textStartX, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FITNESS CENTER & HEALTH CLUB', textStartX, currentY + 13);

  // Gym Address & GST (Right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const addressLines = doc.splitTextToSize(
    settings.address || 'SCO-45, 2nd Floor, Pocket, 1, NAC Rd, Sector-13, Chandigarh, 160101',
    85
  );
  let addrY = currentY + 4;
  addressLines.forEach((line: string) => {
    doc.text(line, rightAlignX, addrY, { align: 'right' });
    addrY += 3.8;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${settings.gstNumber || '04AAACB2194K1Z8'}`, rightAlignX, addrY, { align: 'right' });
  addrY += 3.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tel: ${settings.phone}  |  Email: ${settings.email}`, rightAlignX, addrY, { align: 'right' });

  currentY = Math.max(currentY + 28, addrY + 4);

  // Hairline
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, rightAlignX, currentY);
  currentY += 5;

  // 2. Receipt Meta 3-Column Row
  const metaBoxHeight = 19;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, metaBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE / PAYMENT RECEIPT', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Original for Recipient', rightAlignX - 4, currentY + 6, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 8, rightAlignX - 4, currentY + 8);

  const col1X = margin + 5;
  const col2X = margin + 65;
  const col3X = margin + 125;

  // Col 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT NO', col1X, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.receiptNumber, col1X, currentY + 16);

  // Col 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT DATE', col2X, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDatePretty(invoice.receiptDate), col2X, currentY + 16);

  // Col 3
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT MODE', col3X, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.paymentMethod, col3X, currentY + 16);

  // Status Badge
  const badgeX = rightAlignX - 22;
  const badgeY = currentY + 10;
  doc.setFillColor(209, 250, 229);
  doc.setDrawColor(110, 231, 183);
  doc.roundedRect(badgeX, badgeY, 18, 6.5, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('PAID', badgeX + 9, badgeY + 4.5, { align: 'center' });

  currentY += metaBoxHeight + 5;

  // 3. Member Details & Validity
  const memberBoxHeight = 27;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, memberBoxHeight, 2, 2, 'FD');

  const midColX = margin + 90;
  doc.setDrawColor(226, 232, 240);
  doc.line(midColX, currentY + 3, midColX, currentY + memberBoxHeight - 3);

  // Member Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (MEMBER DETAILS)', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customerName, margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Phone: ${invoice.customerPhone}`, margin + 4, currentY + 17);

  const addrPreview = invoice.customerAddress
    ? `Address: ${invoice.customerAddress}`
    : 'Address: Address on record';
  doc.text(doc.splitTextToSize(addrPreview, 80)[0], margin + 4, currentY + 22);

  // Validity Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MEMBERSHIP VALIDITY', midColX + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Plan Duration:', midColX + 5, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.durationMonths} ${invoice.durationMonths === 1 ? 'Month' : 'Months'}`, rightAlignX - 4, currentY + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Start Date:', midColX + 5, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDatePretty(invoice.startDate), rightAlignX - 4, currentY + 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Expiry Date:', midColX + 5, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(formatDatePretty(invoice.endDate), rightAlignX - 4, currentY + 22, { align: 'right' });

  currentY += memberBoxHeight + 6;

  // 4. Line Item Table
  const tableHeaderHeight = 8;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currentY, contentWidth, tableHeaderHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('S.N', margin + 3, currentY + 5.5);
  doc.text('DESCRIPTION / PLAN VALIDITY', margin + 14, currentY + 5.5);
  doc.text('MONTHS', margin + 86, currentY + 5.5, { align: 'center' });
  doc.text(`BASE (${cur})`, margin + 116, currentY + 5.5, { align: 'right' });
  doc.text('GST (18%)', margin + 146, currentY + 5.5, { align: 'right' });
  doc.text(`TOTAL (${cur})`, rightAlignX - 3, currentY + 5.5, { align: 'right' });

  currentY += tableHeaderHeight;
  const rowHeight = 14;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + rowHeight, rightAlignX, currentY + rowHeight);
  doc.rect(margin, currentY - tableHeaderHeight, contentWidth, tableHeaderHeight + rowHeight, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('01', margin + 3, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.description || 'Gym Membership Fee', margin + 14, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Full Gym Access: Strength & Cardio Floor, Locker, Free Weights', margin + 14, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.durationMonths} Mos`, margin + 86, currentY + 6.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text(invoice.basePrice.toFixed(2), margin + 116, currentY + 6.5, { align: 'right' });
  doc.text(invoice.taxAmount.toFixed(2), margin + 146, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(invoice.totalAmount.toFixed(2), rightAlignX - 3, currentY + 6.5, { align: 'right' });

  currentY += rowHeight + 5;

  // 5. Totals Box & Amount in Words
  const totalsWidth = 84;
  const totalsX = rightAlignX - totalsWidth;
  const totalsHeight = 35;
  const wordsWidth = 88;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, wordsWidth, totalsHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AMOUNT IN WORDS:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const words = numberToWords(invoice.totalAmount, settings.currencySymbol === '₹' ? 'Rupees' : 'Dollars');
  doc.text(doc.splitTextToSize(words, wordsWidth - 8), margin + 4, currentY + 12);

  // Totals Breakdown - Clean edge-to-edge alignment inside box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, currentY, totalsWidth, totalsHeight, 2, 2, 'FD');

  const printRow = (label: string, val: string, yPos: number, isMuted = false) => {
    doc.setFont('helvetica', isMuted ? 'normal' : 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(isMuted ? 100 : 71, isMuted ? 116 : 85, isMuted ? 139 : 105);
    doc.text(label, totalsX + 4, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, rightAlignX - 4, yPos, { align: 'right' });
  };

  printRow('Subtotal (Base Price):', `${cur} ${invoice.basePrice.toFixed(2)}`, currentY + 6);

  if (invoice.isTaxEnabled) {
    printRow('Central GST (CGST @ 9%):', `${cur} ${invoice.cgstAmount.toFixed(2)}`, currentY + 11.5, true);
    printRow('State GST (SGST @ 9%):', `${cur} ${invoice.sgstAmount.toFixed(2)}`, currentY + 17, true);
    printRow('Total GST Tax (18%):', `${cur} ${invoice.taxAmount.toFixed(2)}`, currentY + 22.5);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(totalsX + 4, currentY + 26, rightAlignX - 4, currentY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Amount Paid:', totalsX + 4, currentY + 31.5);
  doc.setFontSize(10.5);
  doc.setTextColor(29, 78, 216);
  doc.text(`${cur} ${invoice.totalAmount.toFixed(2)}`, rightAlignX - 4, currentY + 31.5, { align: 'right' });

  currentY += totalsHeight + 6;

  // 6. Terms & Conditions and Signatory
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, rightAlignX, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & CONDITIONS:', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const terms = [
    '1. Fees once paid are strictly non-refundable and non-transferable under any circumstances.',
    '2. Gym access card or registered biometric check-in is mandatory upon entry.',
    '3. Proper athletic gym attire and clean indoor training shoes must be worn on the workout floor.',
    '4. Members are required to re-rack all free weights and follow all gym safety etiquette.',
  ];
  let termY = currentY + 4;
  terms.forEach(t => {
    doc.text(t, margin, termY);
    termY += 3.5;
  });

  const signX = rightAlignX - 45;
  doc.setDrawColor(148, 163, 184);
  doc.line(signX, currentY + 12, rightAlignX, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signatory', signX + 22.5, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`For ${settings.gymName || 'The Body Town Gym & Spa'}`, signX + 22.5, currentY + 19.5, { align: 'center' });

  // 7. Bottom Thank You Note
  const footerY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, rightAlignX, footerY - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text('Thank you for your payment! Stay fit, healthy & strong.', pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated tax invoice. No signature is required.', pageWidth / 2, footerY + 3.5, { align: 'center' });

  const sanitizedReceipt = (invoice.receiptNumber || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedName = (invoice.customerName || 'Member').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Invoice_${sanitizedReceipt}_${sanitizedName}.pdf`;

  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');
  const { blobUrl } = triggerDirectDownload(blob, filename, dataUri);

  return { success: true, blobUrl, dataUri, filename };
}

/**
 * Creates an exact visual DOM receipt matching the w-[800px] p-8 layout
 * positioned at (0, 0) behind page context with z-index: -9999 so html2canvas renders it cleanly.
 */
function createDedicatedReceiptElement(invoice: MemberInvoice, settings: GymSettings): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px';
  container.style.minWidth = '800px';
  container.style.maxWidth = '800px';
  container.style.zIndex = '-99999';
  container.style.backgroundColor = '#ffffff';
  container.style.pointerEvents = 'none';

  const words = numberToWords(invoice.totalAmount, settings.currencySymbol === '₹' ? 'Rupees' : 'Dollars');

  container.innerHTML = `
    <div id="temp-invoice-capture" class="w-[800px] min-w-[800px] max-w-[800px] p-8 bg-white text-slate-800 border border-slate-300 font-sans box-border" style="width: 800px; min-width: 800px; max-width: 800px; padding: 32px; background-color: #ffffff; color: #1e293b; box-sizing: border-box; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;">
      <!-- 1. HEADER SECTION -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #cbd5e1;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 80px; height: 80px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 4px; display: flex; align-items: center; justify-content: center; background: #ffffff; overflow: hidden;">
            ${settings.logoBase64 ? `<img src="${settings.logoBase64}" alt="Gym Logo" style="width: 100%; height: 100%; object-fit: contain;" />` : '<span style="font-weight: 900; font-size: 24px; color: #d97706;">TBT</span>'}
          </div>
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">
              ${settings.gymName || 'The Body Town Gym & Spa'}
            </h1>
            <p style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; margin-bottom: 0;">
              Fitness Center &amp; Health Club
            </p>
          </div>
        </div>

        <div style="text-align: right; font-size: 12px; color: #475569; max-width: 340px; line-height: 1.4;">
          <p style="font-weight: 500; color: #1e293b; margin: 0 0 4px 0;">
            ${settings.address || 'SCO-45, 2nd Floor, Pocket, 1, NAC Rd, Sector-13, Chandigarh, 160101'}
          </p>
          <p style="font-family: monospace; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">
            GSTIN: <span>${settings.gstNumber || '04AAACB2194K1Z8'}</span>
          </p>
          <p style="margin: 0;">
            Tel: <span style="font-weight: 600; color: #0f172a;">${settings.phone}</span> | Email: <span style="font-weight: 600; color: #0f172a;">${settings.email}</span>
          </p>
        </div>
      </div>

      <!-- 2. INVOICE TITLE & 3-COLUMN METADATA ROW -->
      <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">
            TAX INVOICE / PAYMENT RECEIPT
          </span>
          <span style="font-size: 11px; color: #64748b;">
            Original for Recipient
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 12px;">
          <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
            <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Receipt No</span>
            <span style="display: block; font-family: monospace; font-weight: 700; font-size: 14px; color: #0f172a; margin-top: 4px;">
              ${invoice.receiptNumber}
            </span>
          </div>
          <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
            <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Receipt Date</span>
            <span style="display: block; font-weight: 700; font-size: 14px; color: #0f172a; margin-top: 4px;">
              ${formatDatePretty(invoice.receiptDate)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Payment Mode</span>
              <span style="display: block; font-weight: 700; font-size: 14px; color: #0f172a; margin-top: 4px;">
                ${invoice.paymentMethod}
              </span>
            </div>
            <div>
              <span style="display: inline-block; font-weight: 700; font-size: 11px; color: #065f46; background: #d1fae5; border: 1px solid #6ee7b7; padding: 4px 10px; border-radius: 4px;">
                PAID
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. MEMBER DETAILS & MEMBERSHIP VALIDITY -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; margin-bottom: 20px; background-color: #ffffff;">
        <div style="border-right: 1px solid #e2e8f0; padding-right: 16px;">
          <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
            Billed To (Member Details)
          </span>
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">
            ${invoice.customerName}
          </h3>
          <p style="margin: 0 0 2px 0; color: #334155;">
            Phone: <span style="font-family: monospace; font-weight: 600; color: #0f172a;">${invoice.customerPhone}</span>
          </p>
          <p style="margin: 0; color: #475569;">
            Address: ${invoice.customerAddress || 'Address on record'}
          </p>
        </div>

        <div style="padding-left: 8px;">
          <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
            Membership Validity
          </span>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
            <span style="color: #64748b;">Plan Duration:</span>
            <span style="font-weight: 700; color: #0f172a;">${invoice.durationMonths} ${invoice.durationMonths === 1 ? 'Month' : 'Months'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
            <span style="color: #64748b;">Start Date:</span>
            <span style="font-weight: 700; color: #0f172a;">${formatDatePretty(invoice.startDate)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #334155;">
            <span style="color: #64748b;">Expiry Date:</span>
            <span style="font-weight: 700; color: #b91c1c;">${formatDatePretty(invoice.endDate)}</span>
          </div>
        </div>
      </div>

      <!-- 4. PRICING LINE ITEM TABLE -->
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 10px 12px; width: 48px; text-align: center; border-right: 1px solid #334155;">S.N</th>
              <th style="padding: 10px 12px; border-right: 1px solid #334155;">Description / Plan Validity</th>
              <th style="padding: 10px 12px; text-align: center; border-right: 1px solid #334155; width: 80px;">Months</th>
              <th style="padding: 10px 12px; text-align: right; border-right: 1px solid #334155; width: 110px;">Base Price (${settings.currencySymbol})</th>
              <th style="padding: 10px 12px; text-align: right; border-right: 1px solid #334155; width: 100px;">GST (18%)</th>
              <th style="padding: 10px 12px; text-align: right; width: 110px;">Total (${settings.currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #ffffff; color: #1e293b;">
              <td style="padding: 12px; text-align: center; font-family: monospace; color: #64748b; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">01</td>
              <td style="padding: 12px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: #0f172a;">${invoice.description || 'Gym Membership Fee'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Full Gym Access: Strength &amp; Cardio Floor, Locker, Free Weights</div>
              </td>
              <td style="padding: 12px; text-align: center; font-weight: 600; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">${invoice.durationMonths} Mos</td>
              <td style="padding: 12px; text-align: right; font-family: monospace; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">${invoice.basePrice.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; font-family: monospace; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">${invoice.taxAmount.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${invoice.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 5. TOTALS BOX & AMOUNT IN WORDS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="padding: 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">
            Amount in Words:
          </span>
          <p style="font-weight: 600; color: #0f172a; margin: 0; line-height: 1.4;">
            ${words}
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
            <span>Subtotal (Base Price):</span>
            <span style="font-family: monospace; font-weight: 600; color: #0f172a; text-align: right;">${settings.currencySymbol} ${invoice.basePrice.toFixed(2)}</span>
          </div>
          ${invoice.isTaxEnabled ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
              <span>Central GST (CGST @ 9%):</span>
              <span style="font-family: monospace; text-align: right;">${settings.currencySymbol} ${invoice.cgstAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #334155;">
              <span>State GST (SGST @ 9%):</span>
              <span style="font-family: monospace; text-align: right;">${settings.currencySymbol} ${invoice.sgstAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #334155; font-weight: 600; padding-top: 4px; border-top: 1px solid #e2e8f0;">
              <span>Total GST Tax (18%):</span>
              <span style="font-family: monospace; text-align: right;">${settings.currencySymbol} ${invoice.taxAmount.toFixed(2)}</span>
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-style: italic; font-size: 11px;">
              <span>Tax (GST Exempt):</span>
              <span style="font-family: monospace; text-align: right;">0.00</span>
            </div>
          `}
          <div style="padding-top: 8px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: baseline; font-weight: 700;">
            <span style="font-size: 14px; color: #0f172a;">Total Amount Paid:</span>
            <span style="font-size: 16px; color: #1d4ed8; font-family: monospace; text-align: right;">${settings.currencySymbol} ${invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- 6. FOOTER: TERMS & CONDITIONS AND AUTHORIZED SIGNATORY -->
      <div style="padding-top: 16px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: 2fr 1fr; gap: 16px; font-size: 11px; color: #475569;">
        <div>
          <span style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
            Terms &amp; Conditions
          </span>
          <ol style="margin: 0; padding-left: 14px; line-height: 1.4;">
            <li>Fees once paid are strictly non-refundable and non-transferable under any circumstances.</li>
            <li>Gym access card or registered biometric check-in is mandatory upon entry.</li>
            <li>Proper athletic gym attire and clean indoor training shoes must be worn on the workout floor.</li>
            <li>Members are required to re-rack all free weights and follow all gym safety etiquette.</li>
          </ol>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center; padding-top: 12px;">
          <div style="width: 160px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
          <span style="font-weight: 700; color: #0f172a; font-size: 12px;">Authorized Signatory</span>
          <span style="font-size: 10px; color: #64748b;">For ${settings.gymName || 'The Body Town Gym & Spa'}</span>
        </div>
      </div>

      <!-- 7. BOTTOM THANK YOU NOTE -->
      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
        <p style="font-weight: 700; color: #1d4ed8; margin: 0;">
          Thank you for your payment! Stay fit, healthy &amp; strong.
        </p>
        <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0;">
          This is a computer-generated tax invoice. No signature is required.
        </p>
      </div>
    </div>
  `;

  return container;
}

/**
 * Generates an A4 PDF using the exact visual w-[800px] p-8 layout with html2canvas (scale: 2, useCORS: true)
 * and falls back safely to direct vector rendering if canvas capture is not available.
 */
export async function generateInvoicePDF(
  invoice: MemberInvoice,
  settings: GymSettings,
  targetElementId?: string
): Promise<PdfGenerationResult> {
  const sanitizedReceipt = (invoice.receiptNumber || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedName = (invoice.customerName || 'Member').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Invoice_${sanitizedReceipt}_${sanitizedName}.pdf`;

  // Pre-rasterize logo so both canvas capture and jsPDF direct vector guarantee the logo is embedded
  let rasterLogo = '';
  try {
    rasterLogo = await getRasterLogo(settings.logoBase64);
  } catch {
    rasterLogo = settings.logoBase64 || '';
  }

  const effectiveSettings = rasterLogo ? { ...settings, logoBase64: rasterLogo } : settings;

  try {
    // 1. Identify target element
    let targetEl: HTMLElement | null = null;
    let createdTempContainer: HTMLElement | null = null;

    if (targetElementId) {
      targetEl = document.getElementById(targetElementId);
    }

    if (!targetEl) {
      targetEl = document.getElementById('printable-invoice');
    }

    // 2. If element is not found or not rendered, dynamically create the exact A4 w-[800px] p-8 DOM structure
    if (!targetEl) {
      createdTempContainer = createDedicatedReceiptElement(invoice, settings);
      document.body.appendChild(createdTempContainer);
      targetEl = (createdTempContainer.firstElementChild as HTMLElement) || createdTempContainer;
    }

    if (targetEl) {
      try {
        // Wait for any images inside targetEl to be fully loaded
        const images = Array.from(targetEl.querySelectorAll('img'));
        if (images.length > 0) {
          await Promise.all(
            images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                setTimeout(resolve, 300);
              });
            })
          );
        }

        // Brief delay to ensure browser layout & fonts settle
        await new Promise(resolve => setTimeout(resolve, 80));

        // High-DPI capture with scale: 2 and useCORS: true explicitly
        const canvas = await html2canvas(targetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800,
          width: 800,
          scrollX: 0,
          scrollY: 0,
        });

        // Clean up temporary DOM node immediately after capture
        if (createdTempContainer && document.body.contains(createdTempContainer)) {
          document.body.removeChild(createdTempContainer);
          createdTempContainer = null;
        }

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));

        const blob = pdf.output('blob');
        const dataUri = pdf.output('datauristring');
        const { blobUrl } = triggerDirectDownload(blob, filename, dataUri);

        return { success: true, blobUrl, dataUri, filename };
      } catch (canvasErr) {
        console.warn('html2canvas capture issue, falling back to vector PDF:', canvasErr);
        if (createdTempContainer && document.body.contains(createdTempContainer)) {
          document.body.removeChild(createdTempContainer);
        }
      }
    }

    // Direct Vector PDF Fallback with guaranteed logo
    return generateDirectVectorPdf(invoice, effectiveSettings, rasterLogo);
  } catch (err) {
    console.error('generateInvoicePDF fatal error:', err);
    try {
      return generateDirectVectorPdf(invoice, effectiveSettings, rasterLogo);
    } catch {
      return { success: false, filename };
    }
  }
}
