import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  RotateCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Filter,
  Download,
  Printer,
  X
} from 'lucide-react';
import { MemberInvoice, GymSettings, MembershipFilter } from '../types';
import { getMembershipStatus, formatDatePretty } from '../utils/dateUtils';
import { exportMembersToExcel } from '../utils/excelExport';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { printInvoice } from '../utils/printInvoice';

interface MembershipTableProps {
  invoices: MemberInvoice[];
  settings: GymSettings;
  onViewInvoice: (invoice: MemberInvoice) => void;
  onRenewMember: (invoice: MemberInvoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onLoadSampleData: () => void;
  onDownloadInvoice?: (invoice: MemberInvoice) => void;
}

export const MembershipTable: React.FC<MembershipTableProps> = ({
  invoices,
  settings,
  onViewInvoice,
  onRenewMember,
  onDeleteInvoice,
  onLoadSampleData,
  onDownloadInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MembershipFilter>('ALL');
  const [deleteCandidate, setDeleteCandidate] = useState<MemberInvoice | null>(null);

  // Metrics computation
  const metrics = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      revenue += inv.totalAmount;
      const status = getMembershipStatus(inv.endDate).status;
      if (status === 'ACTIVE') active++;
      else if (status === 'EXPIRING') expiring++;
      else if (status === 'EXPIRED') expired++;
    });

    return {
      total: invoices.length,
      active,
      expiring,
      expired,
      revenue,
    };
  }, [invoices]);

  // Filtering invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        inv.customerName.toLowerCase().includes(query) ||
        inv.customerPhone.toLowerCase().includes(query) ||
        inv.receiptNumber.toLowerCase().includes(query) ||
        (inv.description && inv.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Status match
      if (statusFilter === 'ALL') return true;
      const status = getMembershipStatus(inv.endDate).status;
      return status === statusFilter;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleExportExcel = () => {
    exportMembersToExcel(filteredInvoices.length > 0 ? filteredInvoices : invoices, settings);
  };

  return (
    <div id="members-tracker" className="space-y-6">
      {/* 1. EXECUTIVE METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Members</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {metrics.total}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Registered in database</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-medium text-emerald-700 font-semibold">Active Members</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {metrics.active}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Valid access active</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-medium text-amber-700 font-semibold">Expiring Soon</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {metrics.expiring}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Within next 7 days</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Billed</span>
            <div className="text-xl sm:text-2xl font-bold text-blue-700 font-mono tabular-nums mt-0.5">
              {settings.currencySymbol} {metrics.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Accumulated receipts</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. DATA TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Member Roster &amp; Billing History</h3>
            <p className="text-xs text-slate-500">
              Live status tracking with automatic expiry comparison against current date
            </p>
          </div>

          {/* Search, Filter & Excel Export Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, phone, bill #..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({metrics.total})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({metrics.active})
              </button>
              <button
                onClick={() => setStatusFilter('EXPIRING')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'EXPIRING'
                    ? 'bg-white text-amber-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expiring ({metrics.expiring})
              </button>
              <button
                onClick={() => setStatusFilter('EXPIRED')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'EXPIRED'
                    ? 'bg-white text-red-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expired ({metrics.expired})
              </button>
            </div>

            {/* Export to Excel CTA */}
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              title="Download entire members list as Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
          </div>
        </div>

        {/* Interactive Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Plan / Description</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date (Auto)</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const statusInfo = getMembershipStatus(inv.endDate);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Receipt # */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-700 tabular-nums">
                        {inv.receiptNumber}
                      </td>

                      {/* Member Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {inv.customerName}
                        </div>
                        {inv.customerAddress && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {inv.customerAddress}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {inv.customerPhone}
                      </td>

                      {/* Plan / Description */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {inv.planName || 'Standard Membership'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.durationMonths} {inv.durationMonths === 1 ? 'Month' : 'Months'} · {inv.paymentMethod}
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-4 text-slate-600">
                        {formatDatePretty(inv.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatDatePretty(inv.endDate)}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {settings.currencySymbol} {inv.totalAmount.toFixed(2)}
                      </td>

                      {/* Live Status Column */}
                      <td className="py-3 px-4 text-center">
                        {statusInfo.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            ACTIVE
                          </span>
                        )}
                        {statusInfo.status === 'EXPIRING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/80 text-amber-800 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            EXPIRING
                          </span>
                        )}
                        {statusInfo.status === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100/80 text-red-800 border border-red-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            EXPIRED
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {statusInfo.label}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Preview Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => printInvoice(inv, settings)}
                            className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Print / Save as PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => (onDownloadInvoice ? onDownloadInvoice(inv) : generateInvoicePDF(inv, settings))}
                            className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Direct Download A4 PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRenewMember(inv)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Renew Membership (prefills form)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(inv)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title={`Delete record for ${inv.customerName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Users className="w-8 h-8 mx-auto text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">
                        {searchQuery ? 'No members match your search criteria.' : 'No membership invoices recorded yet.'}
                      </p>
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      ) : (
                        <button
                          onClick={onLoadSampleData}
                          className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer font-medium"
                        >
                          Load Sample Test Members
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <span className="font-mono font-bold text-slate-700">{filteredInvoices.length}</span> of{' '}
            <span className="font-mono font-bold text-slate-700">{invoices.length}</span> total receipts
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active: Valid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Expiring: &le; 7 days
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Expired
            </span>
          </div>
        </div>
      </div>

      {/* IN-APP DELETE CONFIRMATION MODAL (Reliable in iframes without window.confirm) */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Member Record?</h3>
                  <p className="text-xs text-slate-500">This action will remove this receipt from billing history.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Member Name:</span>
                <span className="font-bold text-slate-900">{deleteCandidate.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Receipt No:</span>
                <span className="font-mono font-bold text-amber-700">{deleteCandidate.receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Phone:</span>
                <span className="font-mono text-slate-700">{deleteCandidate.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Total Paid:</span>
                <span className="font-mono font-bold text-slate-900">{settings.currencySymbol} {deleteCandidate.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteInvoice(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
