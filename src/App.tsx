import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Settings, 
  Receipt,
  Download,
  CheckCircle2,
  FileDown,
  Printer,
  Eye
} from 'lucide-react';
import { GymSettings, MemberInvoice } from './types';
import { DEFAULT_GYM_SETTINGS } from './utils/defaultLogo';
import { getInitialSampleInvoices } from './utils/sampleData';
import { getMembershipStatus } from './utils/dateUtils';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { printInvoice } from './utils/printInvoice';
import { Navbar } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { MembershipTable } from './components/MembershipTable';
import { InvoiceReceipt } from './components/InvoiceReceipt';

const SETTINGS_STORAGE_KEY = 'tbt_gym_billing_settings';
const INVOICES_STORAGE_KEY = 'tbt_gym_invoices_history';

interface ToastState {
  message: string;
  downloadUrl?: string;
  dataUri?: string;
  filename?: string;
  invoice?: MemberInvoice;
}

export default function App() {
  // 1. Gym Permanent Settings State
  const [settings, setSettings] = useState<GymSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_GYM_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading settings from localStorage:', e);
    }
    return DEFAULT_GYM_SETTINGS;
  });

  // 2. Member Invoices State
  const [invoices, setInvoices] = useState<MemberInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading invoices from localStorage:', e);
    }
    return getInitialSampleInvoices();
  });

  // UI Modals & Notifications
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<MemberInvoice | null>(null);
  const [renewalMember, setRenewalMember] = useState<MemberInvoice | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [captureInvoice, setCaptureInvoice] = useState<MemberInvoice | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices:', e);
    }
  }, [invoices]);

  const showToast = (
    message: string,
    downloadUrl?: string,
    filename?: string,
    dataUri?: string,
    invoice?: MemberInvoice
  ) => {
    setToast({ message, downloadUrl, filename, dataUri, invoice });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 14000);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: GymSettings) => {
    setSettings(newSettings);
    showToast('Gym details and billing configurations updated.');
  };

  // Save or Generate Invoice
  const handleSaveInvoice = async (newInvoice: MemberInvoice, shouldDownloadPdf = false) => {
    // 1. Add to invoices list
    setInvoices(prev => [newInvoice, ...prev]);

    // 2. Increment next receipt number in settings
    setSettings(prev => ({
      ...prev,
      nextReceiptNumber: prev.nextReceiptNumber + 1,
    }));

    // 3. Clear renewal state if active
    setRenewalMember(null);

    // 4. Update capture invoice for off-screen rendering
    setCaptureInvoice(newInvoice);

    // 5. Download PDF if requested
    if (shouldDownloadPdf) {
      showToast(`Preparing invoice ${newInvoice.receiptNumber}...`);
      // Open preview modal so user has direct, full access to Print and Download
      setPreviewInvoice(newInvoice);

      await new Promise(r => setTimeout(r, 80));
      const res = await generateInvoicePDF(newInvoice, settings, 'dedicated-printable-invoice');
      if (res.success) {
        showToast(
          `Invoice ${newInvoice.receiptNumber} ready!`,
          res.blobUrl,
          res.filename,
          res.dataUri,
          newInvoice
        );
      } else {
        showToast(`Invoice ${newInvoice.receiptNumber} recorded!`, undefined, undefined, undefined, newInvoice);
      }
    } else {
      showToast(`Invoice ${newInvoice.receiptNumber} recorded successfully!`, undefined, undefined, undefined, newInvoice);
    }

    // Scroll to table smoothly to view entry
    setTimeout(() => {
      document.getElementById('members-tracker')?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const handleDownloadInvoice = async (invoice: MemberInvoice) => {
    setCaptureInvoice(invoice);
    showToast(`Generating PDF for ${invoice.receiptNumber}...`);
    await new Promise(r => setTimeout(r, 80));
    const res = await generateInvoicePDF(invoice, settings, 'dedicated-printable-invoice');
    if (res.success) {
      showToast(
        `Invoice ${invoice.receiptNumber} ready to download!`,
        res.blobUrl,
        res.filename,
        res.dataUri,
        invoice
      );
    } else {
      showToast(`Could not generate PDF for ${invoice.receiptNumber}`);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    showToast('Invoice record deleted.');
  };

  const handleRenewMember = (member: MemberInvoice) => {
    setRenewalMember(member);
    document.getElementById('invoice-generator')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Loaded renewal form for ${member.customerName}.`);
  };

  const handleLoadSampleData = () => {
    const samples = getInitialSampleInvoices();
    setInvoices(samples);
    showToast('Sample test members loaded successfully.');
  };

  const scrollToInvoice = () => {
    document.getElementById('invoice-generator')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMembers = () => {
    document.getElementById('members-tracker')?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeCount = invoices.filter(
    inv => getMembershipStatus(inv.endDate).status === 'ACTIVE'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-neutral-950">
      {/* 1. TOP BAR */}
      <Navbar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onScrollToInvoice={scrollToInvoice}
        onScrollToMembers={scrollToMembers}
        activeMemberCount={activeCount}
      />

      {/* TOAST BANNER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200 flex-wrap max-w-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {toast.invoice && (
              <button
                type="button"
                onClick={() => printInvoice(toast.invoice!, settings)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors border border-slate-600 cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print</span>
              </button>
            )}
            {(toast.dataUri || toast.downloadUrl) && (
              <a
                href={toast.dataUri || toast.downloadUrl}
                download={toast.filename || 'invoice.pdf'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                title="Save PDF file directly"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </a>
            )}
            {toast.invoice && (
              <button
                type="button"
                onClick={() => setPreviewInvoice(toast.invoice!)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
                title="Open Preview Modal"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED OFF-SCREEN CONTAINER FOR PDF GENERATION */}
      <div
        id="dedicated-pdf-wrapper"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '800px',
          minWidth: '800px',
          maxWidth: '800px',
          zIndex: -999,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <div className="w-[800px] min-w-[800px] max-w-[800px] p-8 bg-white text-slate-800 border border-slate-300">
          <InvoiceReceipt
            invoice={captureInvoice || previewInvoice || invoices[0] || getInitialSampleInvoices()[0]}
            settings={settings}
            id="dedicated-printable-invoice"
          />
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* GYM BRANDING HERO BANNER */}
        <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 p-2 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                {settings.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt={settings.gymName}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Dumbbell className="w-10 h-10 text-amber-500" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {settings.gymName}
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300">
                    GST: {settings.gstNumber || 'Unregistered'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                  {settings.address}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>Tel: {settings.phone}</span>
                  <span>·</span>
                  <span>Email: {settings.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Gym Details</span>
              </button>
              <button
                onClick={scrollToInvoice}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Issue Receipt</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. INVOICE GENERATION FORM */}
        <InvoiceForm
          settings={settings}
          onSaveInvoice={handleSaveInvoice}
          onPreviewInvoice={(inv) => setPreviewInvoice(inv)}
          renewalMember={renewalMember}
          onClearRenewal={() => setRenewalMember(null)}
        />

        {/* 3. MEMBERSHIP TRACKER & EXCEL EXPORT */}
        <MembershipTable
          invoices={invoices}
          settings={settings}
          onViewInvoice={(inv) => setPreviewInvoice(inv)}
          onRenewMember={handleRenewMember}
          onDeleteInvoice={handleDeleteInvoice}
          onLoadSampleData={handleLoadSampleData}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {settings.gymName}. Client-side billing &amp; membership software.</p>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Runs 100% in browser</span>
            <span>·</span>
            <span>Local Storage Persistence</span>
            <span>·</span>
            <span>Ready for Vercel</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <InvoicePreviewModal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        settings={settings}
      />
    </div>
  );
}
