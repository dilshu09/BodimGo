import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex bg-neutral-50 min-h-screen font-sans text-neutral-800">
            <Sidebar />
            <div className="flex-1 overflow-x-hidden">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
