/**
 * Date utility helpers for Gym Membership calculations
 */

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates End Date by adding N months to the Start Date.
 * Maintains day-of-month alignment accurately.
 */
export function calculateEndDate(startDateStr: string, months: number): string {
  if (!startDateStr || isNaN(months) || months <= 0) return startDateStr;
  
  const [year, month, day] = startDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Advance months
  date.setMonth(date.getMonth() + months);
  
  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resDay = String(date.getDate()).padStart(2, '0');
  
  return `${resYear}-${resMonth}-${resDay}`;
}

export type MembershipStatusType = 'ACTIVE' | 'EXPIRING' | 'EXPIRED';

export interface MembershipStatusInfo {
  status: MembershipStatusType;
  label: string;
  daysRemaining: number;
  badgeClass: string;
  textClass: string;
}

/**
 * Compares membership end date against current date to derive live status.
 */
export function getMembershipStatus(endDateStr: string): MembershipStatusInfo {
  if (!endDateStr) {
    return {
      status: 'EXPIRED',
      label: 'Expired',
      daysRemaining: 0,
      badgeClass: 'bg-red-950/60 border border-red-800 text-red-400',
      textClass: 'text-red-400',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = endDateStr.split('-').map(Number);
  const endDate = new Date(year, month - 1, day);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const expiredDaysAgo = Math.abs(diffDays);
    return {
      status: 'EXPIRED',
      label: `Expired (${expiredDaysAgo}d ago)`,
      daysRemaining: diffDays,
      badgeClass: 'bg-red-500/10 border border-red-500/30 text-red-400',
      textClass: 'text-red-400',
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'EXPIRING',
      label: diffDays === 0 ? 'Expires Today' : `Expiring (${diffDays}d left)`,
      daysRemaining: diffDays,
      badgeClass: 'bg-amber-500/10 border border-amber-500/30 text-amber-400',
      textClass: 'text-amber-400',
    };
  }

  return {
    status: 'ACTIVE',
    label: `Active (${diffDays}d left)`,
    daysRemaining: diffDays,
    badgeClass: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
    textClass: 'text-emerald-400',
  };
}

export function formatDatePretty(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
