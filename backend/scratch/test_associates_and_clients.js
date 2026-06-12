import mongoose from 'mongoose';
import 'dotenv/config';
import Client from '../models/Client.js';
import { AccountantMaster } from '../models/masterModels.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { getNextClientId, createClient } from '../controllers/clientController.js';
import { createMasterEntry } from '../controllers/masterController.js';

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

async function testAssociatesAndClients() {
  console.log('==================================================');
  console.log(' STARTING CUSTOM V1 ASSOCIATES & CLIENTS TESTS   ');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to Database.');

    const adminUser = await User.findOne({ email: 'admin@company.com' }).populate('role');
    if (!adminUser) throw new Error('Admin user not found. Run database seed first.');

    console.log('\n--- TEST 1: Next Client ID Pre-Generation ---');
    const reqNextId = {};
    const resNextId = makeMockRes();
    await getNextClientId(reqNextId, resNextId);
    console.log('Next Client ID Response:', resNextId.jsonData);
    if (!resNextId.jsonData.success || !resNextId.jsonData.clientId.startsWith('C')) {
      throw new Error('Test 1 failed: getNextClientId response is invalid.');
    }
    console.log('✓ TEST 1 PASSED.');

    console.log('\n--- TEST 2: Client Types Strict Validation (Allowed Values) ---');
    const reqInvalidType = {
      body: {
        clientName: 'Invalid Type Client',
        phoneNumber: '9876543210',
        clientType: 'IncorrectType', // invalid type
      },
      user: adminUser,
    };
    const resInvalidType = makeMockRes();
    await createClient(reqInvalidType, resInvalidType);
    console.log('Response status:', resInvalidType.statusCode, 'Message:', resInvalidType.jsonData.message);
    if (resInvalidType.statusCode !== 400 || resInvalidType.jsonData.message !== 'Invalid Client Type.') {
      throw new Error('Test 2 failed: Invalid client type was not blocked.');
    }
    console.log('✓ TEST 2 PASSED.');

    console.log('\n--- TEST 3: Regularity Strict Validation (Allowed Values) ---');
    const reqInvalidReg = {
      body: {
        clientName: 'Invalid Regularity Client',
        phoneNumber: '9876543210',
        clientType: 'Individuals',
        regularityType: 'Weekly', // invalid regularity
      },
      user: adminUser,
    };
    const resInvalidReg = makeMockRes();
    await createClient(reqInvalidReg, resInvalidReg);
    console.log('Response status:', resInvalidReg.statusCode, 'Message:', resInvalidReg.jsonData.message);
    if (resInvalidReg.statusCode !== 400 || resInvalidReg.jsonData.message !== 'Invalid Regularity Type.') {
      throw new Error('Test 3 failed: Invalid regularity type was not blocked.');
    }
    console.log('✓ TEST 3 PASSED.');

    console.log('\n--- TEST 4: Unique Email Validation for Associates ---');
    // Clean up if leftover
    await AccountantMaster.deleteMany({ email: 'test.associate@company.com' });

    // Create first associate
    const reqAssoc1 = {
      params: { category: 'accountants' },
      body: {
        associate_name: 'Test Associate One',
        email: 'test.associate@company.com',
        phone_number: '9876543210',
      },
      user: adminUser,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'TestRunner' },
    };
    const resAssoc1 = makeMockRes();
    await createMasterEntry(reqAssoc1, resAssoc1);
    console.log('Create Assoc 1 response status:', resAssoc1.statusCode);
    if (resAssoc1.statusCode !== 201) {
      throw new Error('Test 4 failed: Could not create test associate.');
    }

    // Try creating duplicate email associate
    const reqAssoc2 = {
      params: { category: 'accountants' },
      body: {
        associate_name: 'Test Associate Two',
        email: 'test.associate@company.com',
        phone_number: '8888888888',
      },
      user: adminUser,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'TestRunner' },
    };
    const resAssoc2 = makeMockRes();
    await createMasterEntry(reqAssoc2, resAssoc2);
    console.log('Create Assoc 2 response status:', resAssoc2.statusCode, 'Message:', resAssoc2.jsonData?.message);
    if (resAssoc2.statusCode !== 400 || !resAssoc2.jsonData.message.includes('already exists')) {
      throw new Error('Test 4 failed: Duplicate email associate creation was not blocked.');
    }
    console.log('✓ TEST 4 PASSED.');

    // Cleanup
    await AccountantMaster.deleteMany({ email: 'test.associate@company.com' });
    console.log('\n==================================================');
    console.log(' ALL CUSTOM V1.0 ENDPOINT TESTS PASSED SUCCESSFULLY! ');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ CUSTOM INTEGRATION TESTS ENCOUNTERED A FAILURE:');
    console.error(error.stack || error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAssociatesAndClients();
