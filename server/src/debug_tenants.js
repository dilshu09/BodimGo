import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodimgo';

// Define simple schemas
const tenantSchema = new mongoose.Schema({
    name: String,
    status: String,
    email: String,
    roomId: String,
    listingId: mongoose.Schema.Types.ObjectId,
    providerId: mongoose.Schema.Types.ObjectId
}, { strict: false });
const Tenant = mongoose.model('Tenant', tenantSchema);

const listingSchema = new mongoose.Schema({
    title: String,
    rooms: [{
        name: String,
        status: String,
        price: Number
    }]
}, { strict: false });
const Listing = mongoose.model('Listing', listingSchema);

async function run() {
    try {
        await mongoose.connect(mongoUri, { family: 4 });
        console.log('Connected to DB');

        const tenants = await Tenant.find({});
        console.log('\n--- Tenants ---');
        tenants.forEach(t => {
            console.log(`Tenant Name: ${t.name}\n  Email: ${t.email}\n  Status: ${t.status}\n  Room ID: ${t.roomId}\n  Listing ID: ${t.listingId}`);
        });

        const listings = await Listing.find({});
        console.log('\n--- Listings and Rooms ---');
        listings.forEach(l => {
            console.log(`Listing: ${l.title} (${l._id})`);
            if (l.rooms && l.rooms.length > 0) {
                l.rooms.forEach(r => {
                    console.log(`  Room Name: ${r.name}\n    Room ID: ${r._id}\n    Status: ${r.status}`);
                });
            } else {
                console.log('  No rooms');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
