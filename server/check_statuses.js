
import mongoose from 'mongoose';
import Tenant from './src/models/tenant.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const checkStatuses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo", {
            serverSelectionTimeoutMS: 5000
        });
        console.log("Connected to MongoDB");

        const tenants = await Tenant.find({});
        console.log(`Found ${tenants.length} total tenants.`);

        tenants.forEach(t => {
            console.log(`Name: ${t.name}, Status: '${t.status}', ID: ${t._id}, PaymentHistory: ${t.paymentHistory ? 'Yes' : 'No'}`);
        });

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkStatuses();
