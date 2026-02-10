"use client";

import React, { useState, useEffect } from "react";
import { Search, MoreVertical, Check, X, AlertTriangle, Flag } from "lucide-react";
import { toast } from "react-hot-toast";

import api from "../services/api";

export default function ModerationQueue() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  const fetchListings = async () => {
    try {
      const res = await api.get('/admin/listings/moderation');
      setListings(res.data);
    } catch (error) {
      console.error("Failed to fetch moderation queue", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchReports();
  }, []);

  // --- Message Modal Logic ---
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'approve', 'reject', 'contact'
  const [selectedListing, setSelectedListing] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const openActionModal = (listing, type) => {
    setSelectedListing(listing);
    setModalType(type);
    setMessage(""); // Reset
    setOpenMenu(null); // Close dropdown
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedListing) return;
    setSending(true);

    try {
      if (modalType === 'contact') {
        // New Contact Endpoint
        await api.post('/admin/providers/contact', {
          providerId: selectedListing.provider._id,
          listingId: selectedListing._id,
          subject: `Regarding Listing: ${selectedListing.title}`,
          message: message
        });
        toast.success("Message sent to provider!");
      }
      else {
        // Approve / Reject with Message
        await api.put(`/admin/listings/${selectedListing._id}/action`, {
          action: modalType,
          message: message
        });
        toast.success(`Listing ${modalType}ed successfully!`);
        fetchListings(); // Refresh list
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_review":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "hidden_by_audit":
        return "bg-red-50 text-red-700 border border-red-200";
      case "rejected":
        return "bg-neutral-100 text-neutral-500 border border-neutral-200";
      default:
        return "bg-neutral-100 text-neutral-700 border border-neutral-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-semibold mb-1">
                Flagged by AI
              </p>
              <h3 className="text-3xl font-bold text-red-600">
                {listings.filter(l => l.status === 'hidden_by_audit').length}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-semibold mb-1">
                User Reports
              </p>
              <h3 className="text-3xl font-bold text-orange-600">
                {reports.filter(r => r.status === 'Pending').length}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-orange-100">
              <Flag size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-neutral-200">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'listings' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-700'}`}
          onClick={() => setActiveTab('listings')}
        >
          Flagged Listings
          {listings.filter(l => l.status === 'hidden_by_audit').length > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              {listings.filter(l => l.status === 'hidden_by_audit').length}
            </span>
          )}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'reports' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-700'}`}
          onClick={() => setActiveTab('reports')}
        >
          User Reports
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'listings' ? (
          listings.filter(l => l.status === 'hidden_by_audit').map((listing) => (
            <div key={listing._id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

              {/* Card Header: Title & Status */}
              <div className="p-6 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-neutral-900">{listing.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(listing.status)}`}>
                      {listing.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-sm flex items-center gap-2">
                    Submitted on {new Date(listing.createdAt).toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* AI Reason Box */}
                {(listing.auditLog?.length > 0 || listing.aiSafetyFlags?.length > 0) && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 max-w-md animate-in fade-in slide-in-from-right duration-500">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-1.5 rounded-lg border border-red-100 shadow-sm text-red-500 shrink-0">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <h4 className="text-red-900 font-bold text-sm">Action Required: AI Flagged</h4>
                        <p className="text-red-700 text-xs mt-1 mb-2 font-medium">The following issues were detected:</p>
                        <ul className="space-y-1">
                          {(listing.auditLog?.length > 0 ? listing.auditLog : listing.aiSafetyFlags?.map(f => ({ reason: f }))).map((log, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-red-800 font-semibold bg-red-100/50 px-2 py-1 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                              {log.reason || log}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visuals Column */}
                <div className="lg:col-span-1 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Listing Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {listing.images?.slice(0, 4).map((img, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden border border-neutral-200 relative group cursor-pointer">
                        <img src={img} alt={`Listing ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-neutral-700 text-sm leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        {listing.description}
                      </p>
                    </div>

                    {/* Provider Info */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Provider Details</h4>
                      <div className="flex items-center gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {listing.provider?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-sm">{listing.provider?.name || 'Unknown'}</p>
                            <p className="text-xs text-neutral-500">{listing.provider?.email}</p>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-blue-200"></div>
                        <div>
                          <p className="text-xs text-neutral-500 font-medium uppercase">Phone Number</p>
                          <p className="font-bold text-neutral-900 text-sm">{listing.provider?.phone || 'N/A'}</p>
                        </div>
                        <div className="ml-auto">
                          <button
                            onClick={() => openActionModal(listing, 'contact')}
                            className="text-primary hover:text-primary-hover font-bold text-xs flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-primary/20 shadow-sm hover:shadow transition-all"
                          >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Message Provider
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar (Directly Visible) */}
                  <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-end gap-3">
                    <button
                      onClick={() => openActionModal(listing, 'reject')}
                      className="px-6 py-2.5 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"
                    >
                      <X size={18} />
                      Reject Listing
                    </button>
                    <button
                      onClick={() => openActionModal(listing, 'approve')}
                      className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Check size={18} />
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          // User Reports List 
          reports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-neutral-900">
                      Report against: {report.listing?.title || 'Unknown Listing'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${report.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {report.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">
                    <span className="font-semibold">Reason:</span> {report.reason}
                  </p>
                  <p className="text-neutral-700 mb-3 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    "{report.description}"
                  </p>
                  <p className="text-xs text-neutral-500">
                    Reported by: {report.reporter?.name || 'Unknown'} ({report.reporter?.email}) • {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {report.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolveReport(report._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors"
                  >
                    <Check size={16} />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {listings.length === 0 && activeTab === 'listings' && (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100 border-dashed">
            <div className="mx-auto w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">All caught up!</h3>
            <p className="text-neutral-500">No listings require moderation at this time.</p>
          </div>
        )}
      </div>

      {/* Premium Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-100 overflow-hidden transform transition-all scale-100">
            <div className={`p-6 border-b border-neutral-100 flex items-center gap-4 ${modalType === 'reject' ? 'bg-red-50/50' :
              modalType === 'approve' ? 'bg-emerald-50/50' :
                'bg-blue-50/50'
              }`}>
              <div className={`p-3 rounded-xl ${modalType === 'reject' ? 'bg-red-100 text-red-600' :
                modalType === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                {modalType === 'reject' ? <AlertTriangle size={24} /> :
                  modalType === 'approve' ? <Check size={24} /> :
                    <div className="w-6 h-6"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>
                }
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 capitalize">
                  {modalType === 'contact' ? 'Message Provider' : `${modalType} Listing`}
                </h3>
                <p className="text-sm text-neutral-500">
                  {modalType === 'approve' && "Notify the provider that their listing is live."}
                  {modalType === 'reject' && "Explain why the listing was rejected."}
                  {modalType === 'contact' && "Send a direct inquiry to the provider."}
                </p>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-bold text-neutral-700 mb-2">
                {modalType === 'reject' ? "Reason for Rejection *" : "Message (Optional)"}
              </label>
              <textarea
                className="w-full p-4 border border-neutral-200 rounded-xl mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm min-h-[120px]"
                placeholder={modalType === 'reject' ? "e.g., The images contain watermarks..." : "Type your message here..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-neutral-400 mb-6">
                This message will be emailed to the provider and saved in the audit log.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-neutral-600 font-semibold hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={sending || (modalType === 'reject' && !message.trim())}
                  className={`px-6 py-2.5 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-neutral-200 hover:shadow-xl transition-all ${modalType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    modalType === 'contact' ? 'bg-primary hover:bg-primary-hover' :
                      'bg-emerald-600 hover:bg-emerald-700'
                    } disabled:opacity-50 disabled:shadow-none`}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>Confirm {modalType === 'contact' ? 'Message' : modalType}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
