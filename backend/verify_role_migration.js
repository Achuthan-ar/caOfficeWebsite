import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Role from './models/Role.js';
import User from './models/User.js';
import DocumentRequest from './models/DocumentRequest.js';
import Ticket from './models/Ticket.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const runVerification = async () => {
  try {
    console.log('Connecting to database and executing startup migrations/seeding...');
    await connectDB();
    console.log('✓ Database connected and migration hooks executed.\n');

    let errorsCount = 0;

    // 1. Verify Role Collection
    console.log('=== 1. VERIFYING ROLES ===');
    const allRoles = await Role.find({});
    const roleNames = allRoles.map(r => r.name);
    console.log(`Current Roles in DB: ${JSON.stringify(roleNames)}`);

    if (roleNames.includes('TL')) {
      console.error("✗ ERROR: Role 'TL' still exists in the database!");
      errorsCount++;
    } else {
      console.log("✓ Success: Role 'TL' does not exist.");
    }

    const caLoginRole = allRoles.find(r => r.name === 'CA Login');
    if (!caLoginRole) {
      console.error("✗ ERROR: Role 'CA Login' was not found!");
      errorsCount++;
    } else {
      console.log(`✓ Success: Role 'CA Login' exists. Description: "${caLoginRole.description}"`);
    }

    const managerRole = allRoles.find(r => r.name === 'Manager');
    if (!managerRole) {
      console.error("✗ ERROR: Role 'Manager' was not found!");
      errorsCount++;
    } else {
      console.log(`✓ Success: Role 'Manager' exists. Description: "${managerRole.description}"`);
    }

    // 2. Verify User Collection References
    console.log('\n=== 2. VERIFYING USER ROLES ===');
    const users = await User.find({}).populate('role');
    let usersWithOldRoles = 0;
    for (const u of users) {
      if (!u.role) {
        console.warn(`! Warning: User ${u.email} has no role assigned.`);
        continue;
      }
      if (u.role.name === 'TL') {
        console.error(`✗ ERROR: User ${u.email} is still assigned the 'TL' role!`);
        usersWithOldRoles++;
        errorsCount++;
      }
    }
    if (usersWithOldRoles === 0) {
      console.log("✓ Success: No users are assigned the obsolete 'TL' role.");
    }

    // 3. Verify Document Requests
    console.log('\n=== 3. VERIFYING DOCUMENT REQUESTS ===');
    const docReqsWithTL = await DocumentRequest.countDocuments({ requestedByRole: 'TL' });
    const docReqsWithTLHistory = await DocumentRequest.countDocuments({ 'approvalHistory.role': 'TL' });
    
    // Checks for obsolete Manager role string (which should now be 'CA Login')
    const docReqsWithOldManager = await DocumentRequest.countDocuments({ requestedByRole: 'Manager' });
    const docReqsWithOldManagerHistory = await DocumentRequest.countDocuments({ 'approvalHistory.role': 'Manager' });

    if (docReqsWithTL > 0) {
      console.error(`✗ ERROR: Found ${docReqsWithTL} Document Requests with requestedByRole = 'TL'!`);
      errorsCount++;
    } else {
      console.log("✓ Success: No Document Requests with requestedByRole = 'TL'.");
    }

    if (docReqsWithTLHistory > 0) {
      console.error(`✗ ERROR: Found ${docReqsWithTLHistory} Document Requests with 'TL' in approvalHistory!`);
      errorsCount++;
    } else {
      console.log("✓ Success: No Document Requests approval history contains 'TL'.");
    }

    console.log(`Info: Document Requests with requestedByRole = 'Manager' (which is the renamed role): ${docReqsWithOldManager}`);
    console.log(`Info: Document Requests approval history with role = 'Manager': ${docReqsWithOldManagerHistory}`);

    // 4. Verify Support Tickets Comments
    console.log('\n=== 4. VERIFYING SUPPORT TICKETS ===');
    const ticketsWithTLComment = await Ticket.countDocuments({ 'comments.role': 'TL' });
    if (ticketsWithTLComment > 0) {
      console.error(`✗ ERROR: Found ${ticketsWithTLComment} Tickets with comments role = 'TL'!`);
      errorsCount++;
    } else {
      console.log("✓ Success: No Support Tickets contain comments with role 'TL'.");
    }

    // 5. Verify Audit Logs
    console.log('\n=== 5. VERIFYING AUDIT LOGS ===');
    const logsWithTL = await AuditLog.countDocuments({ userRole: 'TL' });
    if (logsWithTL > 0) {
      console.error(`✗ ERROR: Found ${logsWithTL} Audit Logs with userRole = 'TL'!`);
      errorsCount++;
    } else {
      console.log("✓ Success: No Audit Logs with userRole = 'TL'.");
    }

    // Summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    if (errorsCount === 0) {
      console.log('✓✓ ALL TESTS PASSED SUCCESSFULLY! The role migration is clean and complete.');
      process.exit(0);
    } else {
      console.error(`✗✗ FAILED: Found ${errorsCount} migration discrepancies in the database!`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Fatal Verification Error: ${err.message}`);
    process.exit(1);
  }
};

runVerification();
