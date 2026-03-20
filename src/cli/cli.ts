import inquirer from 'inquirer';
import customerService from '../../services/customer.service';
import roomService from '../../services/room.service';

async function main() {
  console.log('\n🏨 Hotel AI Management - CLI\n');

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'module',
      message: 'Select module:',
      choices: ['Customers', 'Rooms', 'Exit']
    }
  ]);

  switch (answer.module) {
    case 'Customers':
      await customerMenu();
      break;
    case 'Rooms':
      await roomMenu();
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
      const customer = await customerService.createCustomer(input.name, input.phone, input.email || undefined);
      console.log('✅ Created:', customer);
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }
  } else if (action.action === 'List') {
    const customers = await customerService.listCustomers();
    console.log('\n📋 Customers:');
    customers.forEach((c, i) => console.log(`${i + 1}. ${c.name} (${c.phone})`));
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
    const rooms = await roomService.listRooms();
    console.log('\n📋 Rooms:');
    rooms.forEach((r, i) => console.log(`${i + 1}. ${r.roomNumber} - ${r.type} (${r.pricePerNight} THB)`));
    console.log();
  } else if (action.action === 'List Available') {
    const rooms = await roomService.getAvailableRooms();
    console.log('\n✅ Available Rooms:');
    rooms.forEach((r, i) => console.log(`${i + 1}. ${r.roomNumber} - ${r.type} (${r.pricePerNight} THB)`));
    console.log();
  }
}

main().catch(console.error);
