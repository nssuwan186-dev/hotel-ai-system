import { spawn } from 'child_process';

async function executeGwsCommand(command: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn('sh', ['-c', command]);
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const match = output.match(/\{[\s\S]*\}/);
          resolve(match ? JSON.parse(match[0]) : { raw: output });
        } catch {
          resolve({ raw: output });
        }
      } else {
        reject(new Error('gws command failed'));
      }
    });
  });
}

async function searchAllFiles() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      DATA DISCOVERY - SEARCH           ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    console.log('📊 Searching Google Sheets...\n');

    const sheetsCmd = "gws drive files list --params '{\"pageSize\": 100, \"q\": \"mimeType=\\\"application/vnd.google-apps.spreadsheet\\\"\"}' 2>/dev/null";
    const sheets = await executeGwsCommand(sheetsCmd);

    if (sheets.files && sheets.files.length > 0) {
      sheets.files.forEach((file: any, idx: number) => {
        console.log(`  ${idx + 1}. ${file.name}`);
        console.log(`     📌 ID: ${file.id}`);
        console.log(`     📅 Modified: ${file.modifiedTime || 'N/A'}\n`);
      });
      console.log(`✅ Found ${sheets.files.length} Google Sheets\n`);
    }

    console.log('📈 Searching Excel Files...\n');

    const excelCmd = "gws drive files list --params '{\"pageSize\": 100, \"q\": \"mimeType=\\\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\\\"\"}' 2>/dev/null";
    const excels = await executeGwsCommand(excelCmd);

    if (excels.files && excels.files.length > 0) {
      excels.files.forEach((file: any, idx: number) => {
        console.log(`  ${idx + 1}. ${file.name}`);
        console.log(`     📌 ID: ${file.id}`);
        console.log(`     📅 Modified: ${file.modifiedTime || 'N/A'}\n`);
      });
      console.log(`✅ Found ${excels.files.length} Excel Files\n`);
    }

    console.log('═'.repeat(50));
    const total = (sheets.files?.length || 0) + (excels.files?.length || 0);
    console.log(`✅ TOTAL FILES: ${total}\n`);
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

searchAllFiles();
