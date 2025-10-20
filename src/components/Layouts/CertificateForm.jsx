import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ethers } from 'ethers';
import Papa from 'papaparse';
import contractABI from '../../abi/abi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL;

const IssueCertificatePage = () => {
  const { user } = useContext(AuthContext);

  const [students, setStudents] = useState([
    { certificateNo: '', dateofIssue: '', name: '', enrolmentNo: '', graduationYear: '', degree: '' }
  ]);

  const [certLoading, setCertLoading] = useState(false);
  const [error, setError] = useState('');
  const [certResponse, setCertResponse] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  // Validate and format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const parts = dateString.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (parts) {
        const [_, day, month, year] = parts;
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        if (new Date(formattedDate).getTime()) return formattedDate;
      }
      return '';
    }
    return date.toISOString().split('T')[0];
  };

  // Handle CSV upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedStudents = results.data.map((row) => {
            const dateofIssue = formatDate(row['Date of Issue']);
            if (!dateofIssue && row['Date of Issue']) {
              setError('Invalid date format in CSV for one or more rows. Expected YYYY-MM-DD.');
              return null;
            }
            return {
              certificateNo: row['Certificate No']?.trim() || '',
              dateofIssue,
              name: row['Student Name']?.trim() || '',
              enrolmentNo: row['Enrolment No']?.trim() || '',
              graduationYear: row['Graduation Year']?.trim() || '',
              degree: row['Degree']?.trim() || '',
            };
          }).filter(s => s && Object.values(s).some(v => v));

          if (parsedStudents.length === 0) {
            setError('No valid data found in CSV. Ensure correct headers and data.');
            return;
          }

          setStudents([...students, ...parsedStudents]);
        },
        error: (err) => {
          setError('Failed to parse CSV file. Please ensure it has the correct headers.');
        },
      });
    }
  };

  const handleIssueCertificates = async () => {
    setShowConfirm(false);
    setCertLoading(true);
    setError('');
    setCertResponse(null);

    try {
      if (!window.ethereum) throw new Error('MetaMask not found.');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      // Optimized hash generation using specific fields
      const certHashes = students.map(student => {
        const { certificateNo, dateofIssue, name, enrolmentNo, graduationYear, degree } = student;
        const concatenatedData = [
          certificateNo,
          dateofIssue,
          name,
          enrolmentNo,
          graduationYear,
          degree
        ].map(value => String(value).toLowerCase()).join('');
        return ethers.keccak256(ethers.toUtf8Bytes(concatenatedData));
      });

      const metadataList = students.map((student) =>
        JSON.stringify({
          Name: student.name,
          issuedBy: user.name,
        })
      );

      const tx = await contract.storeCertificateHashes(certHashes, metadataList);
      await tx.wait();

      console.log('Blockchain transaction confirmed:', tx);

      const payload = students.map(student => ({
        ...student,
        transactionHash: tx.hash
      }));

      console.log(payload);

      const res = await fetch(`${API_URL}/institute/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ certificates: payload })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save certificates in DB.');

      setCertResponse({
        txHash: tx.hash,
        message: `Successfully issued ${students.length} certificate(s) and saved to DB.`
      });

      setStudents([{ certificateNo: '', dateofIssue: '', name: '', enrolmentNo: '', graduationYear: '', degree: '' }]);
    } catch (err) {
      console.error('Bulk issue error:', err);
      let friendlyMessage = err.reason || err.message || 'An error occurred during the transaction.';
      if (err.message?.includes('user rejected transaction')) {
        friendlyMessage = 'You cancelled the transaction in MetaMask.';
      } else if (err.message?.includes('insufficient funds')) {
        friendlyMessage = 'Insufficient ETH for gas fees.';
      } else if (err.message?.includes('MetaMask not found')) {
        friendlyMessage = 'MetaMask not found.';
      }
      setError(friendlyMessage);
    } finally {
      setCertLoading(false);
    }
  };

  const isFormValid = () => {
    return students.every(student =>
      student.certificateNo && student.dateofIssue && student.name && student.enrolmentNo && student.graduationYear && student.degree
    );
  };

  return (
    <div className="p-6 mx-auto relative bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Issue Certificates On Chain</h2>

      {error && (
        <div className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md cursor-pointer z-50" onClick={() => setError('')}>
          <p>{error}</p>
        </div>
      )}

      {certResponse && (
        <div className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-md cursor-pointer z-50" onClick={() => setCertResponse(null)}>
          <p><strong>{certResponse.message}</strong></p>
          <p className="text-sm">Tx Hash: {certResponse.txHash?.slice(0, 15)}...</p>
        </div>
      )}

      {/* CSV Upload and Download Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV for Bulk Import</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">CSV Headers: Certificate No, Date of Issue (YYYY-MM-DD), Student Name, Enrolment No, Graduation Year, Degree</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
              <th className="p-3">Certificate No</th>
              <th className="p-3">Date of Issue</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Enrolment No</th>
              <th className="p-3">Graduation Year</th>
              <th className="p-3">Degree</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index} className="border-t">
                <td className="p-3">
                  <input
                    type="text"
                    name="certificateNo"
                    placeholder="Certificate No"
                    value={student.certificateNo}
                    onChange={e => handleStudentChange(index, e)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="date"
                    name="dateofIssue"
                    value={student.dateofIssue}
                    onChange={e => handleStudentChange(index, e)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Student Name"
                    value={student.name}
                    onChange={e => handleStudentChange(index, e)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    name="enrolmentNo"
                    placeholder="Enrolment No"
                    value={student.enrolmentNo}
                    onChange={e => handleStudentChange(index, e)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    name="graduationYear"
                    placeholder="Graduation Year"
                    value={student.graduationYear}
                    onChange={e => handleStudentChange(index, e)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    name="degree"
                    placeholder="Degree"
                    value={student.degree}
                    onChange={e => handleStudentChange(index, e)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudent(index)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={addStudent}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
        >
          <span className="text-xl font-bold">+</span> Add Row
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={certLoading || !isFormValid() || students.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {certLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Issuing...
            </>
          ) : (
            'Issue Certificates'
          )}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Issuance</h3>
            <p className="mb-4">Are you sure you want to issue {students.length} certificate(s)? This action will involve a blockchain transaction.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueCertificates}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueCertificatePage;