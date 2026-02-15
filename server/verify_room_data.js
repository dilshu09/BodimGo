
import mongoose from 'mongoose';
import Listing from './src/models/Listing.js';
import Room from './src/models/Room.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const roomCollCount = await Room.countDocuments();
        const listingsWithRooms = await Listing.countDocuments({ 'rooms.0': { $exists: true } });

        console.log(`\n=== DATA MODEL VERIFICATION ===`);
        console.log(`Room Collection Count: ${roomCollCount}`);
        console.log(`Listings with embedded rooms: ${listingsWithRooms}`);

        if (roomCollCount === 0 && listingsWithRooms > 0) {
            console.log("\nCONCLUSION: Rooms are stored as embedded subdocuments in Listings. The 'Room' collection is unused.");
            console.log("ACTION: 'ref: Room' in Booking schema is INCORRECT and should be removed.");
        } else if (roomCollCount > 0) {
            console.log("\nCONCLUSION: 'Room' collection is USED. 'ref: Room' MIGHT be valid if IDs match.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        mongoose.disconnect();
    }
});
