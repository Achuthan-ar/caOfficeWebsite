import mongoose from 'mongoose';
import 'dotenv/config';

const migrateAssociates = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Starting migration...');

    const db = mongoose.connection.db;
    const collection = db.collection('accountants_master');

    const docs = await collection.find({}).toArray();
    console.log(`Found ${docs.length} documents in accountants_master collection.`);

    let updatedCount = 0;
    const seenEmails = new Set();

    for (const doc of docs) {
      const updates = {};
      let needsUpdate = false;

      // Map 'name' -> 'associate_name' if associate_name is not present
      if (!doc.associate_name && doc.name) {
        updates.associate_name = doc.name;
        needsUpdate = true;
      }

      const associateName = doc.associate_name || doc.name || 'Unnamed Associate';

      // Set unique email if email is not present or invalid
      if (!doc.email) {
        let baseEmail = associateName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (!baseEmail) baseEmail = 'associate';
        let email = `${baseEmail}@example.com`;
        let counter = 1;
        while (seenEmails.has(email)) {
          email = `${baseEmail}${counter}@example.com`;
          counter++;
        }
        updates.email = email;
        seenEmails.add(email);
        needsUpdate = true;
      } else {
        seenEmails.add(doc.email.toLowerCase());
      }

      // Set phone number if phone_number is not present
      if (!doc.phone_number) {
        updates.phone_number = '9999999999';
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`Updating document ID ${doc._id} (${associateName}):`, updates);
        await collection.updateOne({ _id: doc._id }, { $set: updates });
        updatedCount++;
      }
    }

    console.log(`Migration completed successfully! Updated ${updatedCount} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
};

migrateAssociates();
