import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectWallet from '../components/auth/connectWallet';
import { AuthContext } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard'); // ✅ Redirect if already logged in
    }
  }, [user, navigate]);

  return <ConnectWallet />;
};

export default LoginPage;
