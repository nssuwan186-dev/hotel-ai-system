import inquirer from 'inquirer';
import db from '../database/database';

async function main() {
  console.log('\n🏨 Hotel AI Management - CLI\n');

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'module',
      message: 'Select module:',
      choices: ['Customers', 'Rooms', 'Bookings', 'Reports', 'Exit']
    }
  ]);

  switch (answer.module) {
    case 'Customers':
      await customerMenu();
      break;
    case 'Rooms':
      await roomMenu();
      break;
    case 'Bookings':
      await bookingMenu();
      break;
    case 'Reports':
      await reportMenu();
      break;
    case 'Exit':
      console.log('\nGoodbye! 👋\n');
      process.exit(0);
  }

  await main();
}

async function customerMenu() {
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Customer actions:',
      choices: ['Create', 'List', 'Back']
    }
  ]);

  if (action.action === 'Create') {
    const input = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Name:' },
      { type: 'input', name: 'phone', message: 'Phone:' },
      { type: 'input', name: 'email', message: 'Email (optional):' }
    ]);

    try {
      const code = `CUST-${Date.now()}`;
      await db.run(
        `INSERT INTO customers (code, name, phone, email, status) VALUES (?, ?, ?, ?, ?)`,
        [code, input.name, input.phone, input.email || null, 'regular']
      );
      console.log('✅ Customer created!');
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }
  } else if (action.action === 'List') {
    const customers = await db.query('SELECT * FROM customers');
    console.log('\n📋 Customers:');
    customers.forEach((c: any, i: number) => {
      console.log(`${i + 1}. ${c.name} (${c.phone}) - ${c.status}`);
    });
    console.log();
  }
}

async function roomMenu() {
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Room actions:',
      choices: ['List All', 'List Available', 'Back']
    }
  ]);

  if (action.action === 'List All') {
    const rooms = await db.query('SELECT * FROM rooms');
    console.log('\n📋 Rooms:');
    rooms.forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.roomNumber} - ${r.type} (${r.pricePerNight} THB)`);
    });
    console.log();
  } else if (action.action === 'List Available') {
    const rooms = await db.query("SELECT * FROM rooms WHERE status = 'available'");
    console.log('\n✅ Available Rooms:');
    rooms.forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.roomNumber} - ${r.type} (${r.pricePerNight} THB)`);
    });
    console.log();
  }
}

async function bookingMenu() {
  console.log('\n📅 Booking Management (Coming Soon)\n');
}

async function reportMenu() {
  console.log('\n📊 Reports (Coming Soon)\n');
}

main().catch(console.error);
