import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office';

import DocumentRequest from './models/DocumentRequest.js';
import Invoice from './models/Invoice.js';
import Ticket from './models/Ticket.js';
import Compliance from './models/Compliance.js';
import ClientDocument from './models/ClientDocument.js';

async function testDatabase() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const clientDocs = await ClientDocument.find({});
    console.log(`- ClientDocuments count: ${clientDocs.length}`);

    const reqs = await DocumentRequest.find({});
    console.log(`- DocumentRequests count: ${reqs.length}`);

    const invoices = await Invoice.find({});
    console.log(`- Invoices count: ${invoices.length}`);

    const tickets = await Ticket.find({});
    console.log(`- Support Tickets count: ${tickets.length}`);

    const compliances = await Compliance.find({});
    console.log(`- Compliance Calendar count: ${compliances.length}`);

    console.log('\nMongoose backend schema queries: SUCCESS!');
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Closed.');
  }
}

testDatabase();
