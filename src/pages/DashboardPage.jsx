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
      {/* 🌈 Institute Profile Card */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 opacity-10"></div>

        <div className="p-6 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left section: Profile Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Building2 className="text-blue-600" size={22} />
                {user.name}
              </h2>
              <p className="text-gray-500 mb-3">{user.email}</p>

              <div className="space-y-1 text-gray-700 text-sm">
                <p className="flex items-center gap-2">
                  <Hash size={16} className="text-blue-500" />
                  <span>
                    <strong>Institute Code:</strong> {user.instituteCode}
                  </span>
                </p>

                <p className="flex items-center gap-2 break-all">
                  <Wallet size={16} className="text-indigo-500" />
                  <span>
                    <strong>Wallet:</strong> {user.walletAddress}
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className={`${
                      user.status === "approved"
                        ? "text-green-600"
                        : "text-yellow-500"
                    }`}
                  />
                  <span>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`${
                        user.status === "approved"
                          ? "text-green-700 font-medium"
                          : "text-yellow-700 font-medium"
                      }`}
                    >
                      {user.status}
                    </span>
                  </span>
                </p>
              </div>
            </div>

            {/* Right section: Profile Avatar */}
            <div className="flex flex-col items-center md:items-end">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {user.name?.charAt(0).toUpperCase() || "I"}
              </div>
              <p className="text-sm text-gray-500 mt-2">Institute Profile</p>
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
