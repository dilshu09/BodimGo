"use client";

import { useState, useEffect } from "react";
import api from "../services/api";
import { Search, MoreVertical, Eye, Edit2, Ban, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";
import WarningModal from "../components/WarningModal";

import { BadgeCheck } from "lucide-react";

// MOCK USERS REMOVED - Using Real API

const AdminUserManagement = () => {
  const [activeTab, setActiveTab] = useState("provider");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    isDanger: false,
    onConfirm: () => { },
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/users");
      const data = res.data;

      setUsers(data);
      filterUsersByRole(data, activeTab);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Filter users by role
  const filterUsersByRole = (allUsers, currentTab) => {
    // Map 'tenant' tab to 'seeker' role in database
    const dbRole = currentTab === "tenant" ? "seeker" : currentTab;

    const filtered = allUsers.filter((user) => user.role === dbRole);
    const searched = filtered.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredUsers(searched);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsersByRole(users, activeTab);
  }, [activeTab, searchQuery, users]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu && !event.target.closest('.user-actions-menu') && !event.target.closest('.user-actions-btn')) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  const handleSuspend = (id, currentStatus) => {
    const isSuspending = currentStatus !== 'suspended';
    setConfirmModal({
      isOpen: true,
      title: isSuspending ? "Suspend User" : "Unsuspend User",
      message: isSuspending
        ? "Are you sure you want to suspend this user? They will not be able to log in."
        : "Are you sure you want to reactivate this user account?",
      confirmText: isSuspending ? "Suspend" : "Activate",
      isDanger: isSuspending,
      onConfirm: async () => {
        try {
          await api.put(`/admin/users/${id}/suspend`);
          toast.success(`User ${isSuspending ? 'suspended' : 'activated'} successfully`);
          fetchUsers();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error("Failed to update user status");
        }
      },
    });
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message: "Are you sure you want to completely delete this user? This action cannot be undone and all associated data will be removed.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          toast.success("User deleted successfully");
          fetchUsers();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error("Failed to delete user");
        }
      },
    });
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/providers/${id}/verify`);
      toast.success("Provider Verified Successfully");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to verify provider");
    }
  };

  const handleWarnUser = async (reason) => {
    try {
      await api.post(`/admin/users/${selectedUser._id}/warn`, { reason });
      toast.success("Warning sent successfully");
      setIsWarningModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to send warning");
    }
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setOpenMenu(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsEditModalOpen(true);
    setOpenMenu(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${selectedUser._id}`, editFormData);
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-700",
      suspended: "bg-red-100 text-red-700",
      inactive: "bg-gray-100 text-gray-700",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("provider")}
          className={`px-6 py-3 font-medium border-b-2 transition ${activeTab === "provider"
            ? "border-primary text-primary"
            : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
        >
          Boarding Providers
        </button>
        <button
          onClick={() => setActiveTab("tenant")}
          className={`px-6 py-3 font-medium border-b-2 transition ${activeTab === "tenant"
            ? "text-primary text-red-500"
            : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
        >
          Tenants
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-neutral-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* User Count */}
      <div className="text-sm text-neutral-500">
        Total {activeTab === "provider" ? "Providers" : "Tenants"}:{" "}
        <span className="font-semibold text-neutral-900">
          {filteredUsers.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No {activeTab === "provider" ? "providers" : "tenants"} found
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-neutral-900">
                  Name
                </th>
                <th className="px-6 py-4 font-semibold text-neutral-900">
                  Email
                </th>
                <th className="px-6 py-4 font-semibold text-neutral-900">
                  Join Date
                </th>
                <th className="px-6 py-4 font-semibold text-neutral-900">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-neutral-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-neutral-50 transition">
                  <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-2">
                    {user.name}
                    {user.isVerified && <BadgeCheck size={16} className="text-blue-500" title="Verified Provider" />}
                    {user.warningCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full" title="Warnings sent">
                        <AlertTriangle size={12} />
                        {user.warningCount}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{user.email}</td>
                  <td className="px-6 py-4 text-neutral-600">
                    {getJoinDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(user.status || "active")}`}
                    >
                      {user.status || "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === user._id ? null : user._id)
                        }
                        className="p-2 hover:bg-neutral-100 rounded-lg transition user-actions-btn"
                      >
                        <MoreVertical size={18} className="text-neutral-400" />
                      </button>
                      {openMenu === user._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 user-actions-menu">
                          <button
                            onClick={() => openViewModal(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-neutral-700 hover:bg-neutral-50 border-b border-neutral-200"
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-neutral-700 hover:bg-neutral-50 border-b border-neutral-200"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          {user.role === 'provider' && !user.isVerified && (
                            <button
                              onClick={() => {
                                handleVerify(user._id);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-blue-600 hover:bg-blue-50 border-b border-neutral-200"
                            >
                              <BadgeCheck size={16} />
                              Verify Provider
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsWarningModalOpen(true);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-orange-600 hover:bg-orange-50 border-b border-neutral-200"
                          >
                            <AlertTriangle size={16} />
                            Send Warning
                          </button>
                          <button
                            onClick={() => {
                              handleSuspend(user._id, user.status);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-orange-600 hover:bg-orange-50 border-b border-neutral-200"
                          >
                            <Ban size={16} />
                            {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(user._id);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center catch-click z-50" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">User Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedUser.status || "active")}`}>
                    {selectedUser.status || "active"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Verified</label>
                <p className="font-medium">{selectedUser.isVerified ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Joined Date</label>
                <p className="font-medium">{getJoinDate(selectedUser.createdAt)}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center catch-click z-50" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="seeker">Tenant (Seeker)</option>
                  <option value="provider">Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Warning Modal */}
      <WarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onSendWarning={handleWarnUser}
      />
    </div>
  );
};

export default AdminUserManagement;
