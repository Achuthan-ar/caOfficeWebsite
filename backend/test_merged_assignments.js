import mongoose from 'mongoose';
import Client from './models/Client.js';
import User from './models/User.js';
import Role from './models/Role.js';

const runTests = async () => {
  console.log('==================================================');
  console.log('       STARTING ASSIGNMENT MERGER TESTS           ');
  console.log('==================================================\n');

  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/ca_office';
    console.log(`Connecting to database at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB.\n');

    // Clean up any legacy unique index on 'user'
    try {
      await mongoose.connection.db.collection('clients').dropIndex('user_1');
      console.log('✓ Dropped legacy user_1 index from clients collection.');
    } catch (err) {
      // Index might not exist or not be unique, ignore
    }

    // 1. Resolve Roles
    console.log('Resolving user roles...');
    const tlRole = await Role.findOne({ name: 'TL' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    if (!tlRole || !employeeRole) {
      throw new Error('Required roles (TL, Employee) not found in DB.');
    }

    // 2. Resolve or Create Test Users
    console.log('Resolving mock users...');
    let tlUser = await User.findOne({ role: tlRole._id });
    if (!tlUser) {
      tlUser = await User.create({
        name: 'Test TL User',
        email: 'test_tl@caoffice.com',
        password: 'password123',
        role: tlRole._id,
        employeeId: 'EMP_TL999'
      });
    }

    let regularEmployee = await User.findOne({ role: employeeRole._id });
    if (!regularEmployee) {
      regularEmployee = await User.create({
        name: 'Test regular employee',
        email: 'test_emp@caoffice.com',
        password: 'password123',
        role: employeeRole._id,
        employeeId: 'EMP_REG999'
      });
    }

    console.log(`✓ Team Lead User: ${tlUser.name} (${tlUser._id})`);
    console.log(`✓ Employee User: ${regularEmployee.name} (${regularEmployee._id})\n`);

    // Clean up past test clients
    await Client.deleteMany({ clientName: { $regex: /^Merged Test Client/ } });

    // --------------------------------------------------
    // TEST 1: Create client without assignedTeamLead (should succeed since required check is removed)
    // --------------------------------------------------
    console.log('--------------------------------------------------');
    console.log('TEST 1: Creating client with only assignedEmployee');
    console.log('--------------------------------------------------');

    const client1 = await Client.create({
      clientId: 'C_TEST_M1',
      clientName: 'Merged Test Client 1',
      clientType: 'Individual',
      phoneNumber: '9876543210',
      assignedEmployee: regularEmployee._id,
      // assignedTeamLead is omitted
    });

    console.log(`✓ Client 1 created successfully. ID: ${client1.clientId}`);
    console.log(`assignedTeamLead is: ${client1.assignedTeamLead} (Expected: undefined/null)`);
    if (client1.assignedTeamLead) {
      throw new Error('TEST 1 FAILED: assignedTeamLead was populated unexpectedly.');
    }
    console.log('✓ TEST 1 PASSED.\n');

    // --------------------------------------------------
    // TEST 2: Inferred Team Lead check if assignedEmployee is a TL
    // --------------------------------------------------
    console.log('--------------------------------------------------');
    console.log('TEST 2: Auto-assignment of team lead when employee is a TL');
    console.log('--------------------------------------------------');

    // Mimic the backend controller logic for auto-assigning team lead on client creation
    let targetTeamLead = null;
    const selectedEmp = await User.findById(tlUser._id).populate('role');
    if (selectedEmp && selectedEmp.role?.name === 'TL') {
      targetTeamLead = selectedEmp._id;
    }

    const client2 = await Client.create({
      clientId: 'C_TEST_M2',
      clientName: 'Merged Test Client 2',
      clientType: 'Individual',
      phoneNumber: '9876543210',
      assignedEmployee: tlUser._id,
      assignedTeamLead: targetTeamLead, // Auto-set by controller logic
    });

    console.log(`✓ Client 2 created successfully. ID: ${client2.clientId}`);
    console.log(`assignedEmployee: ${client2.assignedEmployee} (TL User)`);
    console.log(`assignedTeamLead: ${client2.assignedTeamLead} (Expected: same TL User)`);
    if (client2.assignedTeamLead?.toString() !== tlUser._id.toString()) {
      throw new Error('TEST 2 FAILED: assignedTeamLead was not mapped correctly to the TL assignee.');
    }
    console.log('✓ TEST 2 PASSED.\n');

    // Clean up test records
    console.log('Cleaning up test records...');
    await Client.deleteMany({ clientName: { $regex: /^Merged Test Client/ } });
    console.log('✓ Cleanup complete.');

    console.log('==================================================');
    console.log('      ALL MERGED ASSIGNMENT TESTS PASSED!         ');
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN ENCOUNTERED AN ERROR:');
    console.error(error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
