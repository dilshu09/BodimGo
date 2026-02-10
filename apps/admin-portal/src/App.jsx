import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import AdminUserManagement from "./pages/AdminUserManagement";
import ProtectedRoute from "./components/ProtectedRoute";

import ModerationQueue from "./pages/ModerationQueue";
import AdminInbox from "./pages/AdminInbox";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="listings" element={<ModerationQueue />} />
            <Route path="messages" element={<AdminInbox />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
