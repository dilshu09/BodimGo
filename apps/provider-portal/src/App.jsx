import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import AddListing from "./pages/AddListing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Layout from "./components/Layout";
import Placeholder from "./pages/Placeholder";
import AgreementTemplates from "./pages/onboarding/AgreementTemplates";
import AgreementBuilder from "./pages/onboarding/AgreementBuilder";
import MyListings from "./pages/MyListings";
import ListingManagement from "./pages/ListingManagement";
import ManualAddTenant from "./pages/onboarding/ManualAddTenant";
import Setting from "./pages/Setting";
import Reviews from "./pages/Reviews";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import Invoices from "./pages/finance/Invoices";
import Reports from "./pages/finance/Reports";
import ActiveTenants from "./pages/tenants/ActiveTenants";
import TenantHistory from "./pages/tenants/TenantsHistory";
import Bookings from "./pages/inquiries/Bookings";
import AllRoom from "./pages/rooms/AllRoom";
import RoomAvailability from "./pages/rooms/RoomAvailability";
import Maintenance from "./pages/rooms/Maintenance";
import BookingAction from "./pages/BookingAction";
import BookingDetails from "./pages/BookingDetails";
import Inbox from "./pages/inquiries/Inbox";
import Viewings from "./pages/inquiries/Viewings";
import PendingApprovals from "./pages/onboarding/PendingApprovals";
import PaymentHistory from "./pages/finance/PaymentHistory";
import Support from "./pages/Support";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes (No Sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Provider Portal (With Sidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-listing" element={<AddListing />} />

            {/* Phase 1: Listings */}
            <Route path="/listings" element={<MyListings />} />
            <Route path="/listings/:id" element={<ListingManagement />} />


            {/* Phase 1: Rooms */}
            <Route path="/rooms" element={<AllRoom />} />
            <Route
              path="/rooms/availability"
              element={<RoomAvailability />}
            />

            {/* Phase 1: Inquiries */}
            <Route path="/messages" element={<Inbox />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingDetails />} />
            <Route path="/booking-action/:id" element={<BookingAction />} />
            <Route
              path="/viewings"
              element={<Viewings />}
            />

            {/* Phase 2: Onboarding */}
            <Route
              path="/approvals"
              element={<PendingApprovals />}
            />
            <Route path="/agreements" element={<AgreementTemplates />} />
            <Route path="/agreements" element={<AgreementTemplates />} />
            <Route path="/agreements/new" element={<AgreementBuilder />} />
            <Route path="/agreements/edit/:id" element={<AgreementBuilder />} />
            <Route path="/tenants/add" element={<ManualAddTenant />} />

            {/* Phase 3: Tenants & Finance */}
            <Route path="/tenants" element={<ActiveTenants />} />
            <Route path="/tenants/history" element={<TenantHistory />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/finance/invoices" element={<Invoices />} />
            <Route
              path="/finance/payments"
              element={<PaymentHistory />}
            />
            <Route path="/finance/reports" element={<Reports />} />

            <Route
              path="/rooms/maintenance"
              element={<Maintenance />}
            />
            <Route path="/room-management" element={<AllRoom />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<Setting />} />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
