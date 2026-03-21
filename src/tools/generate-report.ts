import { spawn } from 'child_process';
import * as fs from 'fs';

interface FileDetail {
  name: string; id: string; type: string; columns: number;
  records: number; columnNames: string[];
}

function classifyFile(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('customer') || lower.includes('guest')) return '👤 CUSTOMERS';
  if (lower.includes('room') || lower.includes('400')) return '🛏️ ROOMS';
  if (lower.includes('booking')) return '📅 BOOKINGS';
  if (lower.includes('payment') || lower.includes('invoice')) return '💰 PAYMENTS';
  return '❓ OTHER';
}

async function executeGwsCommand(command: string): Promise<any> {
  return new Promise((resolve) => {
    const process = spawn('sh', ['-c', command]);
    let output = '';
    process.stdout.on('data', (data) => { output += data.toString(); });
    process.on('close', () => {
      try { const match = output.match(/\{[\s\S]*\}/); resolve(match ? JSON.parse(match[0]) : {}); }
      catch { resolve({}); }
    });
  });
}

async function generateReport() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      DATA DISCOVERY - REPORT           ║');
  console.log('╚════════════════════════════════════════╝\n');

  const files: { [key: string]: FileDetail[] } = {
    '👤 CUSTOMERS': [], '🛏️ ROOMS': [], '📅 BOOKINGS': [],
    '💰 PAYMENTS': [], '❓ OTHER': []
  };
  let totalRecords = 0, totalFiles = 0;

  try {
    const sheetsCmd = "gws drive files list --params '{\"pageSize\": 100, \"q\": \"mimeType=\\\"application/vnd.google-apps.spreadsheet\\\"\"}' 2>/dev/null";
    const sheets = await executeGwsCommand(sheetsCmd);
    console.log('📊 Analyzing files...\n');

    if (sheets.files) {
      for (const file of sheets.files.slice(0, 20)) {
        try {
          const dataCmd = `gws sheets spreadsheets values get --params '{"spreadsheetId": "${file.id}", "range": "A1:Z10000"}' 2>/dev/null`;
          const data = await executeGwsCommand(dataCmd);
          if (data.values) {
            const headers = data.values[0] || [];
            const records = data.values.slice(1).filter((r: any[]) => r.some((c) => c)).length;
            const category = classifyFile(file.name);
            files[category].push({ name: file.name, id: file.id, type: 'Google Sheet', columns: headers.length, records, columnNames: headers });
            totalRecords += records; totalFiles++;
            console.log(`✅ ${file.name} (${records} records)`);
          }
        } catch (error) { console.log(`⚠️  Skipped: ${file.name}`); }
      }
    }

    let report = '═'.repeat(60) + '\n           DATA DISCOVERY REPORT\n═'.repeat(60) + `\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
    report += '📊 SUMMARY\n' + '─'.repeat(60) + `\nTotal Files: ${totalFiles}\nTotal Records: ${totalRecords.toLocaleString()}\n\n`;
    for (const [category, items] of Object.entries(files)) {
      if (items.length > 0) {
        report += `${category}\n` + '─'.repeat(60) + '\n';
        items.forEach((file) => {
          report += `\n  • ${file.name}\n    ID: ${file.id}\n    Columns: ${file.columns}, Records: ${file.records.toLocaleString()}\n    Fields: ${file.columnNames.join(', ')}\n`;
        });
        report += '\n';
      }
    }
    report += '═'.repeat(60) + '\n';

    fs.writeFileSync('data-discovery-report.txt', report);
    fs.writeFileSync('data-discovery-report.json', JSON.stringify(files, null, 2));
    console.log('\n✅ Reports generated:');
    console.log('   - data-discovery-report.txt (readable)');
    console.log('   - data-discovery-report.json (machine-readable)\n');
  } catch (error) { console.error('❌ Error:', error); }
}

generateReport();
