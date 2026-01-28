import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShieldAlert, LogOut } from "lucide-react";
import clsx from "clsx";
import api from "../services/api";
import logo from "../assets/logo.png";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post("/auth/logout");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "User Management", path: "/users", icon: Users },
    { name: "Moderation Queue", path: "/listings", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans text-neutral-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-neutral-200 flex flex-col fixed inset-y-0 z-50">
        <div className="h-20 flex items-center px-8 border-b border-neutral-100 gap-3">
          <img src={logo} alt="Bg" className="h-8 w-auto" />
          <span className="text-primary font-bold text-xl tracking-tight">
            BodimGo Admin
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary" // Softer active state
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
                )}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-primary"
                      : "text-neutral-400 group-hover:text-neutral-600"
                  }
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors duration-200"
          >
            <LogOut size={20} />
            Sign Out
          </button>
          <div className="mt-4 px-4 text-xs text-neutral-400 font-medium">
            v1.0.2 • © BodimGo Inc.
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-800">
            {navItems.find((i) => i.path === location.pathname)?.name ||
              "Dashboard"}
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-full border border-neutral-200 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm w-64 outline-none placeholder:text-neutral-400"
              />
              <svg
                className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <button className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors group">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              <svg
                className="w-6 h-6 text-neutral-600 group-hover:text-neutral-900 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-neutral-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-neutral-900">Admin User</p>
                <p className="text-xs text-neutral-500 font-medium">
                  Super Admin
                </p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white font-bold shadow-md">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
