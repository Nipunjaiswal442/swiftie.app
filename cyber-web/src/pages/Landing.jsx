import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      
      // Navigate to the main app on successful login
      navigate('/feed');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px' }}>
          <span className="neon-saffron">// </span>
          <span className="neon-green">SWIFTIE</span>
        </h1>
        <p style={{ color: 'var(--cyber-muted)', fontSize: '1.2rem', maxWidth: '400px' }}>
          Enter the Neo-Delhi sprawl. Connect with street samurai and netrunners.
        </p>
      </div>

      <button 
        className="primary" 
        onClick={handleLogin}
        style={{ maxWidth: '300px', padding: '16px', fontSize: '1.2rem' }}
      >
        Jack In with Google
      </button>

      <p style={{ marginTop: '20px', color: 'var(--cyber-blue)', fontSize: '0.9rem' }}>
        Powered by Firebase Auth & MongoDB
      </p>
    </div>
  );
}
