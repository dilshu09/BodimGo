import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // In a real app, you might want to decode the token to check expiration or role
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
