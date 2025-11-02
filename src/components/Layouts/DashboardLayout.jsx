import { Link, Outlet, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

const DashboardLayout = () => {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/dashboard/issue-certificate",
      label: "Issue Certificate",
      icon: <FileSignature className="w-5 h-5" />,
    },
    {
      path: "/dashboard/generate-certificate",
      label: "Generate PDF",
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-white to-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-white/70 backdrop-blur-lg border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300`}
      >
        {/* Top section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <img
              src={user.logo}
              alt={user.name || "User Logo"}
              className="mx-auto w-20 h-20 rounded-full object-cover shadow-md"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 py-3 px-4 mx-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? "bg-orange-100 text-orange-700"
                  : "hover:bg-gray-50"
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="p-4 bg-white/60 backdrop-blur-lg border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Menu size={22} />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-700">
              {user.name || "Institute"} Dashboard
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
