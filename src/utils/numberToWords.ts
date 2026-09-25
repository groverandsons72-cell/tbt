/**
 * Converts a numeric amount to words (Indian & International numbering system support)
 */
export function numberToWords(amount: number, currency = 'Rupees'): string {
  if (isNaN(amount) || amount === 0) return `${currency} Zero Only`;
  
  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(num: number): string {
    let str = '';
    if (num >= 100) {
      str += singleDigits[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 10 && num <= 19) {
      str += teens[num - 10] + ' ';
    } else if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      if (num % 10 > 0) {
        str += singleDigits[num % 10] + ' ';
      }
    } else if (num > 0) {
      str += singleDigits[num] + ' ';
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let remaining = integerPart;
  let words = '';

  // Indian Numbering (Crore, Lakh, Thousand, Hundred)
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    words += convertHundreds(crore) + ' Crore ';
    remaining %= 10000000;
  }

  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    words += convertHundreds(lakh) + ' Lakh ';
    remaining %= 100000;
  }

  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    words += convertHundreds(thousand) + ' Thousand ';
    remaining %= 1000;
  }

  if (remaining > 0) {
    words += convertHundreds(remaining) + ' ';
  }

  words = words.trim();
  let result = `${currency} ${words || 'Zero'}`;

  if (decimalPart > 0) {
    result += ` and ${convertHundreds(decimalPart)} Paise`;
  }

  return `${result} Only`;
}
