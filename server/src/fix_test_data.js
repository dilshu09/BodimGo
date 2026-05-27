import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodimgo';

// Define schemas inline
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
        price: Number,
        type: { type: String },
        occupancyMode: { type: String },
        capacity: { type: Number }
    }]
}, { strict: false });
const Listing = mongoose.model('Listing', listingSchema);

async function run() {
    try {
        await mongoose.connect(mongoUri, { family: 4 });
        console.log('Connected to DB');

        // 1. Find the "Cool boarding" listing
        const coolBoarding = await Listing.findById('696df4866d6e1b7ec3419f45');
        if (!coolBoarding) {
            console.log('Cool boarding listing not found');
            return;
        }

        console.log('Found Cool boarding:', coolBoarding.title);

        // 2. Add or update room2 with all required fields
        let room2 = coolBoarding.rooms.find(r => r.name === 'room2');
        if (!room2) {
            coolBoarding.rooms.push({
                name: 'room2',
                status: 'Occupied',
                price: 15000,
                type: 'Single',
                occupancyMode: 'Entire Room',
                capacity: 1
            });
            await coolBoarding.save();
            console.log('Added complete room2 to Cool boarding');
            room2 = coolBoarding.rooms.find(r => r.name === 'room2');
        } else {
            console.log('Updating existing room2 with required fields...');
            room2.type = 'Single';
            room2.occupancyMode = 'Entire Room';
            room2.capacity = 1;
            room2.status = 'Occupied';
            await coolBoarding.save();
            console.log('Successfully updated existing room2 with all required fields!');
        }

        // 3. Assign room2 to Chamindu Sandeepa
        const chaminduTenants = await Tenant.find({ email: 'sandeepachamindu20050624@gmail.com', status: 'Active' });
        for (const t of chaminduTenants) {
            t.roomId = room2._id.toString();
            await t.save();
            console.log(`Assigned room2 (${room2._id}) to Chamindu's tenancy ${t._id}`);
        }

        // 4. Update room1 to be Occupied for Dilshani's tenancy
        const dilshaniCoolTenant = await Tenant.findOne({ 
            email: 'dilshanisewwandi665@gmail.com', 
            status: 'Active',
            listingId: '696df4866d6e1b7ec3419f45'
        });

        const room1 = coolBoarding.rooms.find(r => r.name === 'room1');
        if (dilshaniCoolTenant && room1) {
            dilshaniCoolTenant.roomId = room1._id.toString();
            await dilshaniCoolTenant.save();
            console.log(`Assigned room1 (${room1._id}) to Dilshani's Cool boarding tenancy`);
        }

        console.log('Database verification and fixing successfully completed!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
