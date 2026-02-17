"use client";

import React, { useState, useEffect } from "react";
import { Search, MoreVertical, Check, X, AlertTriangle, Flag, Mail, Ban, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";

import api from "../services/api";

export default function ModerationQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Provider View Modal State
  const [viewProvider, setViewProvider] = useState(null); // The provider object
  const [providerListings, setProviderListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Action Modals State
  const [actionModal, setActionModal] = useState({ type: null, provider: null, listingId: null });
  const [actionReason, setActionReason] = useState("");
  const [contactSubject, setContactSubject] = useState("");

  const [contactMessage, setContactMessage] = useState("");

  // Suspend/Activate Modal
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolveReport = async (reportId) => {
    try {
      await api.put(`/reports/${reportId}/resolve`);
      toast.success("Report resolved");
      fetchReports();
    } catch (err) {
      toast.error("Failed to resolve report");
    }
  };

  const handleSuspendClick = (user) => {
    setUserToSuspend(user);
    setIsSuspendModalOpen(true);
  };

  const confirmSuspend = async () => {
    if (!userToSuspend) return;
    try {
      await api.put(`/admin/users/${userToSuspend._id}/suspend`);
      toast.success(`User ${userToSuspend.status === 'suspended' ? 'activated' : 'suspended'} successfully`);
      fetchReports();
      if (viewProvider && viewProvider._id === userToSuspend._id) {
        setViewProvider({ ...viewProvider, status: userToSuspend.status === 'suspended' ? 'active' : 'suspended' });
      }
      setIsSuspendModalOpen(false);
      setUserToSuspend(null);
    } catch (error) {
      toast.error("Failed to update user status");
      setIsSuspendModalOpen(false);
    }
  };

  const submitAction = async () => {
    if (!actionModal.provider) return;

    try {
      if (actionModal.type === 'warn') {
        if (!actionReason) return toast.error("Please enter a warning reason");
        await api.post(`/admin/users/${actionModal.provider._id}/warn`, { reason: actionReason });
        toast.success("Warning sent to user");
      } else if (actionModal.type === 'contact') {
        if (!contactSubject || !contactMessage) return toast.error("Please fill all fields");
        await api.post('/admin/providers/contact', {
          providerId: actionModal.provider._id,
          listingId: actionModal.listingId,
          subject: contactSubject,
          message: contactMessage
        });
        toast.success("Message sent to provider");
      }

      setActionModal({ type: null, provider: null, listingId: null });
      setActionReason("");
      setContactSubject("");
      setContactMessage("");
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    }
  };

  const handleViewProvider = async (provider) => {
    setViewProvider(provider);
    setLoadingListings(true);
    setProviderListings([]);

    try {
      const res = await api.get(`/admin/providers/${provider._id}/listings`);
      setProviderListings(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch provider listings");
    } finally {
      setLoadingListings(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "pending_review": return "bg-blue-100 text-blue-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-neutral-100 text-neutral-600";
    }
  };

  // Listing Detail View State
  const [selectedListing, setSelectedListing] = useState(null);

  const handleViewListing = (listing) => {
    setSelectedListing(listing);
  };

  return (
    <div className="space-y-6">
      {/* Title / Header */}
      <div className="flex justify-between items-center bg-orange-50/50 dark:bg-slate-900 p-6 rounded-2xl border border-orange-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -z-10 opacity-50 translate-x-10 -translate-y-10"></div>

        <div>
          <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-50">User Reports</h2>
          <p className="text-orange-700 dark:text-orange-200/70 text-sm mt-1">Review and resolve community flags</p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="text-right">
            <p className="text-sm font-semibold text-orange-800">Pending Actions</p>
            <h3 className="text-3xl font-bold text-orange-600">{reports.filter(r => r.status === 'Pending').length}</h3>
          </div>
          <div className="p-3.5 rounded-xl bg-white text-orange-600 shadow-sm border border-orange-100">
            <Flag size={28} />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-neutral-500 dark:text-slate-400">Loading reports...</p>
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report._id} className="group relative bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#FF385C] overflow-hidden">
              <div className="p-5 md:p-6">
                {/* Top Row: Report ID & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <Flag size={12} />
                    <span>ID: {report._id.slice(-6)}</span>
                    <span className="text-neutral-300">•</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${report.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                    {report.status || 'Pending'}
                  </span>
                </div>

                {/* Listing Title */}
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-[#FF385C] transition-colors">
                  {report.listing?.title || 'Unknown Listing'}
                </h3>

                {/* Reporter Info (Subtle) */}
                <p className="text-sm text-neutral-500 mb-6 flex items-center gap-1">
                  Reported by <span className="font-medium text-neutral-900">{report.reporter?.name || 'Anonymous'}</span>
                </p>

                {/* The Issue Section */}
                <div className="bg-neutral-50 dark:bg-slate-800 rounded-lg p-4 border border-neutral-100 dark:border-slate-700 mb-6 group-hover:bg-white dark:group-hover:bg-slate-800/80 group-hover:border-[#FF385C]/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-[#FF385C] rounded-full shadow-sm text-[#FF385C] dark:text-white shrink-0 border border-neutral-100 dark:border-[#FF385C]">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide mb-1">Reason: {report.reason}</h4>
                      <p className="text-neutral-600 dark:text-slate-300 text-sm leading-relaxed">
                        "{report.description}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Provider Section & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-neutral-100 dark:border-slate-800">
                  {/* Provider Mini Profile */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {report.listing?.provider ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-neutral-100 border border-white shadow-sm overflow-hidden shrink-0 relative">
                          {report.listing.provider.profileImage ? (
                            <img src={report.listing.provider.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold">{report.listing.provider.name?.[0]}</div>
                          )}
                          {report.listing.provider.status === 'suspended' && (
                            <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center text-white backdrop-blur-[1px]">
                              <Ban size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight flex items-center gap-2">
                            {report.listing.provider.name}
                            {report.listing.provider.isVerified && <Check size={12} className="text-blue-500" />}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                            <span>{report.listing.provider.email}</span>
                            {report.listing.provider.warningCount > 0 && (
                              <span className="flex items-center gap-0.5 text-orange-600 font-medium bg-orange-50 px-1.5 rounded-md border border-orange-100" title="Warning Count">
                                <ShieldAlert size={10} /> {report.listing.provider.warningCount}
                              </span>
                            )}
                            {(report.listing.provider.reportCount || 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-red-600 font-medium bg-red-50 px-1.5 rounded-md border border-red-100" title="Total Reports Against Provider">
                                <Flag size={10} /> {report.listing.provider.reportCount || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-neutral-400 italic">Provider unknown</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                    {report.listing?.provider && (
                      <>
                        <button
                          onClick={() => setActionModal({ type: 'contact', provider: report.listing.provider, listingId: report.listing._id })}
                          className="p-2 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all"
                          title="Contact Provider"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => setActionModal({ type: 'warn', provider: report.listing.provider })}
                          className="p-2 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all"
                          title="Warn Provider"
                        >
                          <ShieldAlert size={16} />
                        </button>
                        <button
                          onClick={() => handleSuspendClick(report.listing.provider)}
                          className={`p-2 rounded-lg border transition-all ${report.listing.provider.status === 'suspended'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                            : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30'
                            }`}
                          title={report.listing.provider.status === 'suspended' ? "Unsuspend Provider" : "Suspend Provider"}
                        >
                          <Ban size={16} />
                        </button>
                        <div className="h-6 w-px bg-neutral-200 dark:bg-slate-700 mx-1"></div>
                        <button
                          onClick={() => handleViewProvider(report.listing.provider)}
                          className="py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-300 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-slate-800 hover:border-neutral-300 dark:hover:border-slate-600 transition-all"
                        >
                          Details
                        </button>
                      </>
                    )}

                    {report.status !== 'Resolved' && (
                      <button
                        onClick={() => handleResolveReport(report._id)}
                        className="py-1.5 px-4 rounded-lg bg-neutral-900 text-white text-sm font-bold shadow-md hover:bg-black hover:scale-105 transition-all"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-neutral-100 dark:border-slate-800 border-dashed">
            <div className="mx-auto w-16 h-16 bg-neutral-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">All caught up!</h3>
            <p className="text-neutral-500 dark:text-slate-400">No user reports pending review.</p>
          </div>
        )}
      </div>

      {/* Provider Details Modal */}
      {viewProvider && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-neutral-100 dark:border-slate-800 overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-start bg-neutral-50 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                {selectedListing ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedListing(null)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
                      Back
                    </button>
                    <h3 className="text-xl font-bold text-neutral-900 truncate max-w-md">{selectedListing.title}</h3>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-md">
                      {viewProvider.profileImage ? (
                        <img src={viewProvider.profileImage} alt={viewProvider.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-400">
                          {viewProvider.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        {viewProvider.name}
                        {viewProvider.isVerified && <Check size={18} className="text-blue-500" />}
                      </h3>
                      <div className="text-sm text-neutral-500 dark:text-slate-400 space-y-1">
                        <p>{viewProvider.email}</p>
                        <p>{viewProvider.phone || 'No phone number'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setViewProvider(null); setSelectedListing(null); }}
                className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
              >
                <X size={24} className="text-neutral-500" />
              </button>
            </div>

            {/* Body - Content Switch */}
            <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/30 dark:bg-slate-900">
              {selectedListing ? (
                <div className="space-y-6">
                  {/* Listing Images Grid */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg text-neutral-800">Gallery</h4>
                    {selectedListing.images && selectedListing.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedListing.images.map((img, idx) => (
                          <div key={idx} className="aspect-square bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                            <img src={img} alt={`Listing ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-40 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400">
                        No Images Available
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <h4 className="font-bold text-lg text-neutral-800">Description</h4>
                        <p className="text-neutral-600 whitespace-pre-line text-sm leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                          {selectedListing.description || "No description provided."}
                        </p>
                      </div>

                      {/* Rooms Section */}
                      {selectedListing.rooms && selectedListing.rooms.length > 0 && (
                        <div>
                          <h4 className="font-bold text-lg text-neutral-800 mb-2">Rooms</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedListing.rooms.map((room, idx) => (
                              <div key={idx} className="bg-white border border-neutral-200 rounded-lg p-3 flex gap-3">
                                <div className="w-20 h-20 bg-neutral-100 rounded-md overflow-hidden shrink-0">
                                  {room.images?.[0] ? (
                                    <img src={room.images[0]} className="w-full h-full object-cover" alt="Room" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No Img</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-sm text-neutral-900 truncate">{room.name}</h5>
                                  <p className="text-xs text-neutral-500">{room.occupancyMode || 'Room'}</p>
                                  <div className="mt-1 flex gap-1 flex-wrap">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${room.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                                      }`}>
                                      {room.status}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold">
                                      Rs {room.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-lg text-neutral-800">Location</h4>
                        <p className="text-neutral-600 text-sm">
                          {selectedListing.location?.address}, {selectedListing.location?.city}, {selectedListing.location?.district}
                        </p>
                      </div>
                    </div>



                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-neutral-200 dark:border-slate-700 shadow-sm sticky top-6">
                        <div className={`text-center py-1 px-3 rounded-full text-xs font-bold uppercase tracking-wide mb-4
                                            ${selectedListing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>
                          {selectedListing.status}
                        </div>

                        <h5 className="font-bold text-neutral-900 dark:text-white mb-2 border-b border-neutral-100 dark:border-slate-700 pb-2">Listing Stats</h5>
                        <div className="space-y-3 text-sm text-neutral-600 dark:text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-slate-400">Total Views</span>
                            <span className="font-semibold text-neutral-900 dark:text-white">{selectedListing.stats?.views || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-slate-400">Listing Type</span>
                            <span className="font-semibold capitalize text-neutral-900 dark:text-white">{selectedListing.type?.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-slate-400">Rooms</span>
                            <span className="font-semibold text-neutral-900 dark:text-white">{selectedListing.rooms?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-slate-400">Gender Policy</span>
                            <span className="font-semibold text-neutral-900 dark:text-white">{selectedListing.genderPolicy || 'Mixed'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-bold text-neutral-800 dark:text-white mb-4">Properties Listed by {viewProvider.name.split(' ')[0]}</h4>

                  {loadingListings ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                    </div>
                  ) : providerListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {providerListings.map(listing => (
                        <div
                          key={listing._id}
                          onClick={() => handleViewListing(listing)}
                          className="group relative bg-white dark:bg-slate-800 p-4 rounded-xl border border-neutral-200 dark:border-slate-700 shadow-sm flex gap-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-[#FF385C] overflow-hidden"
                        >
                          <div className="w-24 h-24 rounded-lg bg-neutral-100 shrink-0 overflow-hidden relative border border-neutral-100">
                            {listing.images?.[0] ? (
                              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300"><Search size={20} /></div>
                            )}
                            <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm bg-white/90 ${listing.status === 'active' ? 'text-emerald-700' : 'text-neutral-600'
                              }`}>
                              {listing.status}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h5 className="font-bold text-neutral-900 dark:text-white truncate text-lg group-hover:text-[#FF385C] transition-colors mb-1">{listing.title}</h5>
                            <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2">
                              <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
                              <p className="truncate">{listing.location?.address}, {listing.location?.city}</p>
                            </div>

                            <div className="flex gap-3 text-xs text-neutral-400 dark:text-slate-500 font-medium">
                              <span className="flex items-center gap-1 bg-neutral-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-neutral-100 dark:border-slate-700">
                                {listing.stats?.views || 0} Views
                              </span>
                              <span className="flex items-center gap-1 bg-neutral-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-neutral-100 dark:border-slate-700 capitalize">
                                {listing.type?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-neutral-200 dark:border-slate-700 border-dashed">
                      No listings found for this provider.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Stats / Actions */}
            <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-sm text-neutral-500 dark:text-slate-400">
              <span>Provider ID: {viewProvider._id}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewProvider(null);
                    setActionModal({ type: 'contact', provider: viewProvider, listingId: null });
                  }}
                  className="px-4 py-2 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Contact
                </button>
                <button
                  onClick={() => handleSuspendClick(viewProvider)}
                  className={`px-4 py-2 border font-semibold rounded-lg transition-colors ${viewProvider.status === 'suspended'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                    : 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                >
                  {viewProvider.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                </button>
                <button
                  onClick={() => { setViewProvider(null); setSelectedListing(null); }}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div >
      )
      }

      {/* Action Modal (Contact / Warn) */}
      {
        actionModal.type && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-100 dark:border-slate-800 p-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 capitalize">
                {actionModal.type === 'warn' ? 'Issue Warning' : 'Contact Provider'}
              </h3>

              <div className="space-y-4">
                {actionModal.type === 'contact' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full p-2 border border-neutral-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#FF385C] outline-none dark:bg-slate-800 dark:text-white"
                      placeholder="Subject..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">
                    {actionModal.type === 'warn' ? 'Reason for Warning' : 'Message'}
                  </label>
                  <textarea
                    value={actionModal.type === 'warn' ? actionReason : contactMessage}
                    onChange={(e) => actionModal.type === 'warn' ? setActionReason(e.target.value) : setContactMessage(e.target.value)}
                    className={`w-full p-3 border border-neutral-200 dark:border-slate-700 rounded-lg h-32 resize-none focus:ring-2 outline-none dark:bg-slate-800 dark:text-white ${actionModal.type === 'warn' ? 'focus:ring-orange-500' : 'focus:ring-[#FF385C]'}`}
                    placeholder={actionModal.type === 'warn' ? "Enter warning details..." : "Type your message..."}
                  ></textarea>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setActionModal({ type: null, provider: null, listingId: null })}
                    className="px-4 py-2 text-neutral-600 dark:text-slate-400 font-medium hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAction}
                    className={`px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105 ${actionModal.type === 'warn' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#FF385C] hover:bg-[#e02e4d]'
                      }`}
                  >
                    {actionModal.type === 'warn' ? 'Send Warning' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* Confirmation Modal for Suspend/Activate */}
      <ConfirmationModal
        isOpen={isSuspendModalOpen}
        title={userToSuspend?.status === 'suspended' ? 'Activate User' : 'Suspend User'}
        message={`Are you sure you want to ${userToSuspend?.status === 'suspended' ? 'activate' : 'suspend'} this user? ${userToSuspend?.status !== 'suspended' ? 'They will no longer be able to log in.' : 'They will regain access to their account.'}`}
        confirmText={userToSuspend?.status === 'suspended' ? 'Activate' : 'Suspend'}
        cancelText="Cancel"
        isDanger={userToSuspend?.status !== 'suspended'}
        onConfirm={confirmSuspend}
        onCancel={() => {
          setIsSuspendModalOpen(false);
          setUserToSuspend(null);
        }}
      />
    </div >
  );
}
