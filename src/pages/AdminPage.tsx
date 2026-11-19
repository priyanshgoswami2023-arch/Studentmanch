import React, { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  CheckCircle2,
  Edit3,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ADMIN_EMAIL,
  auth,
  db,
  emailToWhitelistId,
  getDocFromServer,
  googleProvider,
  signInWithPopup,
} from '../lib/firebase';
import { CollegeItem, NewsArticle, NewsCategory, NoticeItem, QuizItem, QuizQuestion, RankerEntry } from '../types';

type GuardState =
  | { status: 'checking' }
  | { status: 'unauthenticated' }
  | { status: 'denied'; reason: string }
  | { status: 'authorized'; role: 'owner' | 'editor'; email: string };

export const AdminPage: React.FC = () => {
  const { user, authReady, navigate, logout } = useApp();
  const [guardState, setGuardState] = useState<GuardState>({ status: 'checking' });
  const [signInBusy, setSignInBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    async function verifyProtectedRoute() {
      if (!authReady) {
        if (active) setGuardState({ status: 'checking' });
        return;
      }

      if (!user) {
        if (active) setGuardState({ status: 'unauthenticated' });
        return;
      }

      if (!user.email || !user.emailVerified) {
        if (active) {
          setGuardState({
            status: 'denied',
            reason: `Signed in as ${user.email || 'unknown account'}, but email verification is required before checking the Firestore admin whitelist.`,
          });
        }
        return;
      }

      if (active) setGuardState({ status: 'checking' });
      const normalizedEmail = user.email.trim().toLowerCase();
      const entryId = emailToWhitelistId(normalizedEmail);
      const wlRef = doc(db, 'admin_whitelist', entryId);

      try {
        // Step 1: Verify authenticated user's email against Firestore admin_whitelist
        let snap;
        try {
          snap = await getDocFromServer(wlRef);
        } catch {
          snap = await getDoc(wlRef);
        }

        // Auto-bootstrap primary owner entry if missing on first owner visit
        if (!snap.exists() && normalizedEmail === ADMIN_EMAIL) {
          await setDoc(wlRef, {
            id: entryId,
            email: ADMIN_EMAIL,
            role: 'owner',
            active: true,
            addedBy: ADMIN_EMAIL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          snap = await getDoc(wlRef);
        }

        if (!snap.exists()) {
          if (active) {
            setGuardState({
              status: 'denied',
              reason: `Access denied: ${user.email} is not listed in the Firestore admin whitelist.`,
            });
          }
          return;
        }

        const data = snap.data();
        const isActiveEntry =
          data?.active === true &&
          String(data?.email || '').toLowerCase() === normalizedEmail;

        if (!isActiveEntry) {
          if (active) {
            setGuardState({
              status: 'denied',
              reason: `Access denied: Whitelist entry for ${user.email} is currently inactive.`,
            });
          }
          return;
        }

        // Step 2: Cryptographically verify Firebase ID token via backend (/api/admin/verify on Cloud Run/Node)
        // or fresh Firebase Auth token claims when deployed on static/Firebase Hosting
        const token = await user.getIdToken();
        try {
          const res = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const contentType = res.headers.get('content-type') || '';

          if (res.status === 401 || res.status === 403) {
            const payload = await res.json().catch(() => ({}));
            if (active) {
              setGuardState({
                status: 'denied',
                reason: payload.error || 'Backend ID token verification failed.',
              });
            }
            return;
          }

          if (res.ok && contentType.includes('application/json')) {
            const payload = await res.json().catch(() => ({}));
            if (payload.authorized !== true) {
              if (active) {
                setGuardState({
                  status: 'denied',
                  reason: payload.error || 'Backend ID token verification failed.',
                });
              }
              return;
            }
          } else {
            const tokenResult = await user.getIdTokenResult(true);
            if (tokenResult.claims?.email_verified !== true) {
              if (active) {
                setGuardState({
                  status: 'denied',
                  reason: 'Verified Firebase ID token claim is required.',
                });
              }
              return;
            }
          }
        } catch {
          const tokenResult = await user.getIdTokenResult(true);
          if (tokenResult.claims?.email_verified !== true) {
            if (active) {
              setGuardState({
                status: 'denied',
                reason: 'Unable to verify Firebase ID token.',
              });
            }
            return;
          }
        }

        if (active) {
          setGuardState({
            status: 'authorized',
            role: data?.role === 'owner' ? 'owner' : 'editor',
            email: normalizedEmail,
          });
        }
      } catch (err) {
        if (active) {
          setGuardState({
            status: 'denied',
            reason:
              err instanceof Error && err.message.toLowerCase().includes('permission')
                ? `Access denied: ${user.email} is not authorized in the Firestore admin whitelist.`
                : err instanceof Error
                ? err.message
                : 'Unable to verify Firestore admin whitelist.',
          });
        }
      }
    }

    verifyProtectedRoute();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const handleAdminSignIn = async () => {
    setAuthError('');
    setSignInBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSignInBusy(false);
    }
  };

  if (guardState.status !== 'authorized') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 sm:p-8 space-y-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-300">
            {guardState.status === 'denied' ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-white">
              Protected Admin Route
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access requires a verified Google account listed in the Firestore admin whitelist (
              <span className="text-slate-200 font-medium">admin_whitelist</span>) plus backend ID token verification.
            </p>
          </div>

          {guardState.status === 'checking' && (
            <div className="py-3 px-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
              Verifying authenticated email against Firestore whitelist...
            </div>
          )}

          {guardState.status === 'denied' && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 leading-relaxed">
              {guardState.reason}
            </div>
          )}

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
              {authError}
            </div>
          )}

          {guardState.status !== 'checking' && (
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={signInBusy}
                onClick={handleAdminSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {signInBusy
                  ? 'Signing in...'
                  : user
                  ? 'Switch to Whitelisted Google Account'
                  : 'Sign in with Whitelisted Google Account'}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out ({user.email})
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('home')}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
          >
            Return to Home Page
          </button>
        </div>
      </div>
    );
  }

  return <AdminWorkspace verifiedRole={guardState.role} verifiedEmail={guardState.email} />;
};

