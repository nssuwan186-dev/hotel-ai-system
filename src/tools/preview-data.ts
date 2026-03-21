import { spawn } from 'child_process';
import * as readline from 'readline';

async function getSheetData(spreadsheetId: string): Promise<any> {
  return new Promise((resolve) => {
    const cmd = `gws sheets spreadsheets values get --params '{"spreadsheetId": "${spreadsheetId}", "range": "A1:Z50"}' 2>/dev/null`;
    const process = spawn('sh', ['-c', cmd]);
    let output = '';
    process.stdout.on('data', (data) => { output += data.toString(); });
    process.on('close', () => {
      try {
        const match = output.match(/\{[\s\S]*\}/);
        resolve(match ? JSON.parse(match[0]) : { values: [] });
      } catch { resolve({ values: [] }); }
    });
  });
}

async function previewFile(fileId: string, fileName: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`PREVIEW: ${fileName}`);
  console.log('='.repeat(60) + '\n');

  const data = await getSheetData(fileId);
  if (!data.values || data.values.length === 0) {
    console.log('❌ No data found\n');
    return;
  }

  const headers = data.values[0];
  const dataRows = data.values.slice(1).filter((row: any[]) => row.some((cell) => cell));

  console.log('📋 COLUMNS:');
  headers.forEach((h: string, i: number) => {
    console.log(`  ${i + 1}. ${h}`);
  });

  console.log(`\n📊 SAMPLE DATA (${dataRows.length} records):\n`);
  const sample = dataRows.slice(0, 5);
  console.log('┌─' + headers.map(() => '─'.repeat(18)).join('─┬─') + '─┐');
  console.log('│ ' + headers.map((h: string) => h.substring(0, 18).padEnd(18)).join(' │ ') + ' │');
  console.log('├─' + headers.map(() => '─'.repeat(18)).join('─┼─') + '─┤');
  sample.forEach((row: any[]) => {
    console.log('│ ' + headers.map((_, i) => (row[i] || '').toString().substring(0, 18).padEnd(18)).join(' │ ') + ' │');
  });
  console.log('└─' + headers.map(() => '─'.repeat(18)).join('─┴─') + '─┘');
  console.log(`\n✅ Columns: ${headers.length}, Records: ${dataRows.length}\n`);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function menu() {
  console.log('\n📊 DATA PREVIEW TOOL');
  console.log('─'.repeat(50));
  console.log('Enter File ID to preview (or "exit" to quit):\n');
  rl.question('File ID: ', async (fileId) => {
    if (fileId.toLowerCase() === 'exit') { rl.close(); return; }
    rl.question('File Name: ', async (fileName) => {
      await previewFile(fileId, fileName);
      menu();
    });
  });
}

menu();
