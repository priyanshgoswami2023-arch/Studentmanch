import React, { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Award, Bookmark, LogOut, Save, Shield, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';

export const DashboardPage: React.FC = () => {
  const {
    lang,
    user,
    profile,
    isAdminUser,
    attempts,
    bookmarks,
    navigate,
    logout,
  } = useApp();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [stream, setStream] = useState(profile?.stream || 'CUET / Undergraduate');
  const [savedMsg, setSavedMsg] = useState('');

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-white">
          {lang === 'hi' ? 'छात्र डैशबोर्ड देखने के लिए लॉगिन करें' : 'Sign in to access your Dashboard'}
        </h1>
        <p className="text-sm text-slate-400">
          Track your quiz attempts, accuracy trends, and saved study materials across devices.
        </p>
        <button
          type="button"
          onClick={() => navigate('auth')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white"
        >
          Go to Sign In / Sign Up
        </button>
      </div>
    );
  }

  const avgAccuracy =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length)
      : 0;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim().slice(0, 120),
        stream: stream.slice(0, 80),
        updatedAt: serverTimestamp(),
      });
      setSavedMsg('Profile updated.');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {lang === 'hi' ? 'नमस्ते' : 'Welcome'}, {profile?.displayName || user.email}
          </h1>
          <p className="text-sm text-slate-400">
            {user.email} · {profile?.stream || 'Student'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdminUser && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="text-xs text-slate-400">Quizzes Completed</div>
          <div className="font-mono-tabular text-3xl font-extrabold text-sky-400 mt-1">
            {attempts.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="text-xs text-slate-400">Average Accuracy</div>
          <div className="font-mono-tabular text-3xl font-extrabold text-emerald-400 mt-1">
            {avgAccuracy}%
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="text-xs text-slate-400">Saved Bookmarks</div>
          <div className="font-mono-tabular text-3xl font-extrabold text-amber-400 mt-1">
            {bookmarks.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quiz Progress History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-sky-400" />
              {lang === 'hi' ? 'मेरी क्विज प्रगति' : 'Saved Quiz History'}
            </h2>
            <button
              type="button"
              onClick={() => navigate('quiz')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300"
            >
              Take New Quiz →
            </button>
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-3">
              <Award className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">
                No quizzes completed yet. Attempt a mock quiz to track your progress here.
              </p>
              <button
                type="button"
                onClick={() => navigate('quiz')}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white"
              >
                Explore Quizzes
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
              {attempts.map((att) => (
                <div key={att.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{att.quizTitle}</div>
                    <div className="text-xs text-slate-400 font-mono-tabular">
                      {att.completedAt.slice(0, 10)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-tabular text-sm font-bold text-sky-400">
                      {att.score} / {att.totalQuestions}
                    </div>
                    <div className="font-mono-tabular text-xs text-emerald-400">
                      {att.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bookmarks */}
          <div className="pt-4 space-y-3">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-400" />
              {lang === 'hi' ? 'सहेजे गए बुकमार्क' : 'Saved Study Bookmarks'}
            </h2>
            {bookmarks.length === 0 ? (
              <p className="text-sm text-slate-400">
                Click the bookmark icon on any news article, notice, or college to save it here.
              </p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        bm.itemType === 'news'
                          ? 'news'
                          : bm.itemType === 'notice'
                          ? 'notices'
                          : bm.itemType === 'college'
                          ? 'colleges'
                          : 'quiz'
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-white">{bm.title}</span>
                    <span className="text-xs uppercase text-slate-400">{bm.itemType}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleUpdateProfile}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Student Profile</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Stream</label>
              <input
                type="text"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>
            {savedMsg && <p className="text-xs text-emerald-400">{savedMsg}</p>}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
