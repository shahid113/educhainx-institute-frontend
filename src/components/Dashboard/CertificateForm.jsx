import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ethers } from 'ethers';
import contractABI from '../../abi/abi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL;

const IssueCertificatePage = () => {
  const { user } = useContext(AuthContext);

  const [certForm, setCertForm] = useState({
    certificateNo: '',
    dateofIssue: '',
    name: '',
    enrolmentNo: '',
    graduationYear: '',
    degree: ''
  });

  const [certLoading, setCertLoading] = useState(false);
  const [error, setError] = useState('');
  const [certResponse, setCertResponse] = useState(null);

  // 🕒 Auto-hide notifications after 5 seconds
  useEffect(() => {
    let timer;
    if (error || certResponse) {
      timer = setTimeout(() => {
        setError('');
        setCertResponse(null);
      }, 5000); // 5 seconds
    }
    return () => clearTimeout(timer);
  }, [error, certResponse]);

  const handleChange = (e) => {
    setCertForm({ ...certForm, [e.target.name]: e.target.value });
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setCertLoading(true);
    setError('');
    setCertResponse(null);

    try {
      if (!window.ethereum) throw new Error('MetaMask not found. Please install it.');

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const certData = {
        certificateNo: certForm.certificateNo.trim(),
        name: certForm.name.trim(),
        enrolmentNo: certForm.enrolmentNo.trim(),
        graduationYear: certForm.graduationYear.trim(),
        degree: certForm.degree.trim(),
      };

      const instituteData = {
        issuedBy: user.name,
        instituteCode: user.instituteCode,
        instituteEmail: user.email
      };

      const certHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(certData)));
      const metadata = JSON.stringify(instituteData);

      const tx = await contract.storeCertificateHash(certHash, metadata);
      await tx.wait();

      const payload = { ...certForm, transactionHash: tx.hash };
      const res = await fetch(`${API_URL}/institute/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save certificate in backend.');

      const result = await res.json();

      setCertResponse({
        txHash: tx.hash,
        certHash,
        backendMessage: result.message || 'Certificate recorded successfully.'
      });

      setCertForm({
        certificateNo: '',
        dateofIssue: '',
        name: '',
        enrolmentNo: '',
        graduationYear: '',
        degree: ''
      });

    } catch (err) {
      console.error('Issue certificate error:', err);

      let friendlyMessage = 'Transaction failed. Please try again.';

      if (err.reason?.includes('certificate already issued') || err.message?.includes('certificate already issued')) {
        friendlyMessage = '❗ This certificate has already been issued on the blockchain.';
      } else if (err.message?.includes('user rejected transaction')) {
        friendlyMessage = 'You cancelled the transaction in MetaMask.';
      } else if (err.message?.includes('insufficient funds')) {
        friendlyMessage = 'Insufficient ETH in your wallet to pay gas fees.';
      } else if (err.message?.includes('MetaMask not found')) {
        friendlyMessage = 'Please install MetaMask to continue.';
      }

      setError(friendlyMessage);
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto relative">
      <h2 className="text-2xl font-semibold mb-4">Issue Certificate</h2>

      {/* 🔔 Notification (auto disappears) */}
      {error && (
        <div
          className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md cursor-pointer transition-opacity duration-500"
          onClick={() => setError('')}
        >
          <p>{error}</p>
          <p className="text-sm text-red-500 italic">This message will disappear in 5 seconds.</p>
        </div>
      )}

      {certResponse && (
        <div
          className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-md cursor-pointer transition-opacity duration-500"
          onClick={() => setCertResponse(null)}
        >
          <p><strong>Certificate issued successfully!</strong></p>
          <p className="text-sm">Tx Hash: {certResponse.txHash.slice(0, 15)}...</p>
          <p className="text-sm text-green-600 italic">This message will disappear in 5 seconds.</p>
        </div>
      )}

      <form onSubmit={handleIssueCertificate} className="space-y-4 mt-6">
        <input
          type="text"
          name="certificateNo"
          placeholder="Certificate No"
          value={certForm.certificateNo}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          name="dateofIssue"
          placeholder="Date of Issue"
          value={certForm.dateofIssue}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="name"
          placeholder="Student Name"
          value={certForm.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="enrolmentNo"
          placeholder="Enrolment No"
          value={certForm.enrolmentNo}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="graduationYear"
          placeholder="Graduation Year"
          value={certForm.graduationYear}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="degree"
          placeholder="Degree"
          value={certForm.degree}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          disabled={certLoading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {certLoading ? 'Issuing...' : 'Issue Certificate'}
        </button>
      </form>
    </div>
  );
};

export default IssueCertificatePage;
