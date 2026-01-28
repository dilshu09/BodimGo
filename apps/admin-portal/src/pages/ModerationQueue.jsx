"use client";

import React, { useState } from "react";
import { Search, MoreVertical, Check, X, AlertTriangle } from "lucide-react";

export default function ModerationQueue() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const reports = [
    {
      id: 1,
      tenantName: "Priya Sharma",
      propertyName: "Luxury Apartment - Downtown",
      reportType: "Misrepresentation",
      severity: "Critical",
      date: "2024-01-25",
      status: "Pending",
      description:
        "Photos do not match the actual condition of the apartment. Rooms are much smaller than shown.",
      evidence: ["Photo mismatch", "False amenities claim"],
    },
    {
      id: 2,
      tenantName: "Rajesh Kumar",
      propertyName: "Cozy Room - Suburbs",
      reportType: "Safety Hazard",
      severity: "High",
      date: "2024-01-24",
      status: "Under Review",
      description:
        "Electrical wiring is faulty and dangerous. Multiple exposed wires in the common area.",
      evidence: ["Safety hazard", "Building violation"],
    },
    {
      id: 3,
      tenantName: "Ananya Patel",
      propertyName: "Modern Studio - City Center",
      reportType: "Harassment",
      severity: "Critical",
      date: "2024-01-23",
      status: "Pending",
      description:
        "Provider is continuously harassing me for additional payments not mentioned in the agreement.",
      evidence: ["Harassment complaint", "Financial dispute"],
    },
    {
      id: 4,
      tenantName: "Vikram Singh",
      propertyName: "Shared Apartment - Westside",
      reportType: "Maintenance Issue",
      severity: "Medium",
      date: "2024-01-22",
      status: "Resolved",
      description:
        "Broken plumbing in the bathroom. No hot water for over a week.",
      evidence: ["Maintenance needed", "Utilities failure"],
    },
    {
      id: 5,
      tenantName: "Sarah Miller",
      propertyName: "Premium Flat - Business District",
      reportType: "Cleanliness",
      severity: "Low",
      date: "2024-01-20",
      status: "Under Review",
      description:
        "Common areas are not properly maintained. Visible dirt and clutter.",
      evidence: ["Cleanliness complaint", "Maintenance issue"],
    },
  ];

  const stats = {
    pending: reports.filter((r) => r.status === "Pending").length,
    underReview: reports.filter((r) => r.status === "Under Review").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
    critical: reports.filter((r) => r.severity === "Critical").length,
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-50 text-red-700 border border-red-200";
      case "High":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "Medium":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "Low":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-neutral-100 text-neutral-700 border border-neutral-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-neutral-100 text-neutral-700 border border-neutral-200";
      case "Under Review":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-neutral-100 text-neutral-700 border border-neutral-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-semibold mb-1">
                Pending Reports
              </p>
              <h3 className="text-3xl font-bold text-neutral-900">
                {stats.pending}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-neutral-100">
              <AlertTriangle size={24} className="text-neutral-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-semibold mb-1">
                Under Review
              </p>
              <h3 className="text-3xl font-bold text-neutral-900">
                {stats.underReview}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <AlertTriangle size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-semibold mb-1">
                Resolved
              </p>
              <h3 className="text-3xl font-bold text-neutral-900">
                {stats.resolved}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100">
              <Check size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-semibold mb-1">
                Critical Issues
              </p>
              <h3 className="text-3xl font-bold text-red-600">
                {stats.critical}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-80 relative">
          <Search
            className="absolute left-4 top-3.5 text-neutral-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by tenant name or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
          />
        </div>

        <div className="flex gap-2">
          {["all", "Pending", "Under Review", "Resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? "bg-red-500 text-white"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-neutral-900">
                    {report.propertyName}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(report.severity)}`}
                  >
                    {report.severity}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}
                  >
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mb-3">
                  <span className="font-semibold">Reported by:</span>{" "}
                  {report.tenantName} •{" "}
                  <span className="font-semibold">Type:</span>{" "}
                  {report.reportType} •{" "}
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(report.date).toLocaleDateString("en-IN")}
                </p>
                <p className="text-neutral-700 mb-3">{report.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {report.evidence.map((ev, idx) => (
                    <span
                      key={idx}
                      className="bg-neutral-100 text-neutral-700 text-xs px-3 py-1 rounded-full"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative ml-4">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === report.id ? null : report.id)
                  }
                  className="p-2 hover:bg-neutral-100 rounded-lg transition"
                >
                  <MoreVertical size={16} className="text-neutral-600" />
                </button>
                {openMenu === report.id && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition">
                      View Full Details
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition border-t border-neutral-100">
                      Mark as Under Review
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 transition border-t border-neutral-100">
                      <Check size={16} />
                      Mark as Resolved
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-t border-neutral-100">
                      Ban Property
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition border-t border-neutral-100">
                      Suspend Provider
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-600 font-medium">No reports found</p>
        </div>
      )}
    </div>
  );
}
