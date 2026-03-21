import { spawn } from 'child_process';
import db from '../database/database';

async function executeGwsCommand(command: string): Promise<any> {
  return new Promise((resolve) => {
    const process = spawn('sh', ['-c', command]);
    let output = '';
    process.stdout.on('data', (data) => { output += data.toString(); });
    process.on('close', () => {
      try {
        const match = output.match(/\{[\s\S]*\}/);
        resolve(match ? JSON.parse(match[0]) : {});
      } catch { resolve({}); }
    });
  });
}

async function migrateCustomers(spreadsheetId: string) {
  console.log('\n📊 Migrating Customers...');
  const dataCmd = `gws sheets spreadsheets values get --params '{"spreadsheetId": "${spreadsheetId}", "range": "Customers!A2:Z10000"}' 2>/dev/null`;
  const data = await executeGwsCommand(dataCmd);
  if (!data.values || data.values.length === 0) { console.log('  ⚠️  No customer data found'); return 0; }
  let count = 0;
  for (const row of data.values) {
    try {
      if (row.length >= 3) {
        const code = `CUST-${Date.now()}-${count}`;
        db.run('INSERT INTO customers (code, name, phone, email, status, visit_count, loyalty_points) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [code, row[0] || '', row[1] || '', row[2] || '', 'regular', 0, 0]);
        count++;
      }
    } catch (error) { console.log('  ⚠️  Error:', row); }
  }
  console.log(`  ✅ Imported ${count} customers`);
  return count;
}

async function migrateRooms(spreadsheetId: string) {
  console.log('\n🛏️  Migrating Rooms...');
  const dataCmd = `gws sheets spreadsheets values get --params '{"spreadsheetId": "${spreadsheetId}", "range": "Rooms!A2:Z10000"}' 2>/dev/null`;
  const data = await executeGwsCommand(dataCmd);
  if (!data.values || data.values.length === 0) { console.log('  ⚠️  No room data found'); return 0; }
  let count = 0;
  for (const row of data.values) {
    try {
      if (row.length >= 4) {
        db.run('INSERT INTO rooms (room_number, floor, type, capacity, price_per_night, amenities, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [row[0] || '', parseInt(row[1]) || 1, row[2] || 'single', parseInt(row[3]) || 2, parseFloat(row[4]) || 1000, '[]', 'available']);
        count++;
      }
    } catch (error) { console.log('  ⚠️  Error:', row); }
  }
  console.log(`  ✅ Imported ${count} rooms`);
  return count;
}

async function migrateBookings(spreadsheetId: string) {
  console.log('\n📅 Migrating Bookings...');
  const dataCmd = `gws sheets spreadsheets values get --params '{"spreadsheetId": "${spreadsheetId}", "range": "Bookings!A2:Z10000"}' 2>/dev/null`;
  const data = await executeGwsCommand(dataCmd);
  if (!data.values || data.values.length === 0) { console.log('  ⚠️  No booking data found'); return 0; }
  let count = 0;
  for (const row of data.values) {
    try {
      if (row.length >= 5) {
        const code = `BK-${Date.now()}-${count}`;
        db.run('INSERT INTO bookings (code, customer_id, room_id, check_in, check_out, total_nights, room_price, total_price, deposit_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [code, 1, 1, row[0] || '', row[1] || '', parseInt(row[2]) || 1, parseFloat(row[3]) || 1000, parseFloat(row[4]) || 1000, parseFloat(row[4]) || 1000 * 0.3, 'confirmed', 'paid']);
        count++;
      }
    } catch (error) { console.log('  ⚠️  Error:', row); }
  }
  console.log(`  ✅ Imported ${count} bookings`);
  return count;
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    DATA MIGRATION - STARTING           ║');
  console.log('╚════════════════════════════════════════╝\n');
  const spreadsheetId = '1Tes9bQ7qyq5v4MPidprzxaXL8OuF7A6QlvK8GLAjzuY';
  console.log(`📊 Source: DB-Hotel-FullSystem`);
  console.log('🎯 Target: SQLite Database\n');
  try {
    console.log('🧹 Clearing existing data...');
    db.run('DELETE FROM bookings');
    db.run('DELETE FROM customers');
    db.run('DELETE FROM rooms');
    console.log('  ✅ Cleared\n');
    await migrateCustomers(spreadsheetId);
    await migrateRooms(spreadsheetId);
    await migrateBookings(spreadsheetId);
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         MIGRATION COMPLETE             ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('✅ Migration successful!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  }
}

main();
