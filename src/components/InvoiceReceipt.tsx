import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MemberInvoice, GymSettings } from '../types';
import { formatDatePretty } from '../utils/dateUtils';
import { numberToWords } from '../utils/numberToWords';

interface InvoiceReceiptProps {
  invoice: MemberInvoice;
  settings: GymSettings;
  id?: string;
}

export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({
  invoice,
  settings,
  id = 'printable-invoice',
}) => {
  return (
    <div
      id={id}
      style={{ width: '800px', minWidth: '800px', maxWidth: '800px', backgroundColor: '#ffffff', color: '#1e293b' }}
      className="w-[800px] min-w-[800px] max-w-[800px] p-8 bg-white text-slate-800 border border-slate-300 rounded-none shadow-none font-sans box-border"
    >
      {/* 1. HEADER SECTION: Gym Logo (left) and Gym Address/GST (right) */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-300">
        {/* Left: Logo & Gym Name */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            {settings.logoBase64 ? (
              <img
                src={settings.logoBase64}
                alt={settings.gymName}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-xl font-black text-amber-600">TBT</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {settings.gymName || 'The Body Town Gym & Spa'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
              Fitness Center &amp; Health Club
            </p>
          </div>
        </div>

        {/* Right: Address & GSTIN Details */}
        <div className="text-right text-xs text-slate-600 max-w-[340px] space-y-1">
          <p className="font-medium text-slate-800 leading-snug">
            {settings.address || 'SCO-45, 2nd Floor, Pocket, 1, NAC Rd, Sector-13, Chandigarh, 160101'}
          </p>
          <p className="font-mono font-bold text-slate-900">
            GSTIN: <span className="text-slate-900">{settings.gstNumber || '04AAACB2194K1Z8'}</span>
          </p>
          <p className="text-slate-600">
            Tel: <span className="font-medium text-slate-800">{settings.phone}</span> | Email: <span className="font-medium text-slate-800">{settings.email}</span>
          </p>
          {settings.website && (
            <p className="text-slate-500 text-[11px]">{settings.website}</p>
          )}
        </div>
      </div>

      {/* 2. INVOICE TITLE & DYNAMIC 3-COLUMN METADATA ROW */}
      <div className="my-5 p-4 bg-slate-50 border border-slate-300 rounded-lg">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <div>
            <span className="text-base font-black text-slate-900 tracking-wide">
              TAX INVOICE / PAYMENT RECEIPT
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Original for Recipient
          </div>
        </div>

        {/* Dynamic 3-Column Distribution Row */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          {/* Column 1: Receipt Number */}
          <div className="border-r border-slate-200 pr-3">
            <span className="text-slate-500 block text-[11px] uppercase font-semibold tracking-wider">
              Receipt No
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
              {invoice.receiptNumber}
            </span>
          </div>

          {/* Column 2: Date */}
          <div className="border-r border-slate-200 pr-3">
            <span className="text-slate-500 block text-[11px] uppercase font-semibold tracking-wider">
              Receipt Date
            </span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {formatDatePretty(invoice.receiptDate)}
            </span>
          </div>

          {/* Column 3: Payment Mode & Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px] uppercase font-semibold tracking-wider">
                Payment Mode
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {invoice.paymentMethod}
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded text-xs border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                PAID
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MEMBER DETAILS & MEMBERSHIP VALIDITY */}
      <div className="grid grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg text-xs mb-5 bg-white">
        {/* Left: Member Information */}
        <div className="border-r border-slate-200 pr-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Billed To (Member Details)
          </span>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            {invoice.customerName}
          </h3>
          <p className="text-slate-700 mt-1 font-medium">
            Phone: <span className="font-mono text-slate-900">{invoice.customerPhone}</span>
          </p>
          <p className="text-slate-600 mt-0.5">
            Address: {invoice.customerAddress || 'Address on record'}
          </p>
          {invoice.customerEmail && (
            <p className="text-slate-500 mt-0.5">Email: {invoice.customerEmail}</p>
          )}
        </div>

        {/* Right: Membership Validity */}
        <div className="pl-2 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Membership Validity
          </span>
          <div className="flex justify-between items-center text-slate-700">
            <span className="text-slate-500">Plan Duration:</span>
            <span className="font-bold text-slate-900">
              {invoice.durationMonths} {invoice.durationMonths === 1 ? 'Month' : 'Months'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span className="text-slate-500">Start Date:</span>
            <span className="font-bold text-slate-900">
              {formatDatePretty(invoice.startDate)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span className="text-slate-500">Expiry Date:</span>
            <span className="font-bold text-red-700">
              {formatDatePretty(invoice.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. PRICING LINE-ITEM TABLE */}
      <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700">S.N</th>
              <th className="py-2.5 px-3 border-r border-slate-700">Description / Plan Validity</th>
              <th className="py-2.5 px-3 text-center border-r border-slate-700 w-24">Months</th>
              <th className="py-2.5 px-3 text-right border-r border-slate-700 w-32">
                Base Price ({settings.currencySymbol})
              </th>
              <th className="py-2.5 px-3 text-right border-r border-slate-700 w-28">
                GST (18%)
              </th>
              <th className="py-2.5 px-3 text-right w-32">
                Total ({settings.currencySymbol})
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
            <tr>
              <td className="py-3 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                01
              </td>
              <td className="py-3 px-3 border-r border-slate-200">
                <div className="font-bold text-slate-900 text-xs">
                  {invoice.description || 'Gym Membership Fee'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Full Gym Access: Strength &amp; Cardio Floor, Locker, Free Weights
                </div>
              </td>
              <td className="py-3 px-3 text-center font-medium border-r border-slate-200">
                {invoice.durationMonths} Mos
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums border-r border-slate-200">
                {invoice.basePrice.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 border-r border-slate-200">
                {invoice.taxAmount.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                {invoice.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. TOTALS BOX & AMOUNT IN WORDS */}
      <div className="grid grid-cols-12 gap-4 items-start mb-6">
        {/* Left Side: Amount in Words */}
        <div className="col-span-6 space-y-2">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Amount in Words:
            </span>
            <p className="font-semibold text-slate-900 leading-snug">
              {numberToWords(invoice.totalAmount, settings.currencySymbol === '₹' ? 'Rupees' : 'Dollars')}
            </p>
          </div>

          {invoice.paymentReference && (
            <p className="text-[11px] text-slate-600">
              Payment Reference: <span className="font-mono font-medium text-slate-900">{invoice.paymentReference}</span>
            </p>
          )}
        </div>

        {/* Right Side: Totals Calculation Box */}
        <div className="col-span-6 bg-slate-50 p-3.5 border border-slate-300 rounded-lg text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-medium text-slate-700">Subtotal (Base Price):</span>
            <span className="font-mono tabular-nums text-slate-900 font-semibold text-right">
              {settings.currencySymbol} {invoice.basePrice.toFixed(2)}
            </span>
          </div>

          {invoice.isTaxEnabled ? (
            <>
              <div className="flex justify-between items-center text-slate-700">
                <span>Central GST (CGST @ 9%):</span>
                <span className="font-mono tabular-nums text-slate-800 text-right">
                  {settings.currencySymbol} {invoice.cgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>State GST (SGST @ 9%):</span>
                <span className="font-mono tabular-nums text-slate-800 text-right">
                  {settings.currencySymbol} {invoice.sgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-800 font-medium pt-1 border-t border-slate-200">
                <span>Total GST Tax (18%):</span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold text-right">
                  {settings.currencySymbol} {invoice.taxAmount.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center text-slate-500 italic">
              <span>Tax (GST Exempt):</span>
              <span className="font-mono tabular-nums text-right">
                {settings.currencySymbol} 0.00
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-bold text-slate-900">
            <span className="text-xs font-bold text-slate-900">Total Amount Paid:</span>
            <span className="text-sm font-bold text-blue-700 font-mono tabular-nums text-right">
              {settings.currencySymbol} {invoice.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. FOOTER: TERMS & CONDITIONS (1 TO 4) AND AUTHORIZED SIGNATORY */}
      <div className="pt-4 border-t border-slate-300 grid grid-cols-12 gap-4 text-[11px] text-slate-600">
        {/* Terms & Conditions Block */}
        <div className="col-span-8 space-y-1">
          <span className="font-bold text-slate-800 block uppercase text-[10px] tracking-wider">
            Terms &amp; Conditions
          </span>
          <ol className="list-decimal pl-3.5 space-y-0.5 text-slate-600 leading-snug">
            <li>Fees once paid are strictly non-refundable and non-transferable under any circumstances.</li>
            <li>Gym access card or registered biometric check-in is mandatory upon entry.</li>
            <li>Proper athletic gym attire and clean indoor training shoes must be worn on the workout floor.</li>
            <li>Members are required to re-rack all free weights and follow all gym safety etiquette.</li>
          </ol>
        </div>

        {/* Authorized Signatory Placeholder */}
        <div className="col-span-4 flex flex-col justify-end items-center text-center pt-2">
          <div className="w-40 border-b border-slate-400 pb-1 mb-1.5" />
          <span className="font-bold text-slate-800 text-xs">Authorized Signatory</span>
          <span className="text-[10px] text-slate-500">For {settings.gymName || 'The Body Town Gym & Spa'}</span>
        </div>
      </div>

      {/* 7. BOTTOM FOOTER NOTE */}
      <div className="mt-6 pt-3 border-t border-slate-200 text-center text-xs">
        <p className="font-bold text-blue-700">
          Thank you for your payment! Stay fit, healthy &amp; strong.
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          This is a computer-generated tax invoice. No signature is required.
        </p>
      </div>
    </div>
  );
};
