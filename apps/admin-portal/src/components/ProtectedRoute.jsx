import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // In a real app, you might want to decode the token to check expiration or role
    // For now, simple existence check is enough to redirect unauthenticated users
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
