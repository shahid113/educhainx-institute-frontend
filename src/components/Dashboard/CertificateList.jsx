import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const CertificateList = ({ certificates }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const certificatesPerPage = 10;

  useEffect(() => {
    // Filter certificates based on search term
    let filtered = certificates || [];
    if (searchTerm) {
      filtered = filtered.filter(cert => 
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.graduationYear.toString().includes(searchTerm)
      );
    }
    setFilteredCertificates(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [certificates, searchTerm]);

  // Calculate pagination
  const indexOfLastCertificate = currentPage * certificatesPerPage;
  const indexOfFirstCertificate = indexOfLastCertificate - certificatesPerPage;
  const currentCertificates = filteredCertificates.slice(indexOfFirstCertificate, indexOfLastCertificate);
  const totalPages = Math.ceil(filteredCertificates.length / certificatesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-lg font-medium">No certificates found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstCertificate + 1}-{Math.min(indexOfLastCertificate, filteredCertificates.length)} of {filteredCertificates.length} certificates
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Certificate No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Degree
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Graduation Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Blockchain
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCertificates.length > 0 ? (
              currentCertificates.map((cert) => (
                <tr key={cert._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cert.certificateNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cert.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cert.degree}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cert.graduationYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cert.dateofIssue).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                    >
                      <ExternalLink size={14} />
                      <span className="truncate max-w-[100px]">{cert.transactionHash.slice(0, 10)}...{cert.transactionHash.slice(-4)}</span>
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No certificates found matching your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateList;