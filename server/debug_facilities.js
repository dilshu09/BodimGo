import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from "dns";

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb+srv://admin:admin@cluster0.abc.mongodb.net/bodimgo"; // Need to check actual .env if this fails

async function checkFacilities() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const listings = await db.collection('listings').find({}, { projection: { facilities: 1, title: 1 } }).toArray();
        console.log("Total Listings:", listings.length);
        const allFacilities = new Set();
        listings.forEach(l => {
            if (l.facilities && Array.isArray(l.facilities)) {
                l.facilities.forEach(f => allFacilities.add(f));
            }
            console.log(`Listing: ${l.title}, Facilities: ${JSON.stringify(l.facilities)}`);
        });
        console.log("Unique Facilities in DB:", Array.from(allFacilities));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkFacilities();
