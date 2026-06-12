import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getMasterModel } from './models/masterModels.js';
import Client from './models/Client.js';
import User from './models/User.js';
import Role from './models/Role.js';
import AuditLog from './models/AuditLog.js';
import {
  getMasterList,
  createMasterEntry,
  updateMasterEntry,
  deleteMasterEntry,
} from './controllers/masterController.js';

dotenv.config();

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

async function testMasters() {
  console.log('==================================================');
  console.log('       STARTING MASTERS INTEGRATION TESTS         ');
  console.log('==================================================\n');

  try {
    console.log(`Connecting to database at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB.\n');

    // Fetch test admin user with role populated
    const adminUser = await User.findOne({ email: 'admin@company.com' }).populate('role');
    if (!adminUser) {
      throw new Error('Admin user admin@company.com not found. Please run seedDB first.');
    }
    console.log(`✓ Admin user: ${adminUser.name} (${adminUser._id})\n`);

    // Clean up any leftovers from previous test run
    await Client.deleteMany({ clientId: 'C002' });
    const ClientTypeModel = getMasterModel('client-types');
    await ClientTypeModel.deleteOne({ name: 'TestLLP' });
    await ClientTypeModel.deleteOne({ name: 'TestLLPEdit' });
    const ServiceModel = getMasterModel('services');
    await ServiceModel.deleteOne({ name: 'TestService' });

    console.log('--------------------------------------------------');
    console.log('TEST 1: Create Master Entry (Client Type & Service)');
    console.log('--------------------------------------------------');
    let createdClientTypeId;
    {
      const req = {
        params: { category: 'client-types' },
        body: { name: 'TestLLP', description: 'Limited Liability Partnership Test Option', status: 'Active' },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner' }
      };
      const res = makeMockRes();

      await createMasterEntry(req, res);

      console.log(`Status Code: ${res.statusCode} (Expected: 201)`);
      console.log(`JSON Response:`, res.jsonData);

      if (res.statusCode !== 201 || !res.jsonData.success) {
        throw new Error('Failed to create master entry.');
      }
      createdClientTypeId = res.jsonData.data._id;
      console.log('✓ TEST 1 PASSED (Master value created).\n');
    }

    console.log('--------------------------------------------------');
    console.log('TEST 2: Duplicate Name Check');
    console.log('--------------------------------------------------');
    {
      const req = {
        params: { category: 'client-types' },
        body: { name: 'testllp', description: 'Another desc' },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner' }
      };
      const res = makeMockRes();

      await createMasterEntry(req, res);

      console.log(`Status Code: ${res.statusCode} (Expected: 400)`);
      console.log(`JSON Response Message: ${res.jsonData?.message}`);

      if (res.statusCode !== 400 || res.jsonData.success) {
        throw new Error('Failed: Allowed creation of duplicate master name option.');
      }
      console.log('✓ TEST 2 PASSED (Duplicate blocked correctly).\n');
    }

    console.log('--------------------------------------------------');
    console.log('TEST 3: Update Master Entry & Audit Trail');
    console.log('--------------------------------------------------');
    {
      const req = {
        params: { category: 'client-types', id: createdClientTypeId.toString() },
        body: { name: 'TestLLPEdit', description: 'Updated description', status: 'Active' },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner' }
      };
      const res = makeMockRes();

      await updateMasterEntry(req, res);

      console.log(`Status Code: ${res.statusCode} (Expected: 200)`);
      console.log(`JSON Response:`, res.jsonData);

      if (res.statusCode !== 200 || !res.jsonData.success) {
        throw new Error('Failed to update master entry.');
      }

      // Check AuditLog
      const log = await AuditLog.findOne({ action: 'Master Record Updated' }).sort({ createdAt: -1 });
      console.log(`Verify Audit Log entry details: ${log?.details}`);
      if (!log || !log.details.includes('TestLLPEdit')) {
        throw new Error('Audit log was not saved or lacked update details.');
      }
      console.log('✓ TEST 3 PASSED (Master updated and audit logged).\n');
    }

    console.log('--------------------------------------------------');
    console.log('TEST 4: Deletion Blocking when linked to active client');
    console.log('--------------------------------------------------');
    let tempClientId;
    {
      // Create a temporary client linked to "TestLLPEdit" clientType
      const client = await Client.create({
        clientId: 'C002',
        clientName: 'Temp Test Client LLC',
        phoneNumber: '9999999999',
        clientType: 'TestLLPEdit',
        assignedTeamLead: adminUser._id,
        status: 'Active',
        user: new mongoose.Types.ObjectId(), // avoid duplicate null keys unique index constraint
      });
      tempClientId = client._id;
      console.log(`Temporary client created with clientType: "TestLLPEdit"`);

      const req = {
        params: { category: 'client-types', id: createdClientTypeId.toString() },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner' }
      };
      const res = makeMockRes();

      await deleteMasterEntry(req, res);

      console.log(`Status Code: ${res.statusCode} (Expected: 400)`);
      console.log(`JSON Response Message: ${res.jsonData?.message}`);

      if (res.statusCode !== 400 || res.jsonData.success) {
        throw new Error('Failed: Permitted deletion of a master option that is active on a client profile.');
      }
      console.log('✓ TEST 4 PASSED (Deletion blocked as expected).\n');
    }

    console.log('--------------------------------------------------');
    console.log('TEST 5: Delete Master Entry successfully when unlinked');
    console.log('--------------------------------------------------');
    {
      // Clean up/remove link by deleting the client
      await Client.findByIdAndDelete(tempClientId);
      console.log('Client deleted, master option is now unlinked.');

      const req = {
        params: { category: 'client-types', id: createdClientTypeId.toString() },
        user: adminUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner' }
      };
      const res = makeMockRes();

      await deleteMasterEntry(req, res);

      console.log(`Status Code: ${res.statusCode} (Expected: 200)`);
      console.log(`JSON Response:`, res.jsonData);

      if (res.statusCode !== 200 || !res.jsonData.success) {
        throw new Error('Failed to delete master entry even after unlink.');
      }

      // Check Audit Log
      const log = await AuditLog.findOne({ action: 'Master Record Deleted' }).sort({ createdAt: -1 });
      console.log(`Verify Deletion Audit Details: ${log?.details}`);
      if (!log || !log.details.includes('TestLLPEdit')) {
        throw new Error('Audit log for delete not found or missing details.');
      }
      console.log('✓ TEST 5 PASSED (Master deleted after unlink).\n');
    }

    console.log('==================================================');
    console.log('     ALL MASTERS INTEGRATION TESTS PASSED!        ');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ MASTERS TEST ENCOUNTERED FAILURE:');
    console.error(err.stack || err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database.');
    process.exit(0);
  }
}

testMasters();
