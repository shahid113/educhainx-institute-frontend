import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import CertificateList from "../components/Dashboard/CertificateList";
import axios from "axios";
import { Building2, Wallet, Hash, CheckCircle2 } from "lucide-react";

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);

  const fetchCertificates = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/institute/fetch-certificates`,
        { withCredentials: true }
      );
      setCertificates(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-8">
       {/* Institute Profile Card - Premium Design */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-500/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/20 to-purple-400/20 rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="p-8 md:p-10 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                    {user.name?.charAt(0).toUpperCase() || "I"}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {user.name}
                  </h2>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    Institute Code: {user.instituteCode}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                  <p className="text-sm font-medium text-gray-600">Wallet Address</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{user.walletAddress}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.status === "approved" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* 📜 Certificates List */}
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Certificates Issued
        </h2>
        <CertificateList certificates={certificates} />
      </div>
    </div>
  );
};

export default DashboardPage;
