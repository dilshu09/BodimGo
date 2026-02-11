import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

// Define Schema inline to avoid import issues
const tenantSchema = new mongoose.Schema({
    name: String,
    status: String,
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { strict: false });

const Tenant = mongoose.model('Tenant', tenantSchema);

async function run() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        // Check Pending Tenants
        const pendingCount = await Tenant.countDocuments({ status: 'Pending' });
        console.log(`Found ${pendingCount} pending tenants.`);

        if (pendingCount > 0) {
            const result = await Tenant.updateMany({ status: 'Pending' }, { $set: { status: 'Active' } });
            console.log(`Updated ${result.modifiedCount} tenants to Active.`);
        } else {
            console.log('No pending tenants found to update.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
