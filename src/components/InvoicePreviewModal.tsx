import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  FileDown, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { MemberInvoice, GymSettings } from '../types';
import { InvoiceReceipt } from './InvoiceReceipt';
import { generateInvoicePDF, generateDirectVectorPdf } from '../utils/pdfGenerator';
import { printInvoice } from '../utils/printInvoice';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: MemberInvoice | null;
  settings: GymSettings;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [downloadDataUri, setDownloadDataUri] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('invoice.pdf');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Pre-generate instant vector PDF so buttons like 'Open in New Tab' and 'Save File' work right away
  useEffect(() => {
    if (isOpen && invoice) {
      try {
        const res = generateDirectVectorPdf(invoice, settings);
        if (res.success) {
          if (res.blobUrl) setDownloadBlobUrl(res.blobUrl);
          if (res.dataUri) setDownloadDataUri(res.dataUri);
          setDownloadFilename(res.filename);
        }
      } catch (err) {
        console.warn('Vector PDF pre-generation notice:', err);
      }
    } else {
      setDownloadSuccess(false);
    }
  }, [isOpen, invoice, settings]);

  if (!isOpen || !invoice) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const res = await generateInvoicePDF(invoice, settings, 'printable-invoice');
      if (res.success) {
        if (res.blobUrl) setDownloadBlobUrl(res.blobUrl);
        if (res.dataUri) setDownloadDataUri(res.dataUri);
        setDownloadFilename(res.filename);
        setDownloadSuccess(true);
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    printInvoice(invoice, settings);
  };

  const activeDownloadHref = downloadDataUri || downloadBlobUrl || '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden in print) */}
        <div className="no-print flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">Receipt Preview</span>
            <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
              {invoice.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Direct Print / Save as PDF Button (Works in all browsers & iframes) */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Print directly or Save as PDF via browser print dialog"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / Save as PDF</span>
            </button>

            {/* 2. Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* 3. Direct Anchor Download Link (Manual Click fallback) */}
            {activeDownloadHref !== '#' && (
              <a
                href={activeDownloadHref}
                download={downloadFilename}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors shadow-2xs"
                title="Direct file download link"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save File</span>
              </a>
            )}

            {/* 4. Open in New Tab Link (bypasses iframe sandbox download restrictions) */}
            {downloadBlobUrl && (
              <a
                href={downloadBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                title="Open PDF full-screen in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Open in Tab</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area centering the dedicated w-[800px] p-8 A4 container */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-200/70 flex justify-center items-start">
          <div className="w-[800px] min-w-[800px] max-w-[800px] shadow-2xl bg-white printable-receipt-area">
            <InvoiceReceipt invoice={invoice} settings={settings} id="printable-invoice" />
          </div>
        </div>
      </div>
    </div>
  );
};
