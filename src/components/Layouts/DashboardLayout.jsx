import { Link, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

const DashboardLayout = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const { user } = useContext(AuthContext);

  console.log("User in DashboardLayout:", user);

  return (
    <div className="flex h-screen bg-gradient-to-br from-white to-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white/60 backdrop-blur-lg border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 text-center font-bold text-xl text-orange-600 tracking-wide">
          Dashboard
        </div>
        <nav className="flex-1">
          <Link
            to="/dashboard"
            className={`block py-3 px-6 text-sm font-medium transition ${
              location.pathname === "/dashboard"
                ? "bg-orange-100 text-orange-700"
                : "hover:bg-gray-50"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard/issue-certificate"
            className={`block py-3 px-6 text-sm font-medium transition ${
              location.pathname === "/dashboard/issue-certificate"
                ? "bg-orange-100 text-orange-700"
                : "hover:bg-gray-50"
            }`}
          >
            Issue Certificate
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="p-4 bg-white/60 backdrop-blur-lg border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-700">{user.name|| "Institute"} Dashboard</h1>
        </header>

        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
