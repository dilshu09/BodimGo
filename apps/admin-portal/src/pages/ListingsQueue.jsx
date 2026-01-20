import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert } from 'lucide-react';

const ListingsQueue = () => {
    const [listings, setListings] = useState([]);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/admin/listings/moderation');
            setListings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleAction = async (id, action) => {
        try {
            await api.put(`/admin/listings/${id}/action`, { action });
            fetchQueue();
        } catch (err) {
            alert('Action failed');
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Moderation Queue</h1>
            {listings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No listings require review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {listings.map(listing => (
                        <div key={listing._id} className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-lg">{listing.title}</h3>
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1">
                                        <ShieldAlert size={12} /> Flaaged by AI
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg text-sm">{listing.description}</p>

                                <div className="space-y-1 mb-4">
                                    {listing.aiSafetyFlags.map((flag, i) => (
                                        <div key={i} className="text-sm text-red-600 font-medium">
                                            ⚠️ {flag.reason} (Score: {flag.score})
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Provider: {listing.provider?.name}</span>
                                    <span>Price: {listing.rent} LKR</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 justify-center border-l pl-6 border-gray-100">
                                <button
                                    onClick={() => handleAction(listing._id, 'approve')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                >
                                    Approve Safe
                                </button>
                                <button
                                    onClick={() => handleAction(listing._id, 'reject')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                    Reject & Ban
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListingsQueue;
