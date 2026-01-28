import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import AdminUserManagement from "./pages/AdminUserManagement";
import ModerationQueue from "./pages/ModerationQueue";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="listings" element={<ModerationQueue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
