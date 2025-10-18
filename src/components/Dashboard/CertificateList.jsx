import { ExternalLink } from 'lucide-react';

const CertificateList = ({ certificates }) => {
  if (!certificates || certificates.length === 0)
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-lg font-medium">No certificates found</p>
      </div>
    );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {certificates.map((cert) => (
        <div
          key={cert._id}
          className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5"
        >
          {/* Header Section with Logo */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{cert.name}</h3>
              <p className="text-sm text-gray-500 font-medium">
                Certificate of Achievement
              </p>
            </div>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" 
              alt="Certificate Logo"
              className="w-12 h-12 object-contain opacity-90"
            />
          </div>

          {/* Certificate Details */}
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Certificate No:</span>{' '}
              {cert.certificateNo}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Degree:</span>{' '}
              {cert.degree}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Graduation Year:</span>{' '}
              {cert.graduationYear}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Date of Issue:</span>{' '}
              {new Date(cert.dateofIssue).toLocaleDateString()}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Blockchain Section */}
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium tracking-wide">
              Blockchain Record
            </p>
            <a
              href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
            >
              <ExternalLink size={16} />
              {cert.transactionHash.slice(0, 10)}...{cert.transactionHash.slice(-8)}
            </a>
            <p className="text-xs text-gray-400 mt-1 italic">
              View on Sepolia Testnet
            </p>
          </div>

          {/* Decorative Border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/30 pointer-events-none"></div>
        </div>
      ))}
    </div>
  );
};

export default CertificateList;
