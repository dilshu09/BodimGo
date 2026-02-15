
import mongoose from 'mongoose';
import Listing from './src/models/Listing.js';
import Booking from './src/models/Booking.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("✅ Check DB Connection: Success");

    try {
        const targetListingId = "696df4866d6e1b7ec3419f45";
        console.log(`\n--- Checking Target Listing: ${targetListingId} ---`);

        const listing = await Listing.findById(targetListingId);

        if (!listing) {
            console.log("❌ Listing NOT FOUND.");
        } else {
            console.log(`Listing: ${listing.title}`);
            console.log(`Has Rooms Array? ${!!listing.rooms}`);
            console.log(`Rooms Count: ${listing.rooms ? listing.rooms.length : 0}`);
            if (listing.rooms && listing.rooms.length > 0) {
                listing.rooms.forEach(r => {
                    console.log(`  - Room ID: ${r._id}, Name: ${r.name}`);
                });
            } else {
                console.log("⚠️ This listing has NO rooms. Booking.room should be undefined.");
            }
        }

    } catch (e) {
        console.error("❌ Error querying database:", e);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => {
    console.error("❌ Database Connection Failed:", err);
});
