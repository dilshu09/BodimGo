import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    return (
        <div className="flex bg-neutral-50 dark:bg-slate-950 min-h-screen font-sans text-neutral-800 dark:text-slate-200 transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 overflow-x-hidden flex flex-col">
                <Header />
                <div className="p-5 flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
