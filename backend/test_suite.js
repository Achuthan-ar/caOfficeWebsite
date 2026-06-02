import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Client from './models/Client.js';
import Role from './models/Role.js';
import AuditLog from './models/AuditLog.js';
import { updateUserPassword } from './controllers/userController.js';
import { createEmployee } from './controllers/employeeController.js';
import { createClient, getClients } from './controllers/clientController.js';

// Load env from .env
dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office';

const makeMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

async function runTests() {
  console.log('==================================================');
  console.log('   STARTING FULL SYSTEM INTEGRATION TEST SUITE    ');
  console.log('==================================================\n');

  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✓ Successfully connected to Database.\n');

    // 1. Get essential data for testing
    console.log('Fetching roles from database...');
    const adminRole = await Role.findOne({ name: 'Admin' });
    const internRole = await Role.findOne({ name: 'Intern' });
    const clientRole = await Role.findOne({ name: 'Client' });

    if (!adminRole || !internRole || !clientRole) {
      throw new Error('Roles maps not fully seeded in database. Please run or ensure seedDB runs.');
    }
    console.log(`✓ Roles identified: Admin (${adminRole._id}), Intern (${internRole._id}), Client (${clientRole._id})\n`);

    console.log('Fetching Admin, Intern, and Client users...');
    const adminUser = await User.findOne({ email: 'admin@company.com' });
    const internUser = await User.findOne({ email: 'intern@company.com' });
    const clientUser = await User.findOne({ email: 'client@company.com' });

    if (!adminUser || !internUser || !clientUser) {
      throw new Error('Demo users not fully seeded. Please verify database seeding.');
    }
    console.log(`✓ Admin user: ${adminUser.name} (${adminUser.email})`);
    console.log(`✓ Intern user: ${internUser.name} (${internUser.email})`);
    console.log(`✓ Client user: ${clientUser.name} (${clientUser.email})\n`);


    console.log('--------------------------------------------------');
    console.log('TEST 1: Admin Password Reset Controller');
    console.log('--------------------------------------------------');
    {
      const req = {
        params: { id: internUser._id.toString() },
        body: { password: 'newsecretpassword123' },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'IntegrationTestRunner' }
      };
      const res = makeMockRes();

      await updateUserPassword(req, res);

      console.log(`Response Status Code: ${res.statusCode}`);
      console.log(`Response JSON Data:`, res.jsonData);

      if (res.statusCode !== 200 || !res.jsonData.success) {
        throw new Error('Test 1 failed: Expected success password update.');
      }

      // Check DB password change (should be hashed now due to user schema pre-save hook)
      const updatedIntern = await User.findById(internUser._id).select('+password');
      const isMatch = await updatedIntern.comparePassword('newsecretpassword123');
      console.log(`Verify changed password hashes: ${isMatch ? 'PASS (Match)' : 'FAIL (No Match)'}`);
      if (!isMatch) throw new Error('Password was not saved properly in DB.');

      // Check Audit Log
      const auditLog = await AuditLog.findOne({ action: 'User Password Changed by Admin' }).sort({ createdAt: -1 });
      console.log('Verify AuditLog creation:', auditLog ? 'PASS' : 'FAIL');
      if (!auditLog) throw new Error('AuditLog entry not found.');
      console.log(`Audit Details: ${auditLog.details}`);
      console.log('✓ TEST 1 PASSED.\n');
    }


    console.log('--------------------------------------------------');
    console.log('TEST 2: Exclude Clients from Password Reset');
    console.log('--------------------------------------------------');
    {
      const req = {
        params: { id: clientUser._id.toString() },
        body: { password: 'admincannotchangemypswd' },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'IntegrationTestRunner' }
      };
      const res = makeMockRes();

      await updateUserPassword(req, res);

      console.log(`Response Status Code: ${res.statusCode} (Expected: 400)`);
      console.log(`Response JSON Data:`, res.jsonData);

      if (res.statusCode !== 400 || res.jsonData.success) {
        throw new Error('Test 2 failed: Admin was allowed to change Client password!');
      }
      console.log('✓ TEST 2 PASSED (Successfully blocked admin modification of client passwords).\n');
    }


    console.log('--------------------------------------------------');
    console.log('TEST 3: Auto employeeId Sequential Generation');
    console.log('--------------------------------------------------');
    {
      // We will create a dummy employee and let backend sequentialize employeeId automatically.
      const uniqueEmail = `test.emp.${Date.now()}@company.com`;
      const req = {
        body: {
          name: 'Test Automatic Employee',
          email: uniqueEmail,
          password: 'password123',
          role: 'Employee', // role controller handles role lookup by string
          phone: '+91 90000 80000',
        },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'IntegrationTestRunner' }
      };
      const res = makeMockRes();

      // Find the current highest employee ID matching /^EMP\d+$/
      const lastEmployeeBefore = await User.findOne({
        employeeId: { $regex: /^EMP\d+$/ }
      }).sort({ employeeId: -1 });
      
      const expectedIdNum = lastEmployeeBefore && lastEmployeeBefore.employeeId
        ? parseInt(lastEmployeeBefore.employeeId.replace('EMP', ''), 10) + 1
        : 1;
      const expectedId = `EMP${String(expectedIdNum).padStart(3, '0')}`;

      console.log(`Expecting next employee ID to be: ${expectedId}`);

      await createEmployee(req, res);

      console.log(`Response Status Code: ${res.statusCode} (Expected: 201)`);
      console.log(`Generated Employee Details:`, {
        name: res.jsonData.data?.name,
        email: res.jsonData.data?.email,
        employeeId: res.jsonData.data?.employeeId
      });

      if (res.statusCode !== 201 || !res.jsonData.success) {
        throw new Error(`Test 3 failed to create employee. Message: ${res.jsonData.message}`);
      }

      if (res.jsonData.data.employeeId !== expectedId) {
        throw new Error(`Test 3 failed: expected ID ${expectedId}, but got ${res.jsonData.data.employeeId}`);
      }

      // Cleanup
      await User.findByIdAndDelete(res.jsonData.data._id);
      console.log('Cleanup: Deleted temporary test employee.');
      console.log('✓ TEST 3 PASSED (Successfully sequentialized employeeId auto-generation).\n');
    }


    console.log('--------------------------------------------------');
    console.log('TEST 4: Auto Client ID Generation & Seed Backfill');
    console.log('--------------------------------------------------');
    {
      // Verify seeded client backfills correct Client ID.
      // Let's check seeded Apex Logistics client.
      const seededClient = await Client.findOne({ companyName: /Apex Logistics/i });
      if (seededClient) {
        console.log(`Seeded client "Apex Logistics" Client ID in DB: ${seededClient.clientId}`);
        if (!seededClient.clientId || !/^\d+$/.test(seededClient.clientId)) {
          throw new Error(`Test 4 failed: Seeded client has invalid Client ID format: ${seededClient.clientId}`);
        }
      }

      // Test dynamic getClients backfilling loop
      // We will temporarily delete a client's ID and call getClients to check backfilling
      const clientProfile = await Client.findOne({ companyName: /Apex Logistics/i });
      if (clientProfile) {
        console.log('Temporarily clearing Client ID of Apex Logistics in database...');
        const originalId = clientProfile.clientId;
        clientProfile.clientId = undefined;
        await clientProfile.save();

        const reqGet = { query: {} };
        const resGet = makeMockRes();

        await getClients(reqGet, resGet);

        const restoredClient = await Client.findById(clientProfile._id);
        console.log(`getClients backfill response client count: ${resGet.jsonData.count}`);
        console.log(`Restored Client ID in database after fetch: ${restoredClient.clientId}`);

        if (!restoredClient.clientId || restoredClient.clientId === 'Generated...') {
          throw new Error('Test 4 failed: getClients did not successfully backfill missing Client ID.');
        }

        // Restore original
        restoredClient.clientId = originalId;
        await restoredClient.save();
        console.log('Restored original Client ID.');
      }

      // Test automatic client ID generation on new creation
      const uniqueClientEmail = `test.client.${Date.now()}@company.com`;
      const reqCreate = {
        body: {
          name: 'Test Automatic Client User',
          email: uniqueClientEmail,
          password: 'password123',
          phone: '+91 98888 77777',
          companyName: 'Test Automation Corporation LLC',
          panNumber: 'AAAPA1234E',
          gstin: '27AAAPA1234E1Z1',
        },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'IntegrationTestRunner' }
      };
      const resCreate = makeMockRes();

      await createClient(reqCreate, resCreate);

      console.log(`Response Status Code: ${resCreate.statusCode} (Expected: 201)`);
      console.log(`Generated Client Details:`, {
        name: resCreate.jsonData.data?.user?.name,
        companyName: resCreate.jsonData.data?.companyName,
        clientId: resCreate.jsonData.data?.clientId
      });

      if (resCreate.statusCode !== 201 || !resCreate.jsonData.success) {
        throw new Error(`Test 4 failed to create client. Message: ${resCreate.jsonData.message}`);
      }

      const generatedId = resCreate.jsonData.data.clientId;
      if (!generatedId || generatedId === 'Generated...') {
        throw new Error(`Test 4 failed: Client ID not generated automatically. Got: ${generatedId}`);
      }

      // Cleanup
      const clientDocId = resCreate.jsonData.data._id;
      const userDocId = resCreate.jsonData.data.user._id;
      await Client.findByIdAndDelete(clientDocId);
      await User.findByIdAndDelete(userDocId);
      console.log('Cleanup: Deleted temporary test client.');
      console.log('✓ TEST 4 PASSED (Client ID auto-generation and backfill verified).\n');
    }

    console.log('==================================================');
    console.log('    ALL SYSTEM INTEGRATION TESTS PASSED 100%!     ');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST SUITE ENCOUNTERED A FAILURE:');
    console.error(error.stack || error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from Database.');
    process.exit(0);
  }
}

runTests();
