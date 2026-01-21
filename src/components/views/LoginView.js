import React from 'react';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from '../../utils/firebase';

const LoginView = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] text-[#1a1a1a]">
      <div className="max-w-md text-center p-6">
        <h1 className="text-4xl font-light mb-2">Slip-box</h1>
        <p className="text-gray-400 mb-12 font-mono text-sm">Mental Topography</p>
        
        <button 
          onClick={handleLogin}
          className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginView;