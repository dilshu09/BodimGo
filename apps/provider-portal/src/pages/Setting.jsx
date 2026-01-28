"use client";
import { Lock, Bell, DollarSign, Shield } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: "user" },
    { id: "security", label: "Security", icon: "lock" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "payment", label: "Payment Methods", icon: "payment" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-1">
          Manage your profile and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeTab === tab.id
                ? "border-red-500 bg-red-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p
              className={`font-semibold ${activeTab === tab.id ? "text-red-600" : "text-slate-900"}`}
            >
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your Full Name"
                defaultValue="Muhammad Ali"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                defaultValue="ali@boarding.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+92 300 123 4567"
                defaultValue="+92 300 123 4567"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Boarding Name
              </label>
              <input
                type="text"
                placeholder="Your Boarding Name"
                defaultValue="Ali's Boarding House"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Address
              </label>
              <textarea
                placeholder="Your Address"
                defaultValue="123 Main Street, Karachi"
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
              ></textarea>
            </div>
            <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
              Save Changes
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-red-500" />
                Change Password
              </h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                  Update Password
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-red-500" />
                Two-Factor Authentication
              </h3>
              <p className="text-slate-600 mb-4">
                Add an extra layer of security to your account
              </p>
              <button className="px-6 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium">
                Enable 2FA
              </button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell size={20} className="text-red-500" />
                Email Notifications
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "New Bookings",
                    desc: "Get notified when you receive new bookings",
                  },
                  {
                    label: "Payment Received",
                    desc: "Receive alerts for successful payments",
                  },
                  {
                    label: "Tenant Messages",
                    desc: "Get notified of new messages from tenants",
                  },
                  {
                    label: "Reviews & Ratings",
                    desc: "Be notified when you receive new reviews",
                  },
                ].map((item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-red-500 rounded"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-600">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-red-500" />
                Bank Account Details
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  defaultValue="Muhammad Ali"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Bank Name"
                  defaultValue="Habib Bank Limited"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  defaultValue="12345678901234"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="IBAN"
                  defaultValue="PK00ABCD1234567890"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                  Update Bank Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
