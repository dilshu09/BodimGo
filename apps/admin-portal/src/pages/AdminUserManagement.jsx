"use client";

import { useState, useEffect } from "react";
import api from "../services/api";
import { Search, MoreVertical, Eye, Edit2, Ban, Trash2 } from "lucide-react";

// ✅ MOCK USERS (providers + tenants)
const MOCK_USERS = [
  {
    _id: "p1",
    name: "Rahul Verma",
    email: "rahul@provider.com",
    role: "provider",
    status: "active",
    createdAt: "2024-01-10",
  },
  {
    _id: "p2",
    name: "Sneha Kapoor",
    email: "sneha@provider.com",
    role: "provider",
    status: "suspended",
    createdAt: "2023-12-18",
  },
  {
    _id: "p3",
    name: "Amit Joshi",
    email: "amit@provider.com",
    role: "provider",
    status: "inactive",
    createdAt: "2023-11-05",
  },
  {
    _id: "t1",
    name: "Ananya Sharma",
    email: "ananya@tenant.com",
    role: "tenant",
    status: "active",
    createdAt: "2024-01-02",
  },
  {
    _id: "t2",
    name: "Rohit Mehta",
    email: "rohit@tenant.com",
    role: "tenant",
    status: "active",
    createdAt: "2023-12-20",
  },
  {
    _id: "t3",
    name: "Priya Nair",
    email: "priya@tenant.com",
    role: "tenant",
    status: "suspended",
    createdAt: "2023-10-11",
  },
];

const AdminUserManagement = () => {
  const [activeTab, setActiveTab] = useState("provider");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);

    try {
      // 🔁 TEMP: use mock data instead of API
      // const res = await api.get("/admin/users");
      // const data = res.data;

      const data = MOCK_USERS;

      setUsers(data);
      filterUsersByRole(data, activeTab);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter users by role
  const filterUsersByRole = (allUsers, role) => {
    const filtered = allUsers.filter((user) => user.role === role);
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

  const handleSuspend = async (id) => {
    if (confirm("Are you sure you want to suspend this user?")) {
      try {
        await api.put(`/admin/users/${id}/suspend`);
        fetchUsers();
      } catch (err) {
        alert("Failed to suspend user");
      }
    }
  };

  const handleDelete = async (id) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    ) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user");
      }
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
          className={`px-6 py-3 font-medium border-b-2 transition ${
            activeTab === "provider"
              ? "border-primary text-primary"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Boarding Providers
        </button>
        <button
          onClick={() => setActiveTab("tenant")}
          className={`px-6 py-3 font-medium border-b-2 transition ${
            activeTab === "tenant"
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
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
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
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {user.name}
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
                        className="p-2 hover:bg-neutral-100 rounded-lg transition"
                      >
                        <MoreVertical size={18} className="text-neutral-400" />
                      </button>
                      {openMenu === user._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-neutral-700 hover:bg-neutral-50 border-b border-neutral-200">
                            <Eye size={16} />
                            View Details
                          </button>
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-neutral-700 hover:bg-neutral-50 border-b border-neutral-200">
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleSuspend(user._id);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-orange-600 hover:bg-orange-50 border-b border-neutral-200"
                          >
                            <Ban size={16} />
                            Suspend
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
    </div>
  );
};

export default AdminUserManagement;
