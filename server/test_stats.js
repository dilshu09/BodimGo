import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './src/models/User.js';
import Listing from './src/models/Listing.js';
import Booking from './src/models/Booking.js';
import Report from './src/models/Report.js';

dns.setServers(['8.8.8.8']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI, { family: 4 })
    .then(async () => {
        try {
            console.log("Connected to DB, running stats logic...");
            
            // Auto-migrate legacy 'pending_review' listings to 'active' since approval queue is removed
            await Listing.updateMany({ status: 'pending_review' }, { status: 'active' });

            const calculateStockGrowth = async (Model, query = {}) => {
              const now = new Date();
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

              const currentCount = await Model.countDocuments(query);
              const prevCount = await Model.countDocuments({
                ...query,
                createdAt: { $lt: monthAgo }
              });

              if (prevCount === 0) return currentCount > 0 ? 100 : 0;
              return Math.round(((currentCount - prevCount) / prevCount) * 100);
            };

            const calculateRevenueGrowth = async () => {
              const now = new Date();
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

              // Total Revenue (All Time)
              const totalRevResult = await Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
              ]);
              const totalRev = (totalRevResult.length > 0 ? totalRevResult[0].total : 0) * 0.05;

              // Revenue up to last month
              const prevRevResult = await Booking.aggregate([
                { $match: { paymentStatus: 'paid', createdAt: { $lt: monthAgo } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
              ]);
              const prevRev = (prevRevResult.length > 0 ? prevRevResult[0].total : 0) * 0.05;

              if (prevRev === 0) return totalRev > 0 ? 100 : 0;
              return Math.round(((totalRev - prevRev) / prevRev) * 100);
            };

            const totalUsers = await User.countDocuments();
            console.log("Total users fetched:", totalUsers);
            const usersGrowth = await calculateStockGrowth(User);
            console.log("Users growth calculated:", usersGrowth);

            const activeListings = await Listing.countDocuments({ status: { $in: ['active', 'published', 'Published'] } });
            console.log("Active listings fetched:", activeListings);
            const listingsGrowth = await calculateStockGrowth(Listing, { status: { $in: ['active', 'published', 'Published'] } });
            console.log("Listings growth calculated:", listingsGrowth);

            const hiddenListingsCount = await Listing.countDocuments({ status: 'hidden_by_audit' });
            console.log("Hidden listings count:", hiddenListingsCount);
            const pendingReportsCount = await Report.countDocuments({ status: 'Pending' });
            console.log("Pending reports count:", pendingReportsCount);

            const pendingReviews = hiddenListingsCount + pendingReportsCount;

            const hiddenListingsGrowth = await calculateStockGrowth(Listing, { status: 'hidden_by_audit' });
            const pendingGrowth = hiddenListingsGrowth;

            const revenueResult = await Booking.aggregate([
              { $match: { paymentStatus: 'paid' } },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);
            console.log("Revenue result fetched:", revenueResult);
            const totalVolume = revenueResult.length > 0 ? revenueResult[0].total : 0;
            const revenue = totalVolume * 0.05; // 5% Platform Commission
            const revenueGrowth = await calculateRevenueGrowth();
            console.log("Revenue growth calculated:", revenueGrowth);

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const userGrowth = await User.aggregate([
              {
                $match: {
                  createdAt: { $gte: sixMonthsAgo }
                }
              },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]);
            console.log("User growth chart data fetched:", userGrowth);

            const months = [];
            for (let i = 5; i >= 0; i--) {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              months.push(d.toISOString().slice(0, 7)); // YYYY-MM
            }

            const chartData = months.map(month => {
              const found = userGrowth.find(item => item._id === month);
              const dateObj = new Date(month + "-01");
              return {
                name: dateObj.toLocaleString('default', { month: 'short' }),
                active: found ? found.count : 0,
                new: found ? found.count : 0
              };
            });

            console.log("SUCCESS! Stats calculated correctly:", {
              totalUsers,
              usersGrowth,
              activeListings,
              listingsGrowth,
              revenue,
              revenueGrowth,
              pendingReviews,
              pendingGrowth,
              chartData
            });

        } catch (e) {
            console.error("STATS ERROR:", e);
        } finally {
            mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(e => {
        console.error("CONNECTION ERROR:", e);
        process.exit(1);
    });
