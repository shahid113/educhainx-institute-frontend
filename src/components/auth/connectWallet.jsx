import { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ethers } from 'ethers';
import api from '../../api';
import contractAbi from '../../abi/abi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const ConnectWallet = () => {
  const { connectWallet } = useContext(AuthContext);
  const [error, setError] = useState('');

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleConnect = async () => {
    if (!window.ethereum) return showError('MetaMask not detected. Please install it first!');

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      if (!CONTRACT_ADDRESS) throw new Error('Contract address is missing.');

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      let isApproved = false;
      try {
        isApproved = await contract.isApprovedIssuer(walletAddress);
      } catch (err) {
        return showError("Contract call failed — check contract address, ABI, or function name.");
      }

      if (!isApproved) return showError('This wallet is not approved by the blockchain admin.');

      const { data: nonceData } = await api.post('/institute/nonce', { walletAddress });
      const signature = await signer.signMessage(nonceData.message);

      await api.post('/institute/login', { walletAddress, signature });
      connectWallet();
    } catch (err) {
      if (err.code === 4001) showError('You rejected the MetaMask request.');
      else if (err.code === 'ACTION_REJECTED') showError('Transaction or signature rejected.');
      else showError(err.response?.data?.error || err.message || 'Unexpected error occurred.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-screen bg-gray-50 font-inter overflow-hidden">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 relative flex justify-center items-center p-8 sm:p-10 bg-gradient-to-br from-indigo-900 via-sky-900 to-gray-900">
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_30%,rgba(255,165,0,0.3),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,255,255,0.25),transparent_40%)]"></div>
        <div className="relative z-10 text-left text-white max-w-md">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-snug mb-4 sm:mb-6">
            Institute Login<br />
            in a <span className="text-orange-400">Trusted Blockchain</span> Environment.
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            Seamlessly connect your MetaMask wallet to verify identity and access decentralized
            institute services securely using blockchain technology.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-8 sm:p-10 bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md animate-fadeIn">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 text-center">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Secure your account by connecting your <strong>MetaMask</strong> wallet.
            Make sure you’re on the right Ethereum network.
          </p>

          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 text-white py-3 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-orange-300/50 hover:scale-105 transition-transform duration-300"
          >
            🔗 Connect MetaMask
          </button>

          {error && (
            <div className="mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center animate-fadeIn">
              {error}
            </div>
          )}

          <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-center text-gray-500">
            Need Help? <a href="#" className="text-orange-500 hover:underline">Contact Support</a>
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ConnectWallet;
