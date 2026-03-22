import Papa from 'papaparse';
import type { Transaction, Subscription } from '../types';

// CSV Import - supports ING, Rabobank, ABN AMRO formats
export function parseCSV(content: string): Omit<Transaction, 'id' | 'createdAt'>[] {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const rows = result.data as Record<string, string>[];
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
  const format = detectCSVFormat(headers);

  return rows.map(row => parseCSVRow(row, format)).filter(Boolean) as Omit<Transaction, 'id' | 'createdAt'>[];
}

type CSVFormat = 'ing' | 'rabobank' | 'abn' | 'generic';

function detectCSVFormat(headers: string[]): CSVFormat {
  const joined = headers.join(',');
  if (joined.includes('af bij') || joined.includes('mededelingen')) return 'ing';
  if (joined.includes('omschrijving-1') || joined.includes('rabo')) return 'rabobank';
  if (joined.includes('transactiedatum') || joined.includes('globale transactiecode')) return 'abn';
  return 'generic';
}

function parseCSVRow(row: Record<string, string>, format: CSVFormat): Omit<Transaction, 'id' | 'createdAt'> | null {
  const normalized: Record<string, string> = {};
  for (const [key, val] of Object.entries(row)) {
    normalized[key.toLowerCase().trim()] = (val || '').trim();
  }

  let date = '';
  let description = '';
  let amount = 0;

  switch (format) {
    case 'ing': {
      date = parseDate(normalized['datum']);
      description = normalized['naam / omschrijving'] || normalized['mededelingen'] || normalized['omschrijving'] || '';
      const rawAmount = parseFloat((normalized['bedrag (eur)'] || normalized['bedrag'] || '0').replace(',', '.'));
      const direction = normalized['af bij']?.toLowerCase();
      amount = direction === 'af' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
      break;
    }
    case 'rabobank': {
      date = parseDate(normalized['datum']);
      description = normalized['omschrijving-1'] || normalized['naam tegenpartij'] || '';
      amount = parseFloat((normalized['bedrag'] || '0').replace(',', '.'));
      break;
    }
    case 'abn': {
      date = parseDate(normalized['transactiedatum'] || normalized['boekingsdatum']);
      description = normalized['omschrijving'] || normalized['naam'] || '';
      amount = parseFloat((normalized['bedrag'] || normalized['transactiebedrag'] || '0').replace(',', '.'));
      break;
    }
    default: {
      // Try common column names
      date = parseDate(
        normalized['date'] || normalized['datum'] || normalized['boekdatum'] ||
        normalized['transactiedatum'] || Object.values(normalized)[0]
      );
      description = normalized['description'] || normalized['omschrijving'] ||
                     normalized['naam'] || normalized['name'] || Object.values(normalized)[1] || '';
      const amtStr = normalized['amount'] || normalized['bedrag'] ||
                     normalized['transactiebedrag'] || Object.values(normalized)[2] || '0';
      amount = parseFloat(amtStr.replace(',', '.'));
      break;
    }
  }

  if (!date || !description) return null;

  return {
    date,
    description,
    amount,
    type: amount >= 0 ? 'income' : 'expense',
    accountId: null,
    toAccountId: null,
    potId: null,
    subscriptionId: null,
    recurring: null,
    source: 'csv',
    raw: JSON.stringify(row),
    groupId: null,
    isExpected: 0,
  };
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';

  // Try YYYYMMDD format
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const match = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }

  // Try YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }

  return dateStr;
}

// MT940 Import
export function parseMT940(content: string): Omit<Transaction, 'id' | 'createdAt'>[] {
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // :61: is the transaction line in MT940
    if (line.startsWith(':61:')) {
      const txLine = line.substring(4);
      const tx = parseMT940Transaction(txLine);

      // Look for :86: description on next lines
      let description = '';
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith(':86:')) {
        description = lines[i + 1].trim().substring(4);
        i++;
        // Description can span multiple lines until next tag
        while (i + 1 < lines.length && !lines[i + 1].trim().startsWith(':')) {
          description += ' ' + lines[i + 1].trim();
          i++;
        }
      }

      if (tx) {
        transactions.push({
          ...tx,
          description: description || tx.description,
          type: (tx.amount ?? 0) >= 0 ? 'income' : 'expense',
          accountId: null,
          toAccountId: null,
          potId: null,
          subscriptionId: null,
          recurring: null,
          source: 'mt940',
          raw: txLine + (description ? '\n' + description : ''),
          groupId: null,
          isExpected: 0,
        });
      }
    }
    i++;
  }

  return transactions;
}

function parseMT940Transaction(line: string): { date: string; amount: number; description: string } | null {
  // MT940 :61: format: YYMMDD[MMDD]CD[amount]
  const match = line.match(/^(\d{6})(\d{4})?(C|D|RC|RD)(\d+[,.]?\d*)/);
  if (!match) return null;

  const dateStr = match[1];
  const year = parseInt('20' + dateStr.slice(0, 2));
  const month = dateStr.slice(2, 4);
  const day = dateStr.slice(4, 6);
  const date = `${year}-${month}-${day}`;

  const direction = match[3];
  const amountStr = match[4].replace(',', '.');
  let amount = parseFloat(amountStr);

  // D = Debit (outgoing), C = Credit (incoming)
  if (direction === 'D' || direction === 'RD') {
    amount = -amount;
  }

  return { date, amount, description: '' };
}

// PDF Import - basic text extraction
export async function parsePDF(file: File): Promise<string> {
  // For PDF, we extract text and return it for the user to review
  // In a production app, you'd use pdf.js or similar
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = extractTextFromPDFBuffer(reader.result as ArrayBuffer);
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function extractTextFromPDFBuffer(buffer: ArrayBuffer): string {
  // Basic PDF text extraction - looks for text between BT/ET markers
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('latin1').decode(bytes);

  const textParts: string[] = [];
  const streamRegex = /stream\s*\n([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(text)) !== null) {
    const stream = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(stream)) !== null) {
      textParts.push(tjMatch[1]);
    }
  }

  return textParts.join('\n') || 'Kon geen tekst uit PDF halen. Probeer een CSV of MT940 bestand.';
}

// Auto-match transactions to subscriptions
export function autoMatchTransactions(
  transactions: Omit<Transaction, 'id' | 'createdAt'>[],
  subscriptions: Subscription[]
): Omit<Transaction, 'id' | 'createdAt'>[] {
  return transactions.map(tx => {
    const desc = tx.description.toLowerCase();

    for (const sub of subscriptions) {
      const name = sub.name.toLowerCase();
      // Match if subscription name appears in transaction description
      if (desc.includes(name) || name.includes(desc.split(' ')[0])) {
        return { ...tx, subscriptionId: sub.id };
      }
    }

    return tx;
  });
}
