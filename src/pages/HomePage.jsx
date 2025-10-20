import { useState, useRef } from 'react'
import { ethers } from 'ethers'
import { CheckCircle, Shield, ArrowRight, XCircle, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const [form, setForm] = useState({
    certificateNo: '',
    dateofIssue: '', // <-- must match issuance
    name: '',
    enrolmentNo: '',
    graduationYear: '',
    degree: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const verifyRef = useRef(null)
  const navigate = useNavigate()

  const handleNavigateToLogin = () => navigate('/login')
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleStartVerification = () =>
    verifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })


  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const certPayload = {
        certificateNo: form.certificateNo.trim(),
        dateofIssue: form.dateofIssue.trim(),
        name: form.name.trim(),
        enrolmentNo: form.enrolmentNo.trim(),
        graduationYear: form.graduationYear.trim(),
        degree: form.degree.trim(),
      };

      // Generate hash using specific fields in lowercase
      const concatenatedData = [
        certPayload.certificateNo,
        certPayload.dateofIssue,
        certPayload.name,
        certPayload.enrolmentNo,
        certPayload.graduationYear,
        certPayload.degree
      ].map(value => String(value).toLowerCase()).join('');
      const certHash = ethers.keccak256(ethers.toUtf8Bytes(concatenatedData));
      console.log('Certificate Hash:', certHash);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/verifier/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providedHash: certHash })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (!data.valid) {
        setError('❌ Certificate not found or invalid.');
      } else {
        setResult({
          certId: data.certId,
          metadata: JSON.parse(data.metadata),
          certHash
        });
        setShowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while verifying.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-8 py-4 backdrop-blur-md bg-white/80 border-b border-slate-200/50">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EduchainX
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-4 sm:gap-6 text-sm font-medium">
          <a
            href="#verify"
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
          >
            Verify
          </a>
          <button
            onClick={handleNavigateToLogin}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
          >
            Institute Login
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t border-slate-200 shadow-lg md:hidden animate-fade-in">
            <div className="flex flex-col items-center gap-3 py-4">
              <a
                href="#verify"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10/12 text-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
              >
                Verify
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleNavigateToLogin()
                }}
                className="w-10/12 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
              >
                Institute Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 sm:px-8 py-16 sm:py-20 text-center max-w-6xl mx-auto">
        <div className="mb-6 inline-block px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium">
          🔐 Blockchain-Powered Verification
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-slate-900">
          Verify Your Credentials with{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Absolute Certainty
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Instantly authenticate your educational certificates using decentralized blockchain
          technology.
        </p>

        <button
          onClick={handleStartVerification}
          className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
        >
          Start Verification <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Verification Form */}
      <section
        id="verify"
        ref={verifyRef}
        className="relative z-10 px-4 sm:px-8 py-16 sm:py-20 max-w-4xl mx-auto w-full scroll-smooth"
      >
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 sm:px-8 py-6 sm:py-8 border-b border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-slate-900">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" /> Verify Your Certificate
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Enter your certificate details below for instant verification
            </p>
          </div>

          <form onSubmit={handleVerify} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Certificate Number', name: 'certificateNo', type: 'text' },
                { label: 'Date of Issue', name: 'dateofIssue', type: 'date' }, // must match issuance
                { label: 'Full Name', name: 'name', type: 'text' },
                { label: 'Enrolment Number', name: 'enrolmentNo', type: 'text' },
                { label: 'Graduation Year', name: 'graduationYear', type: 'number' },
                { label: 'Degree', name: 'degree', type: 'text' }
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify Certificate
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mx-6 sm:mx-8 mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium text-sm sm:text-base">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Modal Popup */}
      {showModal && result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-green-200 relative animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-green-700">
              <CheckCircle className="w-6 h-6" />
              <h3 className="text-lg sm:text-xl font-semibold">Certificate Verified Successfully</h3>
            </div>

            <div className="space-y-3 text-slate-700 text-sm sm:text-base">
              <p>
                <span className="font-semibold">Certificate ID:</span> {result.certId}
              </p>
              <p>
                <span className="font-semibold">Hash:</span>{' '}
                <code className="bg-slate-100 px-2 py-1 rounded text-xs break-all block">
                  {result.certHash}
                </code>
              </p>

              <div className="border-t border-slate-200 pt-3 mt-3">
                <h4 className="font-semibold text-green-700 mb-2">Metadata</h4>
                <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                  {Object.entries(result.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between border-b border-slate-200/60 pb-1 text-xs sm:text-sm"
                    >
                      <span className="capitalize text-slate-600">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-medium text-slate-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 px-6 sm:px-8 py-8 sm:py-12 text-center text-slate-600 text-sm sm:text-base">
        <p>© 2025 EduchainX. Powered by blockchain technology. Secure. Transparent. Trusted.</p>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.25s ease-out forwards; }
      `}</style>
    </div>
  )
}

export default HomePage
