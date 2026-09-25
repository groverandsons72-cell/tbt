import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Printer, 
  Eye, 
  Sparkles,
  Download,
  Percent,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { GymSettings, MemberInvoice, PaymentMethod } from '../types';
import { getTodayDateString, calculateEndDate, formatDatePretty } from '../utils/dateUtils';
import { numberToWords } from '../utils/numberToWords';
import { printInvoice } from '../utils/printInvoice';

interface InvoiceFormProps {
  settings: GymSettings;
  onSaveInvoice: (invoice: MemberInvoice, shouldDownloadPdf?: boolean) => void;
  onPreviewInvoice: (invoice: MemberInvoice) => void;
  renewalMember?: MemberInvoice | null;
  onClearRenewal?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  settings,
  onSaveInvoice,
  onPreviewInvoice,
  renewalMember,
  onClearRenewal,
}) => {
  const today = getTodayDateString();

  // Receipt meta
  const [receiptNumber, setReceiptNumber] = useState(
    `${settings.invoicePrefix}${settings.nextReceiptNumber}`
  );
  const [receiptDate, setReceiptDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Membership details
  const [planName, setPlanName] = useState('Standard Gym Membership');
  const [startDate, setStartDate] = useState(today);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [endDate, setEndDate] = useState(calculateEndDate(today, 1));
  const [description, setDescription] = useState('Gym Membership Fee');

  // Financials
  const [basePrice, setBasePrice] = useState<number>(2000);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTaxRate || 18);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sync receipt number when settings change
  useEffect(() => {
    if (!renewalMember) {
      setReceiptNumber(`${settings.invoicePrefix}${settings.nextReceiptNumber}`);
    }
  }, [settings.invoicePrefix, settings.nextReceiptNumber, renewalMember]);

  // Handle renewal prefill
  useEffect(() => {
    if (renewalMember) {
      setCustomerName(renewalMember.customerName);
      setCustomerPhone(renewalMember.customerPhone);
      setCustomerAddress(renewalMember.customerAddress || '');
      setCustomerEmail(renewalMember.customerEmail || '');
      setPlanName(renewalMember.planName);
      setDurationMonths(renewalMember.durationMonths);
      setBasePrice(renewalMember.basePrice);
      
      // If member expired, start from today; if still active, start from existing end date
      const renewalStart = new Date(renewalMember.endDate) > new Date() ? renewalMember.endDate : today;
      setStartDate(renewalStart);
      setEndDate(calculateEndDate(renewalStart, renewalMember.durationMonths));
      setDescription(`Membership Renewal: ${renewalMember.durationMonths} Months Gym Fee`);
    }
  }, [renewalMember, today]);

  // Recalculate end date whenever start date or duration changes
  useEffect(() => {
    const calculated = calculateEndDate(startDate, durationMonths);
    setEndDate(calculated);
  }, [startDate, durationMonths]);

  // Auto-compose description if user hasn't typed custom one
  const handleDurationPreset = (months: number, suggestedPrice: number, label: string) => {
    setDurationMonths(months);
    setBasePrice(suggestedPrice);
    setPlanName(label);
    setDescription(`${months} ${months === 1 ? 'Month' : 'Months'} ${label} Fee`);
  };

  // Math Calculations
  const calculatedTaxAmount = isTaxEnabled ? Number(((basePrice * taxRate) / 100).toFixed(2)) : 0;
  const calculatedCgst = Number((calculatedTaxAmount / 2).toFixed(2));
  const calculatedSgst = Number((calculatedTaxAmount / 2).toFixed(2));
  const calculatedTotal = Number((basePrice + calculatedTaxAmount).toFixed(2));

  const constructInvoiceObject = (): MemberInvoice => {
    return {
      id: `inv-${Date.now()}`,
      receiptNumber: receiptNumber.trim() || `${settings.invoicePrefix}${Date.now() % 10000}`,
      receiptDate,
      paymentMethod,
      paymentReference: paymentRef.trim() || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerEmail: customerEmail.trim() || undefined,
      planName,
      description: description.trim() || 'Gym Membership Fee',
      startDate,
      durationMonths,
      endDate,
      basePrice,
      taxRate: isTaxEnabled ? taxRate : 0,
      taxAmount: calculatedTaxAmount,
      cgstAmount: calculatedCgst,
      sgstAmount: calculatedSgst,
      totalAmount: calculatedTotal,
      isTaxEnabled,
      createdAt: new Date().toISOString(),
    };
  };

  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerEmail('');
    setBasePrice(2000);
    setDurationMonths(1);
    setStartDate(today);
    setDescription('Gym Membership Fee');
    setPaymentRef('');
    if (onClearRenewal) onClearRenewal();
  };

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Please enter member name and phone number.');
      return;
    }
    setFormError(null);
    const inv = constructInvoiceObject();
    onSaveInvoice(inv, false);
    handleResetForm();
  };

  const handleGenerateAndDownloadPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Please enter member name and phone number before generating PDF.');
      return;
    }
    setFormError(null);
    setIsGenerating(true);
    const inv = constructInvoiceObject();
    try {
      await onSaveInvoice(inv, true);
      handleResetForm();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Please enter member name and phone number before printing.');
      return;
    }
    setFormError(null);
    const inv = constructInvoiceObject();
    onSaveInvoice(inv, false);
    printInvoice(inv, settings);
    handleResetForm();
  };

  const handleTriggerPreview = () => {
    if (!customerName.trim()) {
      setFormError('Please enter customer name to preview the invoice.');
      return;
    }
    setFormError(null);
    const inv = constructInvoiceObject();
    onPreviewInvoice(inv);
  };

  return (
    <div id="invoice-generator" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Invoice &amp; Receipt Generator</h2>
              {renewalMember && (
                <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
                  Renewing: {renewalMember.customerName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Generate GST-compliant tax invoices, auto-calculate 18% GST (CGST + SGST), and log memberships
            </p>
          </div>
        </div>

        {/* Quick Plan Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium hidden lg:inline mr-1">Quick Plans:</span>
          <button
            type="button"
            onClick={() => handleDurationPreset(1, 2000, 'Standard Gym')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors cursor-pointer ${
              durationMonths === 1
                ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            1 Mo (₹2k)
          </button>
          <button
            type="button"
            onClick={() => handleDurationPreset(3, 5000, 'Quarterly Strength')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors cursor-pointer ${
              durationMonths === 3
                ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            3 Mos (₹5k)
          </button>
          <button
            type="button"
            onClick={() => handleDurationPreset(6, 9000, 'Semi-Annual Fitness')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors cursor-pointer ${
              durationMonths === 6
                ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            6 Mos (₹9k)
          </button>
          <button
            type="button"
            onClick={() => handleDurationPreset(12, 16000, 'Annual VIP Access')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors cursor-pointer ${
              durationMonths === 12
                ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            12 Mos (₹16k)
          </button>
        </div>
      </div>

      <form className="p-6 space-y-6">
        {/* SECTION 1: RECEIPT DETAILS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">01. Receipt Meta</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Receipt Number <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                placeholder="TBT-2026-1001"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Receipt Date <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Method <span className="text-amber-600">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Card">Debit / Credit Card (POS)</option>
                <option value="Net Banking">Net Banking / NEFT / IMPS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Transaction ID / Ref (Optional)
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. UPI-984218"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CUSTOMER DETAILS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">02. Member Details</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Member Full Name <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="+91 98765 00000"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Residential Address / Area
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. Flat 301, Sector 21"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="member@domain.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: MEMBERSHIP VALIDITY & DESCRIPTION */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">03. Membership Plan &amp; Dates</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Start Date (Calendar) <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Duration in Months <span className="text-amber-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                >
                  <option value={1}>1 Month (Monthly Pass)</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months (Quarterly)</option>
                  <option value={6}>6 Months (Half-Yearly)</option>
                  <option value={12}>12 Months (Annual)</option>
                  <option value={24}>24 Months (2 Years VIP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Date (Auto-Calculated)
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-amber-900 font-mono flex items-center justify-between shadow-2xs">
                <span>{endDate ? formatDatePretty(endDate) : '—'}</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                  +{durationMonths}m
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description on Invoice <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Gym Membership Fee"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: FINANCIALS & AUTOMATIC GST CALCULATOR */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">04. Financials &amp; GST Engine</span>
              <div className="h-px bg-slate-200 flex-1 mr-4" />
            </div>

            {/* GST 18% Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-700 font-medium cursor-pointer flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={isTaxEnabled}
                  onChange={(e) => setIsTaxEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-white border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <span>Apply 18% GST (9% CGST + 9% SGST)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs: Base Price */}
            <div className="lg:col-span-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Membership Base Price ({settings.currencySymbol}) <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono text-base font-bold">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={basePrice || ''}
                    onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
                    required
                    min={0}
                    step={10}
                    placeholder="2000"
                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-lg text-slate-900 font-mono tabular-nums font-bold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Amount In Words Live Feedback */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                  Amount In Words:
                </div>
                <div className="text-xs text-slate-800 font-medium italic">
                  {numberToWords(calculatedTotal, settings.currencySymbol === '₹' ? 'Rupees' : 'Dollars')}
                </div>
              </div>
            </div>

            {/* Financial Breakdown Panel */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-slate-700 text-xs">
                  <span className="font-medium text-slate-700">Subtotal (Base Price):</span>
                  <span className="font-mono tabular-nums text-slate-900 font-semibold text-sm">
                    {settings.currencySymbol} {basePrice.toFixed(2)}
                  </span>
                </div>

                {isTaxEnabled ? (
                  <>
                    <div className="flex justify-between items-center text-slate-700 text-xs">
                      <span>Central GST (CGST @ 9%):</span>
                      <span className="font-mono tabular-nums text-slate-800 text-xs font-medium">
                        +{settings.currencySymbol} {calculatedCgst.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700 text-xs">
                      <span>State GST (SGST @ 9%):</span>
                      <span className="font-mono tabular-nums text-slate-800 text-xs font-medium">
                        +{settings.currencySymbol} {calculatedSgst.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-800 text-xs font-semibold pt-1 border-t border-slate-200">
                      <span>Total GST Tax (18%):</span>
                      <span className="font-mono tabular-nums text-slate-900 font-bold text-xs">
                        +{settings.currencySymbol} {calculatedTaxAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-slate-500 text-xs italic">
                    <span>Tax (GST Exempt / Non-Taxable):</span>
                    <span className="font-mono tabular-nums">0.00</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-900">Total Amount Paid:</span>
                    <span className="block text-[11px] text-slate-500">All inclusive receipt amount</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
                      {settings.currencySymbol} {calculatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner if any */}
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* SECTION 5: ACTION CONTROLS */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              Clear / Reset Form
            </button>
            <button
              type="button"
              onClick={handleTriggerPreview}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Receipt</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Save Member</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndPrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Save invoice and open browser Print / Save as PDF dialog"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Save &amp; Print</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAndDownloadPdf}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Downloading PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Save &amp; Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
