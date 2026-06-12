import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/User.js';
import Role from '../models/Role.js';

const debug = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office';
    await mongoose.connect(mongoUri);
    
    const adminUser = await User.findOne({ email: 'admin@company.com' }).populate('role');
    console.log('Admin User:', adminUser);
    console.log('Admin User Role Name:', adminUser?.role?.name);
    
    const allRoles = await Role.find({});
    console.log('All Roles:', allRoles);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debug();
