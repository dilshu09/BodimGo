import mongoose from 'mongoose';
const MONGO_URI = "mongodb://admin:lSAntA78hiLnJe5Y@ac-fvecfyo-shard-00-00.pnnsq3s.mongodb.net:27017/BodimGO?ssl=true&authSource=admin&retryWrites=true&w=majority";

console.log('Connecting to direct node...');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to direct node');
    console.log('Replica Set:', mongoose.connection.db.databaseName);
    // Actually, let's get it from the topology
    console.log('Host:', mongoose.connection.host);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
