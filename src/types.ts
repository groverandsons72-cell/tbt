export interface GymSettings {
  gymName: string;
  address: string;
  gstNumber: string;
  phone: string;
  email: string;
  website?: string;
  invoicePrefix: string;
  nextReceiptNumber: number;
  currencySymbol: string;
  defaultTaxRate: number; // e.g. 18
  logoBase64: string; // Base64 data URL
  termsAndConditions: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Net Banking';

export interface MemberInvoice {
  id: string;
  receiptNumber: string;
  receiptDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  
  // Customer details
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  
  // Membership details
  planName: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  durationMonths: number;
  endDate: string; // YYYY-MM-DD
  
  // Financials
  basePrice: number;
  taxRate: number; // e.g. 18%
  taxAmount: number; // basePrice * (taxRate / 100)
  cgstAmount: number; // taxAmount / 2
  sgstAmount: number; // taxAmount / 2
  totalAmount: number; // basePrice + taxAmount
  isTaxEnabled: boolean;
  
  createdAt: string; // ISO string
}

export type MembershipFilter = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