const AdminWorkspace: React.FC<{ verifiedRole: 'owner' | 'editor'; verifiedEmail: string }> = ({
  verifiedRole,
  verifiedEmail,
}) => {
  const {
    user,
    isAdminUser,
    isPrimaryOwner,
    adminWhitelist,
    quizzes,
    notices,
    colleges,
    news,
    contactMessages,
    saveQuiz,
    deleteQuiz,
    saveNotice,
    deleteNotice,
    saveCollege,
    deleteCollege,
    saveNews,
    deleteNews,
    addAdminWhitelistEmail,
    toggleAdminWhitelistActive,
    removeAdminWhitelistEmail,
    uploadAssetFile,
    refreshCatalog,
  } = useApp();

  const [tab, setTab] = useState<'quizzes' | 'notices' | 'colleges' | 'news' | 'messages' | 'whitelist'>('quizzes');
  const [statusMsg, setStatusMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Whitelist Form State
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const [newWhitelistRole, setNewWhitelistRole] = useState<'editor' | 'owner'>('editor');

  // Quiz Form State (supports multiple MCQs per quiz)
  const [quizId, setQuizId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTitleHi, setQuizTitleHi] = useState('');
  const [quizCategory, setQuizCategory] = useState('Polity & GK');
  const [quizDuration, setQuizDuration] = useState(10);
  const [quizExtUrl, setQuizExtUrl] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [quizQuestionText, setQuizQuestionText] = useState('');
  const [quizQuestionHi, setQuizQuestionHi] = useState('');
  const [quizOptA, setQuizOptA] = useState('');
  const [quizOptB, setQuizOptB] = useState('');
  const [quizOptC, setQuizOptC] = useState('');
  const [quizOptD, setQuizOptD] = useState('');
  const [quizCorrectIdx, setQuizCorrectIdx] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState('');
  const [rankers, setRankers] = useState<RankerEntry[]>([
    { rank: 1, name: 'Rank 1 Topper', photoUrl: '/assets/avatars/ranker_1.svg', score: 5, totalQuestions: 5 },
    { rank: 2, name: 'Rank 2 Topper', photoUrl: '/assets/avatars/ranker_2.svg', score: 4, totalQuestions: 5 },
    { rank: 3, name: 'Rank 3 Topper', photoUrl: '/assets/avatars/ranker_3.svg', score: 3, totalQuestions: 5 },
  ]);

  // Notice Form State
  const [noticeId, setNoticeId] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeTitleHi, setNoticeTitleHi] = useState('');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().slice(0, 10));
  const [noticeCategory, setNoticeCategory] = useState('Exam Notice');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeImageUrl, setNoticeImageUrl] = useState('/assets/illustrations/notice_official.svg');
  const [noticePdfUrl, setNoticePdfUrl] = useState('');
  const [noticeExtUrl, setNoticeExtUrl] = useState('');

  // College Form State
  const [colId, setColId] = useState('');
  const [colName, setColName] = useState('');
  const [colNameHi, setColNameHi] = useState('');
  const [colLocation, setColLocation] = useState('');
  const [colStream, setColStream] = useState('Engineering & Technology');
  const [colDetails, setColDetails] = useState('');
  const [colFees, setColFees] = useState('');
  const [colExams, setColExams] = useState('');
  const [colImageUrl, setColImageUrl] = useState('/assets/illustrations/admission_campus.svg');
  const [colPdfUrl, setColPdfUrl] = useState('');
  const [colExtUrl, setColExtUrl] = useState('');

  // News Form State
  const [newsId, setNewsId] = useState('');
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsHeadlineHi, setNewsHeadlineHi] = useState('');
  const [newsCategory, setNewsCategory] = useState<NewsCategory>('Exam');
  const [newsDate, setNewsDate] = useState(new Date().toISOString().slice(0, 10));
  const [newsAuthor, setNewsAuthor] = useState('Student Manch Desk');
  const [newsExcerpt, setNewsExcerpt] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('/assets/illustrations/exam_portal.svg');

  const notify = (msg: string) => {
    setActionError('');
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4500);
  };

  const notifyError = (err: unknown) => {
    setStatusMsg('');
    setActionError(err instanceof Error ? err.message : 'Operation failed. Please try again.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await refreshCatalog();
      notify('Synced latest live data from Firestore server.');
    } catch (err) {
      notifyError(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteItem = async (fn: () => Promise<{ remoteSaved: boolean }>, label: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await fn();
      notify(`${label} deleted across all devices.`);
    } catch (err) {
      notifyError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    file: File | undefined,
    folder: 'images' | 'pdfs',
    onSuccess: (url: string) => void
  ) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAssetFile(file, folder);
      onSuccess(url);
      notify(`Uploaded ${file.name} cleanly.`);
    } catch (err) {
      notifyError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAdminWhitelistEmail(newWhitelistEmail, newWhitelistRole);
      setNewWhitelistEmail('');
      notify('Admin email added to Firestore whitelist.');
    } catch (err) {
      notifyError(err);
    }
  };

  const resetQuestionDraft = () => {
    setEditingQuestionIdx(null);
    setQuizQuestionText('');
    setQuizQuestionHi('');
    setQuizOptA('');
    setQuizOptB('');
    setQuizOptC('');
    setQuizOptD('');
    setQuizCorrectIdx(0);
    setQuizExplanation('');
  };

  const resetQuizForm = () => {
    setQuizId('');
    setQuizTitle('');
    setQuizTitleHi('');
    setQuizCategory('Polity & GK');
    setQuizDuration(10);
    setQuizExtUrl('');
    setQuizQuestions([]);
    resetQuestionDraft();
  };

  const buildDraftQuestion = (): QuizQuestion => ({
    id:
      editingQuestionIdx !== null && quizQuestions[editingQuestionIdx]
        ? quizQuestions[editingQuestionIdx].id
        : `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    question: quizQuestionText.trim(),
    ...(quizQuestionHi.trim() ? { questionHi: quizQuestionHi.trim() } : {}),
    options: [
      quizOptA.trim() || 'Option A',
      quizOptB.trim() || 'Option B',
      quizOptC.trim() || 'Option C',
      quizOptD.trim() || 'Option D',
    ],
    correctIndex: quizCorrectIdx,
    ...(quizExplanation.trim() ? { explanation: quizExplanation.trim() } : {}),
  });

  const handleAddOrUpdateQuestion = () => {
    if (!quizQuestionText.trim()) {
      notifyError(new Error('Please enter a question prompt before adding.'));
      return;
    }
    if (editingQuestionIdx === null && quizQuestions.length >= 50) {
      notifyError(new Error('Maximum 50 questions allowed per quiz.'));
      return;
    }
    const qObj = buildDraftQuestion();
    if (editingQuestionIdx !== null) {
      setQuizQuestions((prev) => prev.map((item, idx) => (idx === editingQuestionIdx ? qObj : item)));
      notify(`Question ${editingQuestionIdx + 1} updated in quiz.`);
    } else {
      setQuizQuestions((prev) => [...prev, qObj]);
      notify(`Question ${quizQuestions.length + 1} added to quiz. You can add more questions below!`);
    }
    resetQuestionDraft();
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    const id = quizId || `quiz_${Date.now()}`;
    let finalQuestions = [...quizQuestions];
    if (quizQuestionText.trim()) {
      if (finalQuestions.length >= 50 && editingQuestionIdx === null) {
        notifyError(new Error('Maximum 50 questions allowed per quiz.'));
        return;
      }
      const draftQ = buildDraftQuestion();
      if (editingQuestionIdx !== null) {
        finalQuestions = finalQuestions.map((item, idx) => (idx === editingQuestionIdx ? draftQ : item));
      } else {
        finalQuestions.push(draftQ);
      }
    }

    if (finalQuestions.length === 0) {
      notifyError(new Error('Please add at least 1 question using the "Add Question" button before saving the quiz.'));
      return;
    }

    const payload: QuizItem = {
      id,
      title: quizTitle.trim(),
      titleHi: quizTitleHi.trim(),
      category: quizCategory.trim(),
      durationMinutes: Number(quizDuration) || 10,
      externalUrl: quizExtUrl.trim(),
      questions: finalQuestions.slice(0, 50),
      topRankers: rankers,
    };
    setSaving(true);
    try {
      const res = await saveQuiz(payload);
      resetQuizForm();
      notify(
        res.remoteSaved
          ? `Quiz saved live to Firestore with ${finalQuestions.length} question(s).`
          : 'Quiz saved locally. Sign in with Admin Google account to publish to Firestore.'
      );
    } catch (err) {
      notifyError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    const id = noticeId || `notice_${Date.now()}`;
    const payload: NoticeItem = {
      id,
      title: noticeTitle,
      titleHi: noticeTitleHi,
      date: noticeDate,
      category: noticeCategory,
      summary: noticeSummary,
      imageUrl: noticeImageUrl,
      pdfUrl: noticePdfUrl,
      externalUrl: noticeExtUrl,
    };
    setSaving(true);
    try {
      const res = await saveNotice(payload);
      setNoticeId('');
      setNoticeTitle('');
      setNoticeTitleHi('');
      setNoticeSummary('');
      setNoticePdfUrl('');
      setNoticeExtUrl('');
      notify(res.remoteSaved ? 'Notice published live to Firestore.' : 'Notice saved locally.');
    } catch (err) {
      notifyError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    const id = colId || `col_${Date.now()}`;
    const payload: CollegeItem = {
      id,
      name: colName,
      nameHi: colNameHi,
      location: colLocation,
      stream: colStream,
      details: colDetails,
      fees: colFees,
      examsAccepted: colExams,
      imageUrl: colImageUrl,
      pdfUrl: colPdfUrl,
      externalUrl: colExtUrl,
    };
    setSaving(true);
    try {
      const res = await saveCollege(payload);
      setColId('');
      setColName('');
      setColNameHi('');
      setColLocation('');
      setColDetails('');
      setColFees('');
      setColExams('');
      setColPdfUrl('');
      setColExtUrl('');
      notify(res.remoteSaved ? 'College published live to Firestore.' : 'College saved locally.');
    } catch (err) {
      notifyError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    const id = newsId || `news_${Date.now()}`;
    const slug = newsHeadline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 140) || id;

    const payload: NewsArticle = {
      id,
      slug,
      headline: newsHeadline,
      headlineHi: newsHeadlineHi,
      category: newsCategory,
      date: newsDate,
      author: newsAuthor,
      readTime: '4 min read',
      excerpt: newsExcerpt,
      content: newsContent,
      imageUrl: newsImageUrl,
    };
    setSaving(true);
    try {
      const res = await saveNews(payload);
      setNewsId('');
      setNewsHeadline('');
      setNewsHeadlineHi('');
      setNewsExcerpt('');
      setNewsContent('');
      notify(res.remoteSaved ? 'Article published live to Firestore.' : 'Article saved locally.');
    } catch (err) {
      notifyError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Admin Header & Live Firestore Verification Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            Student Manch Admin Panel
          </h1>
          <p className="text-xs text-emerald-300 mt-1">
            Whitelisted {verifiedRole.toUpperCase()} ({verifiedEmail || user?.email}) · Firestore Whitelist &amp; Backend Token Verified
          </p>
        </div>
        <button
          type="button"
          disabled={syncing}
          onClick={handleManualSync}
          className="inline-flex items-center gap-1.5 self-start md:self-auto px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 hover:border-sky-400 text-xs font-semibold text-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Server'}
        </button>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {statusMsg}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          isPrimaryOwner
            ? (['quizzes', 'notices', 'colleges', 'news', 'messages', 'whitelist'] as const)
            : (['quizzes', 'notices', 'colleges', 'news', 'messages'] as const)
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600'
            }`}
          >
            {t === 'whitelist' ? 'Admin Whitelist' : t}
          </button>
        ))}
      </div>

      {/* QUIZZES TAB */}
      {tab === 'quizzes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveQuiz}
            className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              {quizId ? 'Edit Quiz & Rankers' : 'Add Quiz, External Link & Rankers'}
            </h2>
            <input
              type="text"
              required
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Quiz Title (English)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <input
              type="text"
              value={quizTitleHi}
              onChange={(e) => setQuizTitleHi(e.target.value)}
              placeholder="Quiz Title (Hindi - Optional)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={quizCategory}
                onChange={(e) => setQuizCategory(e.target.value)}
                placeholder="Category"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
              <input
                type="number"
                min={1}
                max={180}
                value={quizDuration}
                onChange={(e) => setQuizDuration(Number(e.target.value))}
                placeholder="Minutes"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>
            <input
              type="url"
              value={quizExtUrl}
              onChange={(e) => setQuizExtUrl(e.target.value)}
              placeholder="External Practice Link (https://...)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
            />

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-300">
                  {editingQuestionIdx !== null
                    ? `Editing Question #${editingQuestionIdx + 1}`
                    : `Add Questions to Quiz (${quizQuestions.length} / 50 added)`}
                </span>
                {editingQuestionIdx !== null && (
                  <button
                    type="button"
                    onClick={resetQuestionDraft}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Cancel Question Edit
                  </button>
                )}
              </div>
              <input
                type="text"
                value={quizQuestionText}
                onChange={(e) => setQuizQuestionText(e.target.value)}
                placeholder="Question prompt (English)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                value={quizQuestionHi}
                onChange={(e) => setQuizQuestionHi(e.target.value)}
                placeholder="Question prompt (Hindi - Optional)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={quizOptA} onChange={(e) => setQuizOptA(e.target.value)} placeholder="Option A" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white" />
                <input type="text" value={quizOptB} onChange={(e) => setQuizOptB(e.target.value)} placeholder="Option B" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white" />
                <input type="text" value={quizOptC} onChange={(e) => setQuizOptC(e.target.value)} placeholder="Option C" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white" />
                <input type="text" value={quizOptD} onChange={(e) => setQuizOptD(e.target.value)} placeholder="Option D" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={quizCorrectIdx}
                  onChange={(e) => setQuizCorrectIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value={0}>Correct Option: A</option>
                  <option value={1}>Correct Option: B</option>
                  <option value={2}>Correct Option: C</option>
                  <option value={3}>Correct Option: D</option>
                </select>
                <input
                  type="text"
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  placeholder="Answer Explanation (Optional)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddOrUpdateQuestion}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-sky-500/50 bg-sky-500/15 hover:bg-sky-500/25 text-xs font-semibold text-sky-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {editingQuestionIdx !== null ? 'Update This Question' : 'Add Question to Quiz'}
              </button>

              {quizQuestions.length > 0 && (
                <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Questions in this Quiz ({quizQuestions.length})
                  </div>
                  {quizQuestions.map((qq, idx) => (
                    <div
                      key={qq.id || idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          Q{idx + 1}. {qq.question}
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          Ans: {String.fromCharCode(65 + qq.correctIndex)} ({qq.options[qq.correctIndex]})
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionIdx(idx);
                            setQuizQuestionText(qq.question);
                            setQuizQuestionHi(qq.questionHi || '');
                            setQuizOptA(qq.options[0] || '');
                            setQuizOptB(qq.options[1] || '');
                            setQuizOptC(qq.options[2] || '');
                            setQuizOptD(qq.options[3] || '');
                            setQuizCorrectIdx(qq.correctIndex);
                            setQuizExplanation(qq.explanation || '');
                          }}
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                          title="Edit Question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
                            if (editingQuestionIdx === idx) resetQuestionDraft();
                          }}
                          className="p-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15"
                          title="Remove Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-amber-300">Top 3 Podium Rankers & Photos</div>
              {rankers.map((rk, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    value={rk.name}
                    onChange={(e) => {
                      const next = [...rankers];
                      next[i] = { ...rk, name: e.target.value };
                      setRankers(next);
                    }}
                    placeholder={`Rank ${i + 1} Name`}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={rk.score}
                    onChange={(e) => {
                      const next = [...rankers];
                      next[i] = { ...rk, score: Number(e.target.value) };
                      setRankers(next);
                    }}
                    placeholder="Score"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <label className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300 cursor-pointer hover:border-sky-400">
                    <Upload className="w-3.5 h-3.5" />
                    Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e.target.files?.[0], 'images', (url) => {
                          const next = [...rankers];
                          next[i] = { ...rk, photoUrl: url };
                          setRankers(next);
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading || saving}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-sm font-semibold text-white"
              >
                {saving
                  ? 'Saving...'
                  : quizId
                  ? `Update Quiz (${quizQuestions.length} MCQs)`
                  : `Save Quiz (${quizQuestions.length} MCQs)`}
              </button>
              {quizId && (
                <button
                  type="button"
                  onClick={resetQuizForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-6 space-y-3">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-white">{q.title}</div>
                  <div className="text-xs text-slate-400">
                    {q.category} · {q.questions.length} MCQs
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuizId(q.id);
                      setQuizTitle(q.title);
                      setQuizTitleHi(q.titleHi || '');
                      setQuizCategory(q.category);
                      setQuizDuration(q.durationMinutes);
                      setQuizExtUrl(q.externalUrl || '');
                      setQuizQuestions(q.questions || []);
                      resetQuestionDraft();
                      if (q.topRankers?.length) setRankers(q.topRankers);
                    }}
                    className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(() => deleteQuiz(q.id), 'Quiz')}
                    className="p-2 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTICES TAB */}
      {tab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveNotice}
            className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">
              {noticeId ? 'Edit Notice' : 'Upload Important Notice (Image & PDF)'}
            </h2>
            <input type="text" required value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="Notice Title (English)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <input type="text" value={noticeTitleHi} onChange={(e) => setNoticeTitleHi(e.target.value)} placeholder="Notice Title (Hindi)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" required value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
              <input type="text" required value={noticeCategory} onChange={(e) => setNoticeCategory(e.target.value)} placeholder="Category" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            </div>
            <textarea required minLength={10} rows={3} value={noticeSummary} onChange={(e) => setNoticeSummary(e.target.value)} placeholder="Notice summary & instructions..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <input type="url" value={noticeExtUrl} onChange={(e) => setNoticeExtUrl(e.target.value)} placeholder="Official External Link (https://...)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer hover:border-purple-400">
                <Upload className="w-4 h-4" />
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0], 'images', setNoticeImageUrl)} />
              </label>
              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer hover:border-purple-400">
                <Upload className="w-4 h-4" />
                Upload PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0], 'pdfs', setNoticePdfUrl)} />
              </label>
            </div>

            <button type="submit" disabled={uploading || saving} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm font-semibold text-white">
              {saving ? 'Saving...' : noticeId ? 'Update Notice' : 'Publish Notice'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">{n.title}</div>
                  <div className="text-xs text-slate-400">{n.category} · {n.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNoticeId(n.id);
                      setNoticeTitle(n.title);
                      setNoticeTitleHi(n.titleHi || '');
                      setNoticeDate(n.date);
                      setNoticeCategory(n.category);
                      setNoticeSummary(n.summary);
                      setNoticeImageUrl(n.imageUrl || '');
                      setNoticePdfUrl(n.pdfUrl || '');
                      setNoticeExtUrl(n.externalUrl || '');
                    }}
                    className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteItem(() => deleteNotice(n.id), 'Notice')} className="p-2 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COLLEGES TAB */}
      {tab === 'colleges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveCollege}
            className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">
              {colId ? 'Edit College' : 'Add College (Image & Brochure PDF)'}
            </h2>
            <input type="text" required value={colName} onChange={(e) => setColName(e.target.value)} placeholder="College Name" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <input type="text" value={colNameHi} onChange={(e) => setColNameHi(e.target.value)} placeholder="College Name (Hindi)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" required value={colLocation} onChange={(e) => setColLocation(e.target.value)} placeholder="Location (City, State)" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
              <input type="text" required value={colStream} onChange={(e) => setColStream(e.target.value)} placeholder="Stream" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={colFees} onChange={(e) => setColFees(e.target.value)} placeholder="Fees (e.g. ₹1.2L/yr)" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
              <input type="text" value={colExams} onChange={(e) => setColExams(e.target.value)} placeholder="Exams Accepted" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            </div>
            <textarea required minLength={10} rows={3} value={colDetails} onChange={(e) => setColDetails(e.target.value)} placeholder="College overview & highlights..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <input type="url" value={colExtUrl} onChange={(e) => setColExtUrl(e.target.value)} placeholder="Official Website URL" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer hover:border-pink-400">
                <Upload className="w-4 h-4" />
                Campus Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0], 'images', setColImageUrl)} />
              </label>
              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer hover:border-pink-400">
                <Upload className="w-4 h-4" />
                Brochure PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0], 'pdfs', setColPdfUrl)} />
              </label>
            </div>

            <button type="submit" disabled={uploading || saving} className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-sm font-semibold text-white">
              {saving ? 'Saving...' : colId ? 'Update College' : 'Publish College'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            {colleges.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.location} · {c.stream}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setColId(c.id);
                      setColName(c.name);
                      setColNameHi(c.nameHi || '');
                      setColLocation(c.location);
                      setColStream(c.stream);
                      setColDetails(c.details);
                      setColFees(c.fees || '');
                      setColExams(c.examsAccepted || '');
                      setColImageUrl(c.imageUrl || '');
                      setColPdfUrl(c.pdfUrl || '');
                      setColExtUrl(c.externalUrl || '');
                    }}
                    className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteItem(() => deleteCollege(c.id), 'College')} className="p-2 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEWS TAB */}
      {tab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveNews}
            className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">
              {newsId ? 'Edit News Article' : 'Publish News Article'}
            </h2>
            <input type="text" required minLength={5} value={newsHeadline} onChange={(e) => setNewsHeadline(e.target.value)} placeholder="Headline (English)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <input type="text" value={newsHeadlineHi} onChange={(e) => setNewsHeadlineHi(e.target.value)} placeholder="Headline (Hindi)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value as NewsCategory)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="Exam">Exam</option>
                <option value="Result">Result</option>
                <option value="Admission">Admission</option>
                <option value="Job">Job</option>
                <option value="Scholarship">Scholarship</option>
              </select>
              <input type="date" required value={newsDate} onChange={(e) => setNewsDate(e.target.value)} className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white" />
              <input type="text" required value={newsAuthor} onChange={(e) => setNewsAuthor(e.target.value)} placeholder="Author" className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white" />
            </div>
            <input type="text" required minLength={10} value={newsExcerpt} onChange={(e) => setNewsExcerpt(e.target.value)} placeholder="Short excerpt" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <textarea required minLength={40} rows={5} value={newsContent} onChange={(e) => setNewsContent(e.target.value)} placeholder="Full original article body (minimum 40 characters)..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white" />
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer hover:border-indigo-400">
              <Upload className="w-4 h-4" />
              Upload Cover Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0], 'images', setNewsImageUrl)} />
            </label>
            <button type="submit" disabled={uploading || saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white">
              {saving ? 'Saving...' : newsId ? 'Update Article' : 'Publish Article'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {news.map((art) => (
              <div key={art.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white line-clamp-1">{art.headline}</div>
                  <div className="text-xs text-slate-400">{art.category} · {art.date}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNewsId(art.id);
                      setNewsHeadline(art.headline);
                      setNewsHeadlineHi(art.headlineHi || '');
                      setNewsCategory(art.category);
                      setNewsDate(art.date);
                      setNewsAuthor(art.author);
                      setNewsExcerpt(art.excerpt);
                      setNewsContent(art.content);
                      setNewsImageUrl(art.imageUrl || '');
                    }}
                    className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteItem(() => deleteNews(art.id), 'Article')} className="p-2 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTACT MESSAGES TAB */}
      {tab === 'messages' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-400" />
            Contact Us Submissions
          </h2>
          {!isAdminUser ? (
            <p className="text-sm text-slate-400">
              Sign in with a whitelisted Admin Google account ({ADMIN_EMAIL}) to read private Contact Us inquiries.
            </p>
          ) : contactMessages.length === 0 ? (
            <p className="text-sm text-slate-400">No contact inquiries submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-white">{m.name} ({m.email})</span>
                    <span>{m.subject}</span>
                  </div>
                  <p className="text-sm text-slate-300">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FIRESTORE ADMIN WHITELIST TAB (PRIMARY OWNER ONLY) */}
      {tab === 'whitelist' && isPrimaryOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleAddWhitelist}
            className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Authorize Admin Email
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only verified Google accounts listed as active in Firestore&apos;s <span className="text-slate-200">admin_whitelist</span> collection can open this Admin Panel.
            </p>
            <input
              type="email"
              required
              value={newWhitelistEmail}
              onChange={(e) => setNewWhitelistEmail(e.target.value)}
              placeholder="colleague@gmail.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <select
              value={newWhitelistRole}
              onChange={(e) => setNewWhitelistRole(e.target.value as 'editor' | 'owner')}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
            >
              <option value="editor">Editor (Quiz, Notice, College, News)</option>
              <option value="owner">Co-Owner</option>
            </select>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white"
            >
              Add Email to Whitelist
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Whitelisted Admin Accounts ({adminWhitelist.length})
            </h2>
            {adminWhitelist.length === 0 ? (
              <p className="text-sm text-slate-400">Loading whitelist entries...</p>
            ) : (
              <div className="space-y-2.5">
                {adminWhitelist.map((entry) => {
                  const isOwnerEmail = entry.email.toLowerCase() === ADMIN_EMAIL;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{entry.email}</div>
                        <div className="text-xs text-slate-400">
                          Role: {entry.role} · Status:{' '}
                          <span className={entry.active ? 'text-emerald-400' : 'text-amber-400'}>
                            {entry.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      {!isOwnerEmail ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await toggleAdminWhitelistActive(entry);
                                notify(`Updated ${entry.email} status.`);
                              } catch (err) {
                                notifyError(err);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 hover:border-sky-400"
                          >
                            {entry.active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(() => removeAdminWhitelistEmail(entry.id).then(() => ({ remoteSaved: true })), entry.email)}
                            className="p-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-amber-300">Primary Owner</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
