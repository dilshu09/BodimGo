import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log('Connecting to:', MONGO_URI);

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => {
    console.log('✅ Connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
