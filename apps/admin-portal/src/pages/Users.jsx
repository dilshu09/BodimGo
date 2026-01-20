import { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);

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

    const verifyProvider = async (id) => {
        if (confirm('Are you sure you want to verify this provider?')) {
            try {
                await api.put(`/admin/providers/${id}/verify`);
                fetchUsers();
            } catch (err) {
                alert('Verification failed');
            }
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
                                            onClick={() => verifyProvider(user._id)}
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
        </div>
    );
};

export default UsersPage;
