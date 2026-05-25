import mongoose from 'mongoose';

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office');
    console.log('Connected to MongoDB. Dropping collections...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (let col of collections) {
      console.log(`Dropping collection: ${col.name}`);
      await db.dropCollection(col.name);
    }
    
    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

clearDB();
