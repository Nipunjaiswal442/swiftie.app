import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { exchangeFirebaseToken } from '../services/api';
import { initUserKeys } from '../services/encryption';
import { uploadPreKeys } from '../services/api';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Firebase Google Sign-In → get Firebase user + ID token
      const firebaseUser = await signInWithGoogle();
      const idToken = await firebaseUser.getIdToken();

      // 2. Exchange Firebase ID token for our backend JWT
      const { token, user } = await exchangeFirebaseToken(idToken);
      localStorage.setItem('swiftie_token', token);
      localStorage.setItem('swiftie_user', JSON.stringify(user));

      // 3. Initialize E2E encryption keys (generates ECDH key pair if first login)
      const publicKeyB64 = await initUserKeys(user._id);

      // 4. Upload public key to server for E2E key exchange
      try {
        await uploadPreKeys({ identityKey: publicKeyB64 });
      } catch {
        // Non-fatal — key upload can be retried
      }

      navigate('/feed');
    } catch (err) {
      console.error('Login failed', err);
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
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
        disabled={loading}
        style={{ maxWidth: '300px', padding: '16px', fontSize: '1.2rem' }}
      >
        {loading ? 'Jacking In...' : 'Jack In with Google'}
      </button>

      {error && (
        <p style={{ marginTop: '16px', color: '#ff4444', fontSize: '0.9rem' }}>{error}</p>
      )}

      <p style={{ marginTop: '20px', color: 'var(--cyber-blue)', fontSize: '0.9rem' }}>
        Powered by Firebase Auth & MongoDB
      </p>
    </div>
  );
}
