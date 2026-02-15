import { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const UsersPage = () => {
    const [users, setUsers] = useState([]);

    // Modal State
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [providerToVerify, setProviderToVerify] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleVerifyClick = (id) => {
        setProviderToVerify(id);
        setIsVerifyModalOpen(true);
    };

    const confirmVerify = async () => {
        if (!providerToVerify) return;
        try {
            await api.put(`/admin/providers/${providerToVerify}/verify`);
            fetchUsers();
            setIsVerifyModalOpen(false);
            setProviderToVerify(null);
        } catch (err) {
            alert('Verification failed'); // Could replace with toast if available, but sticking to alert replacement for now
            setIsVerifyModalOpen(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">User Management</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'provider' ? 'bg-purple-100 text-purple-700' :
                                        user.role === 'admin' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.isVerified ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                            <CheckCircle size={14} /> Verified
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-yellow-600">
                                            <XCircle size={14} /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {user.role === 'provider' && !user.isVerified && (
                                        <button
                                            onClick={() => handleVerifyClick(user._id)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            Verify
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isVerifyModalOpen}
                title="Verify Provider"
                message="Are you sure you want to verify this provider? They will be able to publish listings."
                confirmText="Verify Provider"
                cancelText="Cancel"
                isDanger={false}
                onConfirm={confirmVerify}
                onCancel={() => {
                    setIsVerifyModalOpen(false);
                    setProviderToVerify(null);
                }}
            />
        </div>
    );
};

export default UsersPage;
