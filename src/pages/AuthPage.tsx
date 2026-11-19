import React, { useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  googleProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from '../lib/firebase';
import { useApp } from '../context/AppContext';

export const AuthPage: React.FC = () => {
  const { lang, navigate } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [stream, setStream] = useState('CUET / Undergraduate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const formatAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not enabled yet in Firebase Console (Authentication → Sign-in method → Enable Email/Password). You can use "Continue with Google" immediately below, or enable Email/Password in Firebase Console.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please switch to Log In.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cleanName = name.trim().slice(0, 120);
        const cleanStream = stream.slice(0, 80);
        if (!cleanName) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: cleanName });

        const userRef = doc(db, 'users', cred.user.uid);
        const existingProfile = await getDoc(userRef);
        if (existingProfile.exists()) {
          await updateDoc(userRef, {
            displayName: cleanName,
            stream: cleanStream,
            updatedAt: serverTimestamp(),
          });
        } else {
          try {
            await setDoc(userRef, {
              uid: cred.user.uid,
              displayName: cleanName,
              stream: cleanStream,
              photoUrl: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch {
            await updateDoc(userRef, {
              displayName: cleanName,
              stream: cleanStream,
              updatedAt: serverTimestamp(),
            });
          }
        }

        const privRef = doc(db, 'users', cred.user.uid, 'private', 'info');
        const existingPriv = await getDoc(privRef);
        if (!existingPriv.exists()) {
          try {
            await setDoc(privRef, {
              uid: cred.user.uid,
              email: email.trim().slice(0, 254),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch {
            // Private info may already have been created by auth listener
          }
        }

        try {
          await sendEmailVerification(cred.user);
        } catch {
          // optional verification email
        }
        setInfoMsg('Account created! Redirecting to your Student Dashboard...');
        setTimeout(() => navigate('dashboard'), 800);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        navigate('dashboard');
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('dashboard');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/assets/aistudio/logo_c99d9733.png"
            alt="Student Manch"
            className="w-14 h-14 rounded-full mx-auto border border-amber-400/60"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-display text-2xl font-bold text-white">
            {mode === 'login'
              ? lang === 'hi'
                ? 'स्टूडेंट मंच में लॉगिन करें'
                : 'Log In to Student Manch'
              : lang === 'hi'
              ? 'नया छात्र खाता बनाएं'
              : 'Create Student Account'}
          </h1>
          <p className="text-xs text-slate-400">
            {lang === 'hi'
              ? 'अपनी क्विज प्रगति, रैंक और बुकमार्क सुरक्षित रखें'
              : 'Save your quiz scores, track accuracy, and access your personalized dashboard'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'hi' ? 'लॉगिन' : 'Log In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'hi' ? 'साइन अप' : 'Sign Up'}
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200 leading-relaxed">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Target Exam / Stream</label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                >
                  <option>CUET / Undergraduate</option>
                  <option>JEE Main & Advanced</option>
                  <option>NEET UG Medical</option>
                  <option>UPSC / State PSC</option>
                  <option>SSC / Banking / Railways</option>
                  <option>Class 10 / 12 Board</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? lang === 'hi'
                ? 'लॉगिन करें'
                : 'Log In'
              : lang === 'hi'
              ? 'खाता बनाएं'
              : 'Create Account'}
          </button>
        </form>

        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-xs text-slate-500">OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-sm font-medium text-white transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
};
