import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import Papa from 'papaparse';
import contractABI from '../abi/abi.json';
import {
  GraduationCap, Settings, FileSpreadsheet, UserPlus,
  Upload, CheckCircle2, XCircle, Plus, Trash2
} from 'lucide-react';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL;


const generateCertificateNo = () => {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `CERT-${rand}-${time}`;
};

const todayISO = () => new Date().toISOString().split('T')[0];

export default function IssueCertificatePage() {
  const { user } = useContext(AuthContext);

  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());
  const [dateofIssue, setDateofIssue] = useState(todayISO());
  const [autoCertNo, setAutoCertNo] = useState(true);

  const [students, setStudents] = useState([]);
  const [certLoading, setCertLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const yearOptions = Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - i).toString());


const DEGREE = {
  degrees:user.degrees,
  departments:user.departments
};

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ type: '', message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedDegree) {
      if (students.length === 0) {
        setStudents([createStudentRow()]);
      } else {
        setStudents(prev =>
          prev.map(s => ({
            ...s,
            degree: selectedDegree,
            graduationYear,
            dateofIssue,
            department: selectedDepartment
          }))
        );
      }
    } else {
      setStudents([]);
    }
  }, [selectedDegree, graduationYear, dateofIssue, selectedDepartment]);

  const createStudentRow = () => ({
    certificateNo: autoCertNo ? generateCertificateNo() : '',
    dateofIssue,
    name: '',
    enrolmentNo: '',
    graduationYear,
    degree: selectedDegree,
    department: selectedDepartment,
  });

  const handleStudentChange = (i, e) => {
    const { name, value } = e.target;
    setStudents(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [name]: value };
      return updated;
    });
  };

  const addStudent = () => setStudents(prev => [...prev, createStudentRow()]);
  const removeStudent = i => setStudents(prev => prev.filter((_, idx) => idx !== i));

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: res => {
        const parsed = res.data.map(r => ({
          certificateNo: r['Certificate No']?.trim() || (autoCertNo ? generateCertificateNo() : ''),
          dateofIssue: r['Date of Issue']?.trim() || dateofIssue,
          name: r['Student Name']?.trim() || '',
          enrolmentNo: r['Enrolment No']?.trim() || '',
          graduationYear: r['Graduation Year']?.trim() || graduationYear,
          degree: selectedDegree,
          department: selectedDepartment,
        }));

        setStudents(prev => [...prev, ...parsed]);
      },
      error: () => setToast({ type: 'error', message: '❌ Failed to parse CSV file.' }),
    });
  };

  const handleIssueCertificates = async () => {
    setShowConfirm(false);
    setCertLoading(true);

    try {
      if (!window.ethereum) throw new Error('MetaMask not detected. Please install MetaMask.');
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const certHashes = students.map(s => {
        const data = [
          s.certificateNo,
          s.dateofIssue,
          s.name,
          s.enrolmentNo,
          s.graduationYear,
          s.degree,
          s.department
        ]
          .map(v => String(v).toLowerCase())
          .join('');

        return ethers.keccak256(ethers.toUtf8Bytes(data));
      });

      const metadataList = students.map(s => JSON.stringify({ Name: s.name, issuedBy: user.name }));

      const tx = await contract.storeCertificateHashes(certHashes, metadataList);
      await tx.wait();

      const payload = students.map(s => ({ ...s, transactionHash: tx.hash }));

      const res = await fetch(`${API_URL}/institute/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ certificates: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save certificates.');

      setToast({ type: 'success', message: `✅ Successfully issued ${students.length} certificate(s).` });
      setStudents([]);
      setSelectedDegree('');
      setSelectedDepartment('');
    } catch (err) {
      setToast({ type: 'error', message: `❌ ${err.message}` });
    } finally {
      setCertLoading(false);
    }
  };

  const isFormValid = () =>
    students.length > 0 &&
    students.every(s =>
      s.name &&
      s.enrolmentNo &&
      s.degree &&
      s.department &&
      s.dateofIssue &&
      s.graduationYear &&
      s.certificateNo
    );

  return (
    <div className="bg-gray-50 rounded-xl p-5 max-w-7xl mx-auto space-y-6">

      {toast.message && (
        <div
          className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* CONFIGURATION SECTION */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-700">Degree & Certificate Configuration</h3>
        </div>

        <div className="flex flex-wrap gap-3 items-center">

          {/* Degree Dropdown */}
          <select
            value={selectedDegree}
            onChange={e => {
              setSelectedDegree(e.target.value);
              setSelectedDepartment('');
              setStudents([]);
            }}
            className="border rounded-md px-3 py-2 text-sm w-60"
          >
            <option value="">Select Degree</option>
            {DEGREE.degrees.map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>

          {/* Department Dropdown */}
          {selectedDegree && (
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm w-60"
            >
              <option value="">Select Department</option>
              {DEGREE.departments.map(dep => (
                <option key={dep}>{dep}</option>
              ))}
            </select>
          )}

          {/* Graduation year, date, cert no */}
          {selectedDepartment && (
            <>
              <select
                value={graduationYear}
                onChange={e => setGraduationYear(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-28"
              >
                {yearOptions.map(y => (
                  <option key={y}>{y}</option>
                ))}
              </select>

              <input
                type="date"
                value={dateofIssue}
                onChange={e => setDateofIssue(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-40"
              />

              <select
                value={autoCertNo ? 'yes' : 'no'}
                onChange={e => setAutoCertNo(e.target.value === 'yes')}
                className="border rounded-md px-3 py-2 text-sm w-32"
              >
                <option value="yes">Auto Cert No</option>
                <option value="no">Manual</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* STUDENT FORM SECTION */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-700">Student Certificate Form</h3>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FileSpreadsheet className="text-gray-500" />
            <label className="text-sm font-medium">Upload CSV (Optional)</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="border rounded-md px-2 py-1 text-sm w-52"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm rounded-lg">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {['Certificate No', 'Date of Issue', 'Name', 'Enrolment No', 'Graduation Year', 'Degree', 'Department', 'Action'].map(h => (
                    <th key={h} className="p-2 border-b">{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {students.map((s, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {['certificateNo', 'dateofIssue', 'name', 'enrolmentNo', 'graduationYear', 'degree', 'department'].map(field => (
                      <td key={field} className="p-2">
                        <input
                          type={field === 'dateofIssue' ? 'date' : 'text'}
                          name={field}
                          value={s[field]}
                          onChange={e => handleStudentChange(i, e)}
                          className="border rounded-md px-2 py-1 w-full text-sm"
                        />
                      </td>
                    ))}

                    <td className="p-2 text-center">
                      {students.length > 1 && (
                        <button
                          onClick={() => removeStudent(i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          <div className="mt-5 flex justify-between flex-wrap gap-3">
            <button
              onClick={addStudent}
              className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <Plus size={16} /> Add Row
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={!isFormValid() || certLoading}
              className="flex items-center gap-1 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {certLoading ? 'Issuing...' : <><CheckCircle2 size={16} /> Issue Certificates</>}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Settings className="text-blue-600" /> Confirm Issuance
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to issue {students.length} certificate(s)?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded-md text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleIssueCertificates}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}