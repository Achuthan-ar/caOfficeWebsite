import mongoose from 'mongoose';
import Task from './models/Task.js';
import User from './models/User.js';
import Role from './models/Role.js';
import Client from './models/Client.js';
import AuditLog from './models/AuditLog.js';
import Department from './models/Department.js';

const runTests = async () => {
  console.log('==================================================');
  console.log('       STARTING TASK TRACKER PHASE 3 TESTS        ');
  console.log('==================================================\n');

  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/ca_office';
    console.log(`Connecting to database at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB.\n');

    // 1. Resolve or Seed Roles and Users
    console.log('Resolving user roles and profiles...');
    const adminRole = await Role.findOne({ name: 'Admin' });
    const employeeRole = await Role.findOne({ name: 'Employee' });
    const tlRole = await Role.findOne({ name: 'Manager' });

    if (!adminRole || !employeeRole || !tlRole) {
      throw new Error('Required roles (Admin, Employee, Manager) not found in DB. Run database seeds first.');
    }

    const adminUser = await User.findOne({ role: adminRole._id });
    const employeeUser = await User.findOne({ role: employeeRole._id });
    const tlUser = await User.findOne({ role: tlRole._id });

    if (!adminUser || !employeeUser || !tlUser) {
      throw new Error('Required mock users not found in DB. Run database seeds first.');
    }

    console.log(`✓ Admin User: ${adminUser.name} (${adminUser._id})`);
    console.log(`✓ TL User: ${tlUser.name} (${tlUser._id})`);
    console.log(`✓ Employee User: ${employeeUser.name} (${employeeUser._id})`);

    // Resolve a client profile
    let clientProfile = await Client.findOne({});
    if (!clientProfile) {
      console.log('No client found. Creating temporary client...');
      clientProfile = await Client.create({
        clientName: 'Test Client Corp',
        clientId: 'C001',
        phoneNumber: '9999999999',
        clientType: 'Individuals',
        regularityType: 'Regular',
        status: 'Active',
      });
    }
    console.log(`✓ Client Profile: ${clientProfile.clientName} (${clientProfile._id})\n`);

    // Clean up any tasks from prior test runs
    await Task.deleteMany({ taskName: { $regex: /^Phase 3 Test/ } });

    // --------------------------------------------------
    // TEST 1: Task ID format & sequential auto-generation starting from T1001
    // --------------------------------------------------
    console.log('--------------------------------------------------');
    console.log('TEST 1: Task ID Auto-Generation Format (T1001)');
    console.log('--------------------------------------------------');

    // Find the highest existing TXXXX ID to determine starting number
    const lastTaskObj = await Task.findOne({ taskId: { $regex: /^T\d+$/ } }).sort({ taskId: -1 });
    let expectedNextNum = 1001;
    if (lastTaskObj && lastTaskObj.taskId) {
      const lastNum = parseInt(lastTaskObj.taskId.replace('T', ''), 10);
      if (!isNaN(lastNum) && lastNum >= 1001) {
        expectedNextNum = lastNum + 1;
      }
    }
    console.log(`Expecting next task to generate ID: T${expectedNextNum}`);

    const task1 = await Task.create({
      taskName: 'Phase 3 Test Task 1',
      clientId: clientProfile._id,
      assignedBy: adminUser._id,
      assignedEmployee: employeeUser._id,
      assignedTeamLead: tlUser._id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id,
    });

    console.log(`✓ Created Task 1. Generated taskId: ${task1.taskId}`);
    if (task1.taskId !== `T${expectedNextNum}`) {
      throw new Error(`TEST 1 FAILED: Expected taskId T${expectedNextNum}, got ${task1.taskId}`);
    }

    const task2 = await Task.create({
      taskName: 'Phase 3 Test Task 2',
      clientId: clientProfile._id,
      assignedBy: adminUser._id,
      assignedEmployee: employeeUser._id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id,
    });

    console.log(`✓ Created Task 2. Generated taskId: ${task2.taskId}`);
    if (task2.taskId !== `T${expectedNextNum + 1}`) {
      throw new Error(`TEST 1 FAILED: Expected taskId T${expectedNextNum + 1}, got ${task2.taskId}`);
    }
    console.log('✓ TEST 1 PASSED.\n');

    // --------------------------------------------------
    // TEST 2: Verify pre-save compatibility synchronization & virtuals
    // --------------------------------------------------
    console.log('--------------------------------------------------');
    console.log('TEST 2: Compatibility Fields Sync & Virtuals');
    console.log('--------------------------------------------------');

    const testTask = await Task.create({
      taskName: 'Phase 3 Test Sync Compatibility',
      clientId: clientProfile._id,
      assignedBy: adminUser._id,
      assignedEmployee: employeeUser._id,
      startDate: new Date(),
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue date
      completionRemarks: 'Finished early!',
      createdBy: adminUser._id,
    });

    console.log(`AssignedEmployee: ${testTask.assignedEmployee}`);
    console.log(`Synced AssignedTo: ${testTask.assignedTo}`);
    if (testTask.assignedTo?.toString() !== employeeUser._id.toString()) {
      throw new Error('TEST 2 FAILED: assignedTo compatibility field not synced with assignedEmployee');
    }

    console.log(`CompletionRemarks: "${testTask.completionRemarks}"`);
    console.log(`Synced Remarks: "${testTask.remarks}"`);
    if (testTask.remarks !== 'Finished early!') {
      throw new Error('TEST 2 FAILED: remarks compatibility field not synced with completionRemarks');
    }

    console.log(`isOverdue Virtual: ${testTask.isOverdue}`);
    if (testTask.isOverdue !== true) {
      throw new Error('TEST 2 FAILED: isOverdue virtual did not calculate correctly');
    }
    console.log('✓ TEST 2 PASSED.\n');

    // --------------------------------------------------
    // TEST 3: Check activityLogs detailed audit feed
    // --------------------------------------------------
    console.log('--------------------------------------------------');
    console.log('TEST 3: Delta Auditing Activity Logs');
    console.log('--------------------------------------------------');

    const logTask = await Task.create({
      taskName: 'Phase 3 Test Delta Log',
      clientId: clientProfile._id,
      assignedBy: adminUser._id,
      assignedEmployee: employeeUser._id,
      priority: 'Low',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id,
      activityLogs: [
        {
          user: adminUser._id,
          userName: adminUser.name,
          action: 'Task Created',
          newValue: 'Phase 3 Test Delta Log',
        }
      ]
    });

    // Simulate update status and priority via model/controller logic
    logTask.status = 'In Progress';
    logTask.activityLogs.push({
      user: adminUser._id,
      userName: adminUser.name,
      action: 'Status Changed',
      oldValue: 'To Do',
      newValue: 'In Progress',
    });

    logTask.priority = 'High';
    logTask.activityLogs.push({
      user: adminUser._id,
      userName: adminUser.name,
      action: 'Priority Changed',
      oldValue: 'Low',
      newValue: 'High',
    });

    await logTask.save();

    const savedLogTask = await Task.findById(logTask._id);
    console.log(`Activity Logs Count: ${savedLogTask.activityLogs.length}`);
    if (savedLogTask.activityLogs.length !== 3) { // 1 for creation, 2 for updates
      throw new Error(`TEST 3 FAILED: Expected 3 activity log entries, got ${savedLogTask.activityLogs.length}`);
    }

    const statusLog = savedLogTask.activityLogs.find(l => l.action === 'Status Changed');
    const priorityLog = savedLogTask.activityLogs.find(l => l.action === 'Priority Changed');

    if (!statusLog || statusLog.oldValue !== 'To Do' || statusLog.newValue !== 'In Progress') {
      throw new Error('TEST 3 FAILED: Status change not correctly logged');
    }
    if (!priorityLog || priorityLog.oldValue !== 'Low' || priorityLog.newValue !== 'High') {
      throw new Error('TEST 3 FAILED: Priority change not correctly logged');
    }

    console.log('✓ TEST 3 PASSED.\n');

    // Cleanup test tasks
    console.log('Cleaning up mock test tasks...');
    await Task.deleteMany({ taskName: { $regex: /^Phase 3 Test/ } });
    console.log('✓ Cleanup complete.');

    console.log('==================================================');
    console.log('     ALL TASK TRACKER VERIFICATION TESTS PASSED!  ');
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
