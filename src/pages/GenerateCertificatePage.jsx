import { useEffect, useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import axios from 'axios';
import JSZip from 'jszip';
import { ArrowUpDown, Eye, FileDown } from 'lucide-react';

const GenerateCertificatePage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState([]);
  const [viewCert, setViewCert] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const fetchCertificates = async () => {
      setFetching(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/institute/fetch-certificates`,
          { withCredentials: true }
        );
        setCertificates(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch certificates:', err);
        alert('Failed to load certificates.');
      } finally {
        setFetching(false);
      }
    };
    fetchCertificates();
  }, []);

  const toBase64 = async (url) => {
    try {
      const res = await axios.get(url, { responseType: 'blob' });
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(res.data);
      });
    } catch {
      return null;
    }
  };

  const generatePDF = async (cert) => {
  const pdf = new jsPDF('landscape', 'pt', 'a4');
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  const margin = 90;

  // Helper: Format date DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '________';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // === 1. Background (optional light pattern) ===
  for (let i = 0; i < h; i += 2) {
    const color = i < h / 2 ? 250 : 248;
    pdf.setFillColor(color, color, 252);
    pdf.rect(0, i, w, 2, 'F');
  }

  // Decorative diagonal lines
  pdf.setDrawColor(230, 230, 255);
  pdf.setLineWidth(0.3);
  for (let i = -150; i < w + 150; i += 50) {
    pdf.line(i, 0, i + h, h);
    pdf.line(i - h, 0, i, h);
  }

  // === 2. Double Border ===
  pdf.setDrawColor(180, 140, 60);
  pdf.setLineWidth(10);
  pdf.rect(15, 15, w - 30, h - 30);

  pdf.setDrawColor(100, 100, 150);
  pdf.setLineWidth(2);
  pdf.rect(35, 35, w - 70, h - 70);

  // === 3. Top Layout: Certificate ID (Top-left), Date of Issue (Top-right), Logo (Top-center) ===

  // Certificate ID - Top-left
  pdf.setFont('helvetica', 'normal').setFontSize(12).setTextColor(80, 80, 80);
  pdf.text(`Certificate ID: ${cert.certificateNo || 'N/A'}`, margin, 50);

  // Date of Issue - Top-right
  pdf.text(`Date of Issue: ${formatDate(cert.dateofIssue)}`, w - margin, 50, { align: 'right' });

  // Logo - Top-center
  const logo = cert.instituteId?.logo ? await toBase64(cert.instituteId.logo) : null;
  if (logo) {
    pdf.addImage(logo, 'PNG', w / 2 - 60, 70, 120, 120);
  }

  // Institute Name - Below Logo
  pdf.setFont('times', 'italic').setFontSize(26).setTextColor(70, 70, 110);
  pdf.text(cert.instituteId?.name || 'Institute Name', w / 2, 210, { align: 'center' });

  // Title: Pass Certificate
  pdf.setFont('helvetica', 'bold').setFontSize(38).setTextColor(40, 40, 90);
  pdf.text('Pass Certificate', w / 2, 250, { align: 'center' });

  // Underline below title
  pdf.setDrawColor(180, 140, 60);
  pdf.setLineWidth(2);
  pdf.line(w / 2 - 160, 260, w / 2 + 160, 260);

  // === 4. Certificate Body Text ===
  const bodyX = w / 2;
  let bodyY = 310;

  pdf.setFont('helvetica', 'normal').setFontSize(20).setTextColor(50, 50, 70);
  pdf.text('This is to certify that', bodyX, bodyY, { align: 'center' });
  bodyY += 35;

  // Student Name
  pdf.setFont('helvetica', 'bold').setFontSize(32).setTextColor(30, 30, 80);
  pdf.text(cert.name || 'Student Name', bodyX, bodyY, { align: 'center' });
  bodyY += 30;

  // Enrollment No
  pdf.setFont('helvetica', 'normal').setFontSize(18).setTextColor(60, 60, 70);
  pdf.text(`Enrollment No: ${cert.enrolmentNo || 'N/A'}`, bodyX, bodyY, { align: 'center' });
  bodyY += 30;

  // Examined in [Year] and qualified for [Degree]
  const line1 = `having been examined in ${cert.graduationYear || '____'} and found qualified for the`;
  const line2 = `${cert.degree || 'Degree Name'} in ${cert.department}.`;

  pdf.text(line1, bodyX, bodyY, { align: 'center' });
  bodyY += 25;
  pdf.text(line2, bodyX, bodyY, { align: 'center' });

  // === 5. Bottom Section: QR Code (Center), Signatures (Left/Right) ===

  const bottomY = h - 140;
  const qrSize = 80;
  const qrX = w / 2 - qrSize / 2;
  const qrY = bottomY;

  // QR Code Background (white with border)
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(180, 180, 200);
  pdf.rect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 'FD');

  // Generate QR Code
  const txUrl = `https://sepolia.etherscan.io/tx/${cert.transactionHash}`;
  const qrDataUrl = await QRCode.toDataURL(txUrl, { width: 120, margin: 1 });
  pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // Left: Place & Date
  pdf.setFont('helvetica', 'normal').setFontSize(12).setTextColor(80, 80, 80);
  const leftX =70;
  pdf.text('Place: ________', leftX, h - 80);
  pdf.text('Date: ________', leftX, h - 60);

  // Right: Registrar Signature
  const rightX = w - margin - 100;
  pdf.text('____________________', rightX, h - 80);
  pdf.setFont('helvetica', 'italic').setFontSize(11);
  pdf.text('Authorized Signature', rightX + 10, h - 65);
  pdf.setFont('helvetica', 'normal').setFontSize(12);
  pdf.text('Registrar', rightX + 40, h - 45);

  return pdf;
};

  const generateSinglePDF = async (cert) => {
    setLoading(true);
    try {
      const pdf = await generatePDF(cert);
      pdf.save(`${cert.name || 'certificate'}_${cert.certificateNo || 'unknown'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateBulkPDF = async () => {
    if (selected.length === 0) return alert('Select at least one certificate.');
    setLoading(true);
    const zip = new JSZip();
    try {
      for (const id of selected) {
        const cert = certificates.find((c) => c._id === id);
        if (!cert) continue;
        const pdf = await generatePDF(cert);
        const blob = pdf.output('blob');
        zip.file(`${cert.name || 'certificate'}_${cert.certificateNo || 'unknown'}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'Certificates_Bulk.zip');
    } catch (err) {
      console.error('Bulk PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () =>
    setSelected(selected.length === certificates.length ? [] : certificates.map((c) => c._id));

  // 🔹 Search + Sort
  const filtered = useMemo(() => {
    let data = certificates.filter(
      (c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.degree?.toLowerCase().includes(search.toLowerCase()) ||
        c.certificateNo?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
        const bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [certificates, search, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold">Certificate Management</h1>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search certificates..."
            className="border rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={generateBulkPDF}
            disabled={loading || fetching || selected.length === 0}
            className={`px-5 py-2 rounded-lg text-white ${loading || fetching ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {loading ? 'Generating...' : 'Bulk ZIP'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.length === certificates.length && certificates.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              {['name', 'degree', 'graduationYear', 'certificateNo'].map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center justify-between">
                    {key === 'graduationYear' ? 'Year' : key.charAt(0).toUpperCase() + key.slice(1)}
                    <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {fetching ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  No certificates found
                </td>
              </tr>
            ) : (
              filtered.map((cert) => (
                <tr key={cert._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(cert._id)}
                      onChange={() => toggleSelect(cert._id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{cert.name}</td>
                  <td className="px-4 py-3">{cert.degree}</td>
                  <td className="px-4 py-3">{cert.graduationYear || 'N/A'}</td>
                  <td className="px-4 py-3">{cert.certificateNo}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setViewCert(cert)}
                      className="px-2 py-1 border rounded hover:bg-gray-100 mr-2"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => generateSinglePDF(cert)}
                      disabled={loading}
                      className={`px-2 py-1 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      <FileDown size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] md:w-[70%] lg:w-[50%] p-6 relative">
            <button
              onClick={() => setViewCert(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold text-center mb-4">Certificate Preview</h2>
            <div className="border rounded-lg shadow-sm p-6 text-center">
              <h1 className="text-2xl font-bold">Certificate of Completion</h1>
              <p className="mt-2 text-gray-600">
                Awarded by {viewCert.instituteId?.name || 'Unknown Institute'}
              </p>
              <h2 className="mt-6 text-xl font-semibold">{viewCert.name}</h2>
              <p className="mt-3">
                For successfully completing <b>{viewCert.degree}</b>
              </p>
              <p className="mt-3 text-sm text-gray-500">
                ID: {viewCert.certificateNo} | Year: {viewCert.graduationYear || 'N/A'}
              </p>
              <div className="mt-6 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://sepolia.etherscan.io/tx/${viewCert.transactionHash}`}
                  alt="QR"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateCertificatePage;
