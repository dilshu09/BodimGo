"use client";
import { Lock, Bell, DollarSign, Shield, X, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  // Profile Form Data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    bio: "",
    stripeAccountId: "",
    stripeOnboardingComplete: false,
    twoFactorEnabled: false
  });

  // Password Form Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: "user" },
    { id: "security", label: "Security", icon: "lock" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "payment", label: "Payment Methods", icon: "payment" },
  ];

  // Fetch Profile Data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      const data = response.data;

      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        businessName: data.businessName || "",
        bio: data.bio || "",
        stripeAccountId: data.stripeAccountId || "",
        stripeOnboardingComplete: data.stripeOnboardingComplete || false,
        twoFactorEnabled: data.twoFactorEnabled || false
      });
      setTwoFactorEnabled(data.twoFactorEnabled || false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Check for Stripe redirect
  useEffect(() => {
    const checkStripeStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('stripe') === 'return') {
        try {
          // Verify status with backend
          const res = await api.get('/payments/connect/status');
          if (res.data.onboardingComplete) {
            toast.success('Payout setup completed successfully');
            fetchProfile(); // refresh data
          } else {
            toast('Please complete the onboarding process', { icon: '⚠️' });
          }
        } catch (error) {
          console.error(error);
        }
        // Clear URL param
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    checkStripeStatus();
  }, []);

  const handleConnectStripe = async () => {
    try {
      const loadId = toast.loading("Connecting to Stripe...");
      // 1. Ensure account exists
      await api.post('/payments/connect/create-account');

      // 2. Get onboarding link
      const res = await api.post('/payments/connect/onboarding-link');

      toast.dismiss(loadId);
      // 3. Redirect
      window.location.href = res.data.url;
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate Stripe connection");
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    try {
      await api.put("/auth/profile", formData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };


  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentAction, setCurrentAction] = useState(null); // 'password' | 'enable2fa' | 'disable2fa'


  const initiatePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    // If 2FA is OFF, just update directly
    if (!twoFactorEnabled) {
      confirmPasswordChange();
      return;
    }

    // IF 2FA is ON, Request OTP
    setCurrentAction('password');
    try {
      const loadId = toast.loading("Sending Verification Code...");
      await api.post("/auth/password-otp", { currentPassword: passwordData.currentPassword });
      toast.dismiss(loadId);
      toast.success("Verification code sent to your email");
      setShowOtpModal(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send code");
    }
  };

  const handleToggle2FA = async (enable) => {
    // Logic for Enable/Disable 2FA
    setCurrentAction(enable ? 'enable2fa' : 'disable2fa');
    try {
      const loadId = toast.loading("Sending Verification Code...");
      await api.post("/auth/2fa-otp");
      toast.dismiss(loadId);
      toast.success("Verification code sent to your email");
      setShowOtpModal(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send code");
    }
  };

  const confirmAction = async () => {
    if (!otp && twoFactorEnabled && currentAction === 'password') {
      toast.error("Please enter the verification code");
      return;
    }
    if (!otp && (currentAction === 'enable2fa' || currentAction === 'disable2fa')) {
      toast.error("Please enter the verification code");
      return;
    }

    setVerifying(true);
    try {
      if (currentAction === 'password') {
        await api.put("/auth/password", {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          otp: twoFactorEnabled ? otp : undefined
        });
        toast.success("Password updated successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else if (currentAction === 'enable2fa' || currentAction === 'disable2fa') {
        const enabled = currentAction === 'enable2fa';
        const res = await api.post("/auth/2fa-toggle", { otp, enabled });
        setTwoFactorEnabled(res.data.twoFactorEnabled);
        toast.success(res.data.message);
      }

      setShowOtpModal(false);
      setOtp("");
      setCurrentAction(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to process request");
    } finally {
      setVerifying(false);
    }
  };

  // Alias for backward compat if any, but mainly used in onClick
  const updatePassword = initiatePasswordChange;
  // const confirmPasswordChange = confirmAction; // Refactored to unified confirm

  // Temporary function to allow direct call when 2FA is off
  const confirmPasswordChange = confirmAction;

  if (loading) return <div className="p-12 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
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
            className={`p-4 rounded-lg border-2 transition-all text-left ${activeTab === tab.id
              ? "border-primary bg-primary/10"
              : "border-slate-200 hover:border-slate-300"
              }`}
          >
            <p
              className={`font-semibold ${activeTab === tab.id ? "text-primary" : "text-slate-900"}`}
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
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Boarding Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Business Name"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Address / Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Your Address"
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
              ></textarea>
            </div>
            <button
              onClick={saveProfile}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-primary" />
                Change Password
              </h3>
              <div className="space-y-4">
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New Password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <button
                  onClick={updatePassword}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Update Password
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                Two-Factor Authentication
              </h3>
              <p className="text-slate-600 mb-4">
                Add an extra layer of security to your account
              </p>
              {twoFactorEnabled ? (
                <div className="flex items-center gap-4">
                  <span className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                    <CheckCircle size={18} /> Enabled
                  </span>
                  <button
                    onClick={() => handleToggle2FA(false)}
                    className="px-6 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleToggle2FA(true)}
                  className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium"
                >
                  Enable 2FA
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell size={20} className="text-primary" />
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
                      className="w-4 h-4 text-primary rounded"
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
                <DollarSign size={20} className="text-primary" />
                Payout Settings (Stripe)
              </h3>

              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center">
                {formData.stripeOnboardingComplete ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-lg">
                      <CheckCircle size={24} /> Payouts Active
                    </div>
                    <p className="text-slate-600">Your Stripe account is connected and ready to receive payouts.</p>
                    <button
                      onClick={handleConnectStripe}
                      className="px-6 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Update Payout Details on Stripe
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-600 mb-4">
                      BodimGo processes payments securely via Stripe. Connect your account to receive payouts directly to your bank.
                    </p>
                    <button
                      onClick={handleConnectStripe}
                      className="px-6 py-3 bg-[#635BFF] text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                      Setup Payouts
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 2FA OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                <Shield size={20} className="text-primary" /> Security Verification
              </h3>
              <button onClick={() => setShowOtpModal(false)} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-neutral-600 mb-6 text-sm">
                {currentAction === 'password' && "For your security, we have sent a verification code to your email. Please enter it below to confirm your password change."}
                {currentAction === 'enable2fa' && "To enable Two-Factor Authentication, please enter the verification code sent to your email."}
                {currentAction === 'disable2fa' && "To disable Two-Factor Authentication, please confirm your identity by entering the code sent to your email."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-neutral-700">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full input-field text-center text-2xl tracking-widest font-mono py-3"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button
                  onClick={confirmAction}
                  disabled={verifying}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {verifying ? "Verifying..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
