import { spawn } from 'child_process';
import * as fs from 'fs';

interface FileInfo {
  id: string;
  name: string;
  type: string;
  category: string;
  modified: string;
}

function classifyFile(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('customer') || lower.includes('guest') || lower.includes('contact')) return '👤 CUSTOMERS';
  if (lower.includes('room') || lower.includes('accommodation') || lower.includes('suite') || lower.includes('400')) return '🛏️ ROOMS';
  if (lower.includes('booking') || lower.includes('reservation')) return '📅 BOOKINGS';
  if (lower.includes('payment') || lower.includes('invoice') || lower.includes('receipt')) return '💰 PAYMENTS';
  if (lower.includes('transaction') || lower.includes('financial') || lower.includes('accounting')) return '📊 TRANSACTIONS';
  return '❓ OTHER';
}

async function executeGwsCommand(command: string): Promise<any> {
  return new Promise((resolve) => {
    const process = spawn('sh', ['-c', command]);
    let output = '';
    process.stdout.on('data', (data) => { output += data.toString(); });
    process.on('close', () => {
      try {
        const match = output.match(/\{[\s\S]*\}/);
        resolve(match ? JSON.parse(match[0]) : { files: [] });
      } catch { resolve({ files: [] }); }
    });
  });
}

async function organizeFiles() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    DATA ORGANIZATION - CLASSIFY       ║');
  console.log('╚════════════════════════════════════════╝\n');

  const organized: { [key: string]: FileInfo[] } = {
    '👤 CUSTOMERS': [], '🛏️ ROOMS': [], '📅 BOOKINGS': [],
    '💰 PAYMENTS': [], '📊 TRANSACTIONS': [], '❓ OTHER': []
  };

  try {
    const sheetsCmd = "gws drive files list --params '{\"pageSize\": 100, \"q\": \"mimeType=\\\"application/vnd.google-apps.spreadsheet\\\"\"}' 2>/dev/null";
    const sheets = await executeGwsCommand(sheetsCmd);
    if (sheets.files) {
      sheets.files.forEach((file: any) => {
        const category = classifyFile(file.name);
        organized[category].push({ id: file.id, name: file.name, type: 'Google Sheet', category, modified: file.modifiedTime || 'N/A' });
      });
    }

    const excelCmd = "gws drive files list --params '{\"pageSize\": 100, \"q\": \"mimeType=\\\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\\\"\"}' 2>/dev/null";
    const excels = await executeGwsCommand(excelCmd);
    if (excels.files) {
      excels.files.forEach((file: any) => {
        const category = classifyFile(file.name);
        organized[category].push({ id: file.id, name: file.name, type: 'Excel', category, modified: file.modifiedTime || 'N/A' });
      });
    }

    console.log('FILES BY CATEGORY:\n');
    for (const [category, files] of Object.entries(organized)) {
      if (files.length > 0) {
        console.log(`${category}`);
        console.log('─'.repeat(50));
        files.forEach((file, i) => {
          console.log(`  ${i + 1}. ${file.name}`);
          console.log(`     Type: ${file.type}, ID: ${file.id}\n`);
        });
      }
    }

    fs.writeFileSync('file-inventory.json', JSON.stringify(organized, null, 2));
    console.log('✅ Saved: file-inventory.json\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

organizeFiles();
