import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Wishlist from './pages/Wishlist';
import MyBookings from './pages/MyBookings';
import MyBoarding from './pages/MyBoarding';
import MyViewings from './pages/MyViewings';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/my-boarding" element={<MyBoarding />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/viewings" element={<MyViewings />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/checkout/:bookingId" element={<Checkout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
