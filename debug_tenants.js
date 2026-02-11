import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') }); // Adjust path if needed

// Define simple schemas to avoid import issues
const tenantSchema = new mongoose.Schema({
    name: String,
    status: String,
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    email: String
});

const Tenant = mongoose.model('Tenant', tenantSchema);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
});
const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bodimgo');
        console.log('Connected to DB');

        const providers = await User.find({ role: 'provider' });
        console.log('--- Providers ---');
        providers.forEach(p => console.log(`ID: ${p._id}, Name: ${p.name}, Email: ${p.email}`));

        const tenants = await Tenant.find({});
        console.log('\n--- All Tenants ---');
        console.log(`Total Tenants: ${tenants.length}`);
        tenants.forEach(t => {
            console.log(`Name: ${t.name}, Status: '${t.status}', Provider: ${t.providerId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
