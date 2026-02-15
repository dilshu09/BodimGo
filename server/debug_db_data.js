
import mongoose from 'mongoose';
import Listing from './src/models/Listing.js';
import Booking from './src/models/Booking.js';
import Room from './src/models/Room.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("✅ Check DB Connection: Success");

    try {
        const roomCount = await Room.countDocuments();
        console.log(`\n--- Room Collection Count: ${roomCount} ---`);

        console.log("\n--- Checking Listings with Rooms ---");
        const listingsWithRooms = await Listing.find({ 'rooms.0': { $exists: true } }).limit(3);

        if (listingsWithRooms.length === 0) {
            console.log("⚠️ No listings found with rooms configured.");
        } else {
            listingsWithRooms.forEach(l => {
                console.log(`Listing: ${l.title} (${l._id})`);
                console.log(`Rooms detected: ${l.rooms.length}`);
                l.rooms.forEach(r => {
                    console.log(`  - Room ID: ${r._id}, Name: ${r.name}, Status: ${r.status}, AvailableBeds: ${r.availableBeds}`);
                });
            });
        }

        console.log("\n--- Checking Recent Bookings for Room Data ---");
        const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5);

        if (recentBookings.length === 0) {
            console.log("⚠️ No bookings found.");
        } else {
            recentBookings.forEach(b => {
                console.log(`Booking ID: ${b._id}`);
                console.log(`  - Listing ID: ${b.listing}`);
                console.log(`  - Room Field: ${b.room}`);
                console.log(`  - Status: ${b.status}`);
                console.log(`  - Created At: ${b.createdAt}`);
            });
        }

    } catch (e) {
        console.error("❌ Error querying database:", e);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => {
    console.error("❌ Database Connection Failed:", err);
});
