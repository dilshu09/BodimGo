
import mongoose from 'mongoose';
import Tenant from './src/models/tenant.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo");
        console.log("Connected to MongoDB");

        const tenants = await Tenant.find({});
        const seen = new Set();
        const duplicates = [];

        for (const tenant of tenants) {
            const key = `${tenant.providerId}-${tenant.nic}-${tenant.status}`;
            if (seen.has(key)) {
                duplicates.push(tenant);
            } else {
                seen.add(key);
            }
        }

        console.log(`Found ${duplicates.length} duplicates.`);
        duplicates.forEach(d => {
            console.log(`Duplicate: ${d.name} (${d.nic}) - Status: ${d.status} - ID: ${d._id}`);
        });

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkDuplicates();
