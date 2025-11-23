import { useState, useRef, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  CheckCircle, Shield, Menu, X,
  Upload, Camera, FileText, Loader2, Copy, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PROMPT from '../utils/prompt';

export default function HomePage() {
  // --- State ---
  const [form, setForm] = useState({
    certificateNo: '',
    dateofIssue: '',
    name: '',
    enrolmentNo: '',
    graduationYear: '',
    degree: '',
    department: ''
  });

  const [showManualForm, setShowManualForm] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const verifyRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();

  // --- Gemini Setup ---
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const GEMINI_PROMPT = PROMPT;

  // --- Helpers ---
  const handleNavigateToLogin = () => navigate('/login');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const scrollToVerify = () => {
    verifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetForm = () => {
    setForm({
      certificateNo: '', dateofIssue: '', name: '',
      enrolmentNo: '', graduationYear: '', degree: ''
    });
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError('');
    setSuccessMsg('Form reset');
    setShowManualForm(false);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // --- Date parsing & formatting for <input type="date"> ---
  // Accepts several common formats and returns YYYY-MM-DD or empty string
  const formatDateForInput = (raw) => {
    if (!raw) return '';
    // If already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    // DD-MM-YYYY or DD/MM/YYYY
    let m = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
    if (m) {
      const [_, d, mo, y] = m;
      return `${y}-${mo}-${d}`;
    }

    // MM-DD-YYYY
    m = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      const [_, mo, d, y] = m;
      return `${y}-${mo}-${d}`;
    }

    // "Month DD, YYYY" (e.g. January 5, 2023)
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) {
      const dt = new Date(parsed);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    // Last resort: try to extract 4-digit year and numbers
    const yearMatch = raw.match(/(\d{4})/);
    if (yearMatch) {
      const year = yearMatch[1];
      // fallback to Jan 01 of that year
      return `${year}-01-01`;
    }

    return '';
  };

  // --- File to Base64 ---
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // --- Gemini AI Extraction ---
  const extractWithGemini = async (file) => {
    if (!GEMINI_API_KEY) {
      setError('Gemini API key missing. Check .env');
      return;
    }

    setExtracting(true);
    setError('');
    setSuccessMsg('');

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: GEMINI_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json'
          }
        })
      });

      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

      const data = await res.json();
      let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      jsonText = jsonText.replace(/```json|```/g, '').trim();
      const extracted = JSON.parse(jsonText);

      // Auto-fill form and ensure date is formatted for input[type=date]
      setForm({
        certificateNo: extracted.certificateNo || '',
        dateofIssue: formatDateForInput(extracted.dateofIssue || ''),
        name: extracted.name || '',
        enrolmentNo: extracted.enrolmentNo || '',
        graduationYear: extracted.graduationYear || '',
        degree: extracted.degree || '',
        department: extracted.department || ''
      });

      setSuccessMsg('AI extracted data successfully!');
      setShowManualForm(true); // Show form after AI fill
    } catch (err) {
      setError(`AI extraction failed: ${err.message}. Try manual entry.`);
    } finally {
      setExtracting(false);
    }
  };

  // --- File Handling ---
  const handleFileSelect = (file) => {
    if (!file) return;
    setUploadedFile(file);

    // revoke previous preview if any
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // start extraction but allow user to edit later
    extractWithGemini(file);
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files && e.target.files[0];
    if (file) handleFileSelect(file);
  };

  // --- Drag & Drop ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const openCamera = () => {
    // Reset value so same-file capture works repeatedly
    if (cameraInputRef.current) {
      cameraInputRef.current.value = null;
      cameraInputRef.current.click();
    }
  };

  // --- Verify on Blockchain ---
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {

      const payload = {
        certificateNo: form.certificateNo.trim(),
        dateofIssue: form.dateofIssue.trim(),
        name: form.name.trim(),
        enrolmentNo: form.enrolmentNo.trim(),
        graduationYear: form.graduationYear.trim(),
        degree: form.degree.trim(),
        department: form.department.trim()
      };

      const concatenated = Object.values(payload)
        .map(v => String(v).toLowerCase())
        .join('');

      console.log(concatenated)


      const certHash = ethers.keccak256(ethers.toUtf8Bytes(concatenated));

      const res = await fetch(`${import.meta.env.VITE_API_URL}/verifier/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providedHash: certHash })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (!data.valid) {
        setError('Certificate not found or invalid.');
      } else {
        setResult({ certId: data.certId, metadata: JSON.parse(data.metadata), certHash });
        setShowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- Copy to Clipboard ---
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMsg('Copied!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  // --- Cleanup preview ---
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="">
                <img
                  src="https://ik.imagekit.io/36liczygo/Picsart_25-11-23_22-59-19-838.png"
                  alt="Logo"
                  className="w-25 h-25 mt-2"
                />

              </div>
              <div>
                <h1 className="text-xl font-bold">EduchainX</h1>
                <p className="text-xs text-slate-500">Blockchain Certificate Verification</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={scrollToVerify} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:scale-105 transition">
                Verify Now
              </button>
              <button onClick={handleNavigateToLogin} className="px-5 py-2.5 rounded-xl border border-slate-300 font-medium hover:bg-slate-50 transition">
                Institute Login
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2">
            <button onClick={() => { setMobileMenuOpen(false); scrollToVerify(); }} className="w-full text-left py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              Verify Now
            </button>
            <button onClick={() => { setMobileMenuOpen(false); handleNavigateToLogin(); }} className="w-full text-left py-2.5 px-4 border rounded-lg">
              Institute Login
            </button>
          </div>
        )}
      </nav>

      {/* Main Verification Section */}
      <main className="max-w-4xl mx-auto px-4 py-12" ref={verifyRef}>
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">

          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">Verify Certificate</h2>
                  <p className="text-sm text-slate-600">AI-powered extraction or manual entry</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-600">Live</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Option Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upload Option */}
              <label
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative cursor-pointer rounded-2xl border-2 p-6 text-center transition-all
                  ${dragActive ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100' : 'border-slate-300 hover:border-blue-400'}
                  ${uploadedFile ? 'bg-blue-50 border-blue-400' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onClick={(e) => { e.currentTarget.value = null; }}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                  {uploadedFile ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-600" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">Upload or Take Photo</p>
                    <p className="text-xs text-slate-500">AI will auto-fill form</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-slate-50"
                  >
                    Choose File
                  </button>
                  {/* Make camera visible across screen sizes and make sure input is reset before clicking */}
                  <button
                    type="button"
                    onClick={openCamera}
                    className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-slate-50"
                  >
                    <Camera className="w-4 h-4 inline mr-1" /> Camera
                  </button>
                </div>
              </label>

              {/* Manual Option */}
              <button
                onClick={() => setShowManualForm(true)}
                className={`rounded-2xl border-2 p-6 text-center transition-all
                  ${showManualForm ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
                `}
              >
                <Edit3 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="mt-3 font-semibold text-slate-800">Enter Details Manually</p>
                <p className="text-xs text-slate-500">Fill form yourself</p>
              </button>
            </div>

            {/* File Preview */}
            {uploadedFile && previewUrl && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center overflow-hidden">
                  {uploadedFile.type === 'application/pdf' ? (
                    <FileText className="w-8 h-8 text-slate-600" />
                  ) : (
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setShowManualForm(false);
                  }}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* AI Extraction Status */}
            {extracting && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium">AI is reading your certificate...</p>
                  <p className="text-xs text-slate-600">This usually takes a few seconds</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                <CheckCircle className="w-5 h-5" />
                {successMsg}
              </div>
            )}

            {/* Manual Form (Only shown when needed) */}
            {showManualForm && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Certificate Number', name: 'certificateNo', type: 'text' },
                    { label: 'Date of Issue', name: 'dateofIssue', type: 'date' },
                    { label: 'Full Name', name: 'name', type: 'text' },
                    { label: 'Enrolment Number', name: 'enrolmentNo', type: 'text' },
                    { label: 'Graduation Year', name: 'graduationYear', type: 'text', pattern: '\\d{4}' },
                    { label: 'Degree', name: 'degree', type: 'text' },
                    { label: 'Department', name: 'department', type: 'text' }, // ✅ Added
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {field.label} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        required
                        pattern={field.pattern}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading || extracting}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium disabled:opacity-60 hover:scale-105 transition"
                  >
                    {loading ? (
                      <> <Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                    ) : (
                      <> <CheckCircle className="w-5 h-5" /> Verify Certificate</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Result Modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-green-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Verified Successfully!</h3>
                  <p className="text-sm text-slate-600">Certificate exists on blockchain</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Certificate Blockchain ID</span>
                <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{result.certId}</code>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Certificate Data Hash</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded max-w-32 truncate">{result.certHash}</code>
                  <button onClick={() => copyToClipboard(result.certHash)} className="p-1.5 hover:bg-slate-200 rounded">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Verified Details</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(result.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setShowModal(false) }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
