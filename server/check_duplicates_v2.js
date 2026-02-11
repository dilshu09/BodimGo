
import mongoose from 'mongoose';
import Tenant from './src/models/tenant.model.js';
import dotenv from 'dotenv';
import path from 'path';

// Specify path to .env file since script is in server root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const checkDuplicates = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        // Add connection timeout
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo", {
            serverSelectionTimeoutMS: 5000
        });
        console.log("Connected to MongoDB");

        const tenants = await Tenant.find({});
        console.log(`Found ${tenants.length} total tenants.`);

        const seen = new Set();
        const duplicates = [];

        for (const tenant of tenants) {
            // Key: Provider + NIC (ignore status to see if same person exists multiple times)
            const key = `${tenant.providerId}-${tenant.nic}`;
            if (seen.has(key)) {
                duplicates.push(tenant);
            } else {
                seen.add(key);
            }
        }

        console.log(`Found ${duplicates.length} duplicates (ignoring status).`);
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
