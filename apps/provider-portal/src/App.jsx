import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import AddListing from './pages/AddListing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import Placeholder from './pages/Placeholder';
import AgreementTemplates from './pages/onboarding/AgreementTemplates';
import AgreementBuilder from './pages/onboarding/AgreementBuilder';
import MyListings from './pages/MyListings';
import ListingManagement from './pages/ListingManagement';
import ManualAddTenant from './pages/onboarding/ManualAddTenant';

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
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-listing" element={<AddListing />} />

          {/* Phase 1: Listings */}
          <Route path="/listings" element={<MyListings />} />
          <Route path="/listings/:id" element={<ListingManagement />} />
          <Route path="/listings/media" element={<Placeholder title="Media Manager" />} />

          {/* Phase 1: Rooms */}
          <Route path="/rooms" element={<Placeholder title="Room Management" />} />
          <Route path="/rooms/availability" element={<Placeholder title="Availability Calendar" />} />

          {/* Phase 1: Inquiries */}
          <Route path="/messages" element={<Placeholder title="Inbox" />} />
          <Route path="/bookings" element={<Placeholder title="Booking Requests" />} />
          <Route path="/viewings" element={<Placeholder title="Viewing Schedule" />} />

          {/* Phase 2: Onboarding */}
          <Route path="/approvals" element={<Placeholder title="Pending Approvals" />} />
          <Route path="/agreements" element={<AgreementTemplates />} />
          <Route path="/agreements" element={<AgreementTemplates />} />
          <Route path="/agreements/new" element={<AgreementBuilder />} />
          <Route path="/agreements/edit/:id" element={<AgreementBuilder />} />
          <Route path="/tenants/add" element={<ManualAddTenant />} />

          {/* Phase 3: Tenants & Finance */}
          <Route path="/tenants" element={<Placeholder title="Active Tenants" />} />
          <Route path="/finance" element={<Placeholder title="Finance Dashboard" />} />
          <Route path="/finance/invoices" element={<Placeholder title="Invoice Management" />} />
          <Route path="/finance/payments" element={<Placeholder title="Payment History" />} />
          <Route path="/finance/reports" element={<Placeholder title="Financial Reports" />} />

          <Route path="/maintenance" element={<Placeholder title="Maintenance Tickets" />} />
          <Route path="/reviews" element={<Placeholder title="Reviews & Reputation" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
