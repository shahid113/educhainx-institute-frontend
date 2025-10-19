import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ethers } from 'ethers';
import contractABI from '../../abi/abi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL;

const IssueCertificatePage = () => {
  const { user } = useContext(AuthContext);

  // Store multiple students
  const [students, setStudents] = useState([
    { certificateNo: '', dateofIssue: '', name: '', enrolmentNo: '', graduationYear: '', degree: '' }
  ]);

  const [certLoading, setCertLoading] = useState(false);
  const [error, setError] = useState('');
  const [certResponse, setCertResponse] = useState(null);

  useEffect(() => {
    let timer;
    if (error || certResponse) {
      timer = setTimeout(() => {
        setError('');
        setCertResponse(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [error, certResponse]);

  // Handle input change for a specific student
  const handleStudentChange = (index, e) => {
    const newStudents = [...students];
    newStudents[index][e.target.name] = e.target.value;
    setStudents(newStudents);
  };

  // Add new student row
  const addStudent = () => {
    setStudents([...students, { certificateNo: '', dateofIssue: '', name: '', enrolmentNo: '', graduationYear: '', degree: '' }]);
  };

  // Remove student row
  const removeStudent = (index) => {
    const newStudents = students.filter((_, i) => i !== index);
    setStudents(newStudents);
  };

  const handleIssueCertificates = async (e) => {
  e.preventDefault();
  setCertLoading(true);
  setError('');
  setCertResponse(null);

  try {
    if (!window.ethereum) throw new Error('MetaMask not found.');

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    // --- Map students to certHashes & metadataList ---
    const certHashes = students.map(student =>
      ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(student)))
    );

    const metadataList = students.map(() =>
      JSON.stringify({
        issuedBy: user.name,
        instituteCode: user.instituteCode,
        instituteEmail: user.email
      })
    );

    // --- Bulk transaction ---
    const tx = await contract.storeCertificateHashes(certHashes, metadataList);
    await tx.wait(); // wait for blockchain confirmation

    console.log('Blockchain transaction confirmed:', tx);

    // --- Call backend API after blockchain confirmation ---
    const payload = students.map(student => ({
      ...student,
      transactionHash: tx.hash
    }));

    console.log(payload)

    const res = await fetch(`${API_URL}/institute/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:JSON.stringify({ certificates: payload }) 
      });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save certificates in DB.');

    setCertResponse({
      txHash: tx.hash,
      message: `Successfully issued ${students.length} certificate(s) and saved to DB.`
    });

    // Reset form
    setStudents([{ certificateNo: '', dateofIssue: '', name: '', enrolmentNo: '', graduationYear: '', degree: '' }]);

  } catch (err) {
    console.error('Bulk issue error:', err);
    let friendlyMessage = 'Transaction failed. Please try again.';
    if (err.reason?.includes('certificate already issued') || err.message?.includes('certificate already issued')) {
      friendlyMessage = '❗ One or more certificates already exist on blockchain.';
    } else if (err.message?.includes('user rejected transaction')) {
      friendlyMessage = 'You cancelled the transaction in MetaMask.';
    } else if (err.message?.includes('insufficient funds')) {
      friendlyMessage = 'Insufficient ETH for gas fees.';
    }
    setError(friendlyMessage);
  } finally {
    setCertLoading(false);
  }
};


  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      <h2 className="text-2xl font-semibold mb-4">Issue Certificates</h2>

      {error && (
        <div className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md cursor-pointer" onClick={() => setError('')}>
          <p>{error}</p>
        </div>
      )}

      {certResponse && (
        <div className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-md cursor-pointer" onClick={() => setCertResponse(null)}>
          <p><strong>{certResponse.message}</strong></p>
          <p className="text-sm">Tx Hash: {certResponse.txHash?.slice(0, 15)}...</p>
        </div>
      )}

      <form onSubmit={handleIssueCertificates} className="space-y-4 mt-6">
        {students.map((student, index) => (
          <div key={index} className="border p-4 rounded relative">
            {students.length > 1 && (
              <button type="button" onClick={() => removeStudent(index)} className="absolute top-2 right-2 text-red-500 font-bold text-lg">&times;</button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="certificateNo" placeholder="Certificate No" value={student.certificateNo} onChange={e => handleStudentChange(index, e)} required className="w-full p-2 border rounded" />
              <input type="date" name="dateofIssue" placeholder="Date of Issue" value={student.dateofIssue} onChange={e => handleStudentChange(index, e)} required className="w-full p-2 border rounded" />
              <input type="text" name="name" placeholder="Student Name" value={student.name} onChange={e => handleStudentChange(index, e)} required className="w-full p-2 border rounded" />
              <input type="text" name="enrolmentNo" placeholder="Enrolment No" value={student.enrolmentNo} onChange={e => handleStudentChange(index, e)} required className="w-full p-2 border rounded" />
              <input type="text" name="graduationYear" placeholder="Graduation Year" value={student.graduationYear} onChange={e => handleStudentChange(index, e)} required className="w-full p-2 border rounded" />
              <input type="text" name="degree" placeholder="Degree" value={student.degree} onChange={e => handleStudentChange(index, e)} required className="w-full p-2 border rounded" />
            </div>
          </div>
        ))}

        <button type="button" onClick={addStudent} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <span className="text-xl font-bold">+</span> Add Student
        </button>

        <button type="submit" disabled={certLoading} className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {certLoading ? 'Issuing...' : 'Issue Certificates'}
        </button>
      </form>
    </div>
  );
};

export default IssueCertificatePage;
