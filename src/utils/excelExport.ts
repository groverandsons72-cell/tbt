import * as XLSX from 'xlsx';
import { MemberInvoice, GymSettings } from '../types';
import { getMembershipStatus, formatDatePretty } from './dateUtils';

export function exportMembersToExcel(invoices: MemberInvoice[], settings: GymSettings) {
  if (!invoices || invoices.length === 0) {
    return false;
  }

  // Transform into clean tabular records for spreadsheet
  const rows = invoices.map((inv, index) => {
    const statusInfo = getMembershipStatus(inv.endDate);
    return {
      'S.No': index + 1,
      'Receipt Number': inv.receiptNumber,
      'Receipt Date': inv.receiptDate,
      'Member Name': inv.customerName,
      'Phone Number': inv.customerPhone,
      'Address': inv.customerAddress || 'N/A',
      'Plan / Description': inv.description || inv.planName,
      'Start Date': formatDatePretty(inv.startDate),
      'End Date': formatDatePretty(inv.endDate),
      'Duration (Months)': inv.durationMonths,
      'Status': statusInfo.status,
      'Status Detail': statusInfo.label,
      'Payment Method': inv.paymentMethod,
      'Base Price': inv.basePrice,
      'Tax GST (18%)': inv.taxAmount,
      'CGST (9%)': inv.cgstAmount,
      'SGST (9%)': inv.sgstAmount,
      'Total Paid': inv.totalAmount,
      'Recorded On': inv.createdAt ? new Date(inv.createdAt).toLocaleString() : 'N/A',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 16 }, // Receipt Number
    { wch: 14 }, // Receipt Date
    { wch: 22 }, // Member Name
    { wch: 16 }, // Phone
    { wch: 25 }, // Address
    { wch: 30 }, // Plan / Description
    { wch: 14 }, // Start Date
    { wch: 14 }, // End Date
    { wch: 16 }, // Duration
    { wch: 12 }, // Status
    { wch: 20 }, // Status Detail
    { wch: 16 }, // Payment Method
    { wch: 12 }, // Base Price
    { wch: 14 }, // Tax GST
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 14 }, // Total Paid
    { wch: 22 }, // Recorded On
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gym Members');

  // Add Summary sheet
  const activeCount = invoices.filter(i => getMembershipStatus(i.endDate).status === 'ACTIVE').length;
  const expiringCount = invoices.filter(i => getMembershipStatus(i.endDate).status === 'EXPIRING').length;
  const expiredCount = invoices.filter(i => getMembershipStatus(i.endDate).status === 'EXPIRED').length;
  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const summaryData = [
    { 'Metric': 'Gym Name', 'Value': settings.gymName },
    { 'Metric': 'Gym GSTIN', 'Value': settings.gstNumber },
    { 'Metric': 'Report Generated Date', 'Value': new Date().toLocaleDateString() },
    { 'Metric': 'Total Member Invoices', 'Value': invoices.length },
    { 'Metric': 'Active Members', 'Value': activeCount },
    { 'Metric': 'Expiring Members (Within 7 Days)', 'Value': expiringCount },
    { 'Metric': 'Expired Members', 'Value': expiredCount },
    { 'Metric': `Total Revenue (${settings.currencySymbol})`, 'Value': totalRevenue.toFixed(2) },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  const dateTag = new Date().toISOString().split('T')[0];
  const filename = `${settings.gymName.replace(/[^a-zA-Z0-9]/g, '_')}_Members_${dateTag}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
