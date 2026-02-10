import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Wishlist from './pages/Wishlist';
import MyBookings from './pages/MyBookings';
import MyViewings from './pages/MyViewings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<MyBookings />} />
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
