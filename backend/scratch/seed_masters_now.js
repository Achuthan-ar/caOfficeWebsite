import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/User.js';
import { ServiceMaster, AccountantMaster, CaseTypeMaster } from '../models/masterModels.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office';

const seedNow = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database.');

    const adminUser = await User.findOne({ email: 'admin@company.com' });
    if (!adminUser) {
      console.error('Admin user not found. Please run seedDB first.');
      process.exit(1);
    }

    const servicesCount = await ServiceMaster.countDocuments();
    if (servicesCount === 0) {
      console.log('Seeding default services master options...');
      const defaultServices = [
        'GST GSTR-1',
        'GST GSTR-3B',
        'Income Tax ITR-1/2',
        'Income Tax ITR-3/4',
        'Income Tax ITR-5/6',
        'Tax Audit Form 3CD',
        'Statutory Audit',
        'TDS Returns',
        'ROC Compliances',
      ];
      await ServiceMaster.insertMany(defaultServices.map(name => ({
        name,
        description: `${name} standard service option`,
        status: 'Active',
        createdBy: adminUser._id
      })));
      console.log('Seeded default services successfully!');
    } else {
      console.log(`Services collection already has ${servicesCount} items.`);
    }

    const caseTypesCount = await CaseTypeMaster.countDocuments();
    if (caseTypesCount === 0) {
      console.log('Seeding default case types master options...');
      const defaultCaseTypes = [
        'GST Filing',
        'Income Tax Filing',
        'Statutory Audit',
        'Internal Audit',
        'TDS Filing',
        'Company Registration',
      ];
      await CaseTypeMaster.insertMany(defaultCaseTypes.map(name => ({
        name,
        description: `${name} case type option`,
        status: 'Active',
        createdBy: adminUser._id
      })));
      console.log('Seeded default case types successfully!');
    } else {
      console.log(`Case types collection already has ${caseTypesCount} items.`);
    }

    const accountantsCount = await AccountantMaster.countDocuments();
    if (accountantsCount === 0) {
      console.log('Seeding default associates master options...');
      const defaultAssociates = [
        { associate_name: 'CA Ramesh', email: 'ramesh@company.com', phone_number: '9888877777' },
        { associate_name: 'CA Suresh', email: 'suresh@company.com', phone_number: '9777766666' },
        { associate_name: 'CA Priya', email: 'priya@company.com', phone_number: '9666655555' },
      ];
      await AccountantMaster.insertMany(defaultAssociates.map(assoc => ({
        ...assoc,
        status: 'Active',
        createdBy: adminUser._id
      })));
      console.log('Seeded default associates successfully!');
    } else {
      console.log(`Associates collection already has ${accountantsCount} items.`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedNow();
