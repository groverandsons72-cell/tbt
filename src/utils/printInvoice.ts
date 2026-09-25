import { MemberInvoice, GymSettings } from '../types';
import { formatDatePretty } from './dateUtils';
import { numberToWords } from './numberToWords';

/**
 * Generates clean, self-contained HTML for an invoice receipt
 * styled specifically for A4 printing.
 */
export function getPrintableInvoiceHtml(invoice: MemberInvoice, settings: GymSettings): string {
  const words = numberToWords(
    invoice.totalAmount,
    settings.currencySymbol === '₹' ? 'Rupees' : 'Dollars'
  );
  const cur = settings.currencySymbol;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoice.receiptNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .invoice-card {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #0f172a;
    }
    .gym-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-box {
      width: 72px;
      height: 72px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      overflow: hidden;
    }
    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .logo-placeholder {
      font-weight: 900;
      font-size: 22px;
      color: #d97706;
    }
    .gym-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .gym-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 3px 0 0 0;
    }
    .gym-address {
      text-align: right;
      font-size: 11px;
      color: #475569;
      max-width: 320px;
      line-height: 1.35;
    }
    .gym-address p {
      margin: 0 0 3px 0;
    }
    .gstin-badge {
      font-family: monospace;
      font-weight: 700;
      color: #0f172a;
      font-size: 11.5px;
    }

    .meta-box {
      margin: 16px 0;
      padding: 12px 16px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .meta-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .meta-copy {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      font-size: 11px;
    }
    .meta-item {
      border-right: 1px solid #e2e8f0;
      padding-right: 10px;
    }
    .meta-item:last-child {
      border-right: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      display: block;
    }
    .meta-val {
      display: block;
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-top: 2px;
    }
    .paid-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 10px;
      color: #065f46;
      background: #d1fae5;
      border: 1px solid #6ee7b7;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .members-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 16px;
      background-color: #ffffff;
      font-size: 11px;
    }
    .member-col {
      border-right: 1px solid #e2e8f0;
      padding-right: 14px;
    }
    .member-heading {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
      display: block;
    }
    .member-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .validity-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      color: #334155;
    }
    .validity-row strong {
      color: #0f172a;
    }
    .validity-expiry {
      color: #b91c1c !important;
      font-weight: 700;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .items-table th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      font-weight: 700;
      text-align: left;
    }
    .items-table td {
      padding: 10px;
      border-top: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace, monospace; }

    .totals-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }
    .words-box {
      padding: 12px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11px;
    }
    .totals-box {
      background-color: #f8fafc;
      padding: 12px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      color: #334155;
    }
    .totals-row span:last-child {
      font-family: monospace;
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .totals-tax-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      color: #475569;
      font-size: 10.5px;
    }
    .totals-tax-row span:last-child {
      font-family: monospace;
      text-align: right;
    }
    .totals-grand {
      padding-top: 6px;
      margin-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-weight: 800;
    }
    .totals-grand .label {
      font-size: 12.5px;
      color: #0f172a;
    }
    .totals-grand .amount {
      font-size: 15px;
      color: #1d4ed8;
      font-family: monospace;
      text-align: right;
    }

    .terms-row {
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 14px;
      font-size: 9.5px;
      color: #475569;
    }
    .terms-row ol {
      margin: 0;
      padding-left: 14px;
      line-height: 1.35;
    }
    .signatory {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      text-align: center;
    }
    .sign-line {
      width: 140px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 4px;
    }
    .sign-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 10.5px;
    }

    .footer-note {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10.5px;
    }
    .footer-note strong {
      color: #1d4ed8;
    }
    .footer-note p {
      margin: 2px 0 0 0;
      color: #94a3b8;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- 1. Header -->
    <div class="header-row">
      <div class="gym-info">
        <div class="logo-box">
          ${
            settings.logoBase64
              ? `<img src="${settings.logoBase64}" alt="Gym Logo" />`
              : `<span class="logo-placeholder">TBT</span>`
          }
        </div>
        <div>
          <h1 class="gym-title">${settings.gymName || 'The Body Town Gym & Spa'}</h1>
          <p class="gym-subtitle">Fitness Center &amp; Health Club</p>
        </div>
      </div>
      <div class="gym-address">
        <p style="font-weight: 600; color: #0f172a;">${settings.address || 'SCO-45, 2nd Floor, Pocket, 1, NAC Rd, Sector-13, Chandigarh, 160101'}</p>
        <p class="gstin-badge">GSTIN: ${settings.gstNumber || '04AAACB2194K1Z8'}</p>
        <p>Tel: <strong>${settings.phone}</strong> | Email: <strong>${settings.email}</strong></p>
      </div>
    </div>

    <!-- 2. Meta Info -->
    <div class="meta-box">
      <div class="meta-title-row">
        <span class="meta-title">TAX INVOICE / PAYMENT RECEIPT</span>
        <span class="meta-copy">Original for Recipient</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Receipt No</span>
          <span class="meta-val font-mono">${invoice.receiptNumber}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Receipt Date</span>
          <span class="meta-val">${formatDatePretty(invoice.receiptDate)}</span>
        </div>
        <div class="meta-item">
          <div>
            <span class="meta-label">Payment Mode</span>
            <span class="meta-val">${invoice.paymentMethod}</span>
          </div>
          <span class="paid-badge">PAID</span>
        </div>
      </div>
    </div>

    <!-- 3. Member & Validity Details -->
    <div class="members-grid">
      <div class="member-col">
        <span class="member-heading">Billed To (Member Details)</span>
        <h3 class="member-name">${invoice.customerName}</h3>
        <p style="margin: 0 0 2px 0;">Phone: <span class="font-mono" style="font-weight: 600;">${invoice.customerPhone}</span></p>
        <p style="margin: 0; color: #64748b;">Address: ${invoice.customerAddress || 'Address on record'}</p>
      </div>
      <div>
        <span class="member-heading">Membership Validity</span>
        <div class="validity-row">
          <span>Plan Duration:</span>
          <strong>${invoice.durationMonths} ${invoice.durationMonths === 1 ? 'Month' : 'Months'}</strong>
        </div>
        <div class="validity-row">
          <span>Start Date:</span>
          <strong>${formatDatePretty(invoice.startDate)}</strong>
        </div>
        <div class="validity-row">
          <span>Expiry Date:</span>
          <span class="validity-expiry">${formatDatePretty(invoice.endDate)}</span>
        </div>
      </div>
    </div>

    <!-- 4. Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 44px;" class="text-center">S.N</th>
          <th>Description / Plan Validity</th>
          <th style="width: 80px;" class="text-center">Months</th>
          <th style="width: 110px;" class="text-right">Base Price (${cur})</th>
          <th style="width: 100px;" class="text-right">GST (18%)</th>
          <th style="width: 110px;" class="text-right">Total (${cur})</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center font-mono" style="color: #64748b;">01</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${invoice.description || 'Gym Membership Fee'}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Full Gym Access: Strength &amp; Cardio Floor, Locker, Free Weights</div>
          </td>
          <td class="text-center" style="font-weight: 600;">${invoice.durationMonths} Mos</td>
          <td class="text-right font-mono">${invoice.basePrice.toFixed(2)}</td>
          <td class="text-right font-mono">${invoice.taxAmount.toFixed(2)}</td>
          <td class="text-right font-mono" style="font-weight: 700; color: #0f172a;">${invoice.totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- 5. Totals & Words -->
    <div class="totals-wrapper">
      <div class="words-box">
        <span class="member-heading">Amount in Words:</span>
        <p style="font-weight: 700; color: #0f172a; margin: 4px 0 0 0; line-height: 1.35;">${words}</p>
        ${
          invoice.paymentReference
            ? `<p style="font-size: 10px; color: #64748b; margin-top: 8px;">Ref: <span class="font-mono">${invoice.paymentReference}</span></p>`
            : ''
        }
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal (Base Price):</span>
          <span>${cur} ${invoice.basePrice.toFixed(2)}</span>
        </div>
        ${
          invoice.isTaxEnabled
            ? `
          <div class="totals-tax-row">
            <span>Central GST (CGST @ 9%):</span>
            <span>${cur} ${invoice.cgstAmount.toFixed(2)}</span>
          </div>
          <div class="totals-tax-row">
            <span>State GST (SGST @ 9%):</span>
            <span>${cur} ${invoice.sgstAmount.toFixed(2)}</span>
          </div>
          <div class="totals-tax-row" style="font-weight: 600; color: #0f172a; padding-top: 3px; border-top: 1px solid #e2e8f0;">
            <span>Total GST Tax (18%):</span>
            <span>${cur} ${invoice.taxAmount.toFixed(2)}</span>
          </div>
        `
            : `
          <div class="totals-tax-row" style="font-style: italic;">
            <span>Tax (GST Exempt):</span>
            <span>${cur} 0.00</span>
          </div>
        `
        }
        <div class="totals-grand">
          <span class="label">Total Amount Paid:</span>
          <span class="amount">${cur} ${invoice.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- 6. Terms & Signatory -->
    <div class="terms-row">
      <div>
        <span class="member-heading">Terms &amp; Conditions</span>
        <ol>
          <li>Fees once paid are strictly non-refundable and non-transferable under any circumstances.</li>
          <li>Gym access card or registered biometric check-in is mandatory upon entry.</li>
          <li>Proper athletic gym attire and clean indoor training shoes must be worn on the workout floor.</li>
          <li>Members are required to re-rack all free weights and follow all gym safety etiquette.</li>
        </ol>
      </div>
      <div class="signatory">
        <div class="sign-line"></div>
        <span class="sign-title">Authorized Signatory</span>
        <span style="font-size: 9px; color: #64748b;">For ${settings.gymName || 'The Body Town Gym & Spa'}</span>
      </div>
    </div>

    <!-- 7. Footer -->
    <div class="footer-note">
      <strong>Thank you for your payment! Stay fit, healthy &amp; strong.</strong>
      <p>This is a computer-generated tax invoice. No signature is required.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Universal print handler that triggers printing cleanly in both
 * standard browser windows and sandboxed iframes.
 */
export function printInvoice(invoice: MemberInvoice, settings: GymSettings) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const html = getPrintableInvoiceHtml(invoice, settings);

  let portal = document.getElementById('active-print-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'active-print-portal';
    document.body.appendChild(portal);
  }

  // Inject receipt HTML with self-contained, isolated print rules
  portal.innerHTML = `
    <style id="active-print-style">
      @media print {
        @page {
          size: A4 portrait;
          margin: 6mm 10mm;
        }
        body > *:not(#active-print-portal) {
          display: none !important;
        }
        #active-print-portal {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 800px !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          visibility: visible !important;
          z-index: 9999999 !important;
        }
        #active-print-portal * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
      @media screen {
        #active-print-portal {
          display: none !important;
        }
      }
    </style>
    ${html}
  `;

  // Brief pause for browser DOM to mount images and fonts, then trigger native print
  setTimeout(() => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Native window.print() error:', e);
    }
  }, 120);
}
