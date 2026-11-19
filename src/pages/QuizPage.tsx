import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Medal,
  Play,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuizItem, RankerEntry } from '../types';
import { AdSlot } from '../components/AdSlot';
import { SafeImage } from '../components/SafeImage';

export const QuizPage: React.FC = () => {
  const {
    lang,
    quizzes,
    leaderboards,
    user,
    profile,
    saveQuizAttempt,
    navigate,
    searchQuery,
  } = useApp();

  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = searchQuery.trim().toLowerCase();
  const filteredQuizzes = q
    ? quizzes.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.titleHi || '').toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
    : quizzes;

  useEffect(() => {
    if (!activeQuiz || finished) return;
    if (secondsLeft <= 0) {
      handleFinishQuiz();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuiz, finished, secondsLeft]);

  const startQuiz = (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setCurrentIdx(0);
    setAnswers({});
    setSecondsLeft((quiz.durationMinutes || 10) * 60);
    setFinished(false);
  };

  const calculateScore = (quiz: QuizItem, selected: Record<number, number>) => {
    return quiz.questions.reduce((acc, ques, idx) => {
      return acc + (selected[idx] === ques.correctIndex ? 1 : 0);
    }, 0);
  };

  const handleFinishQuiz = async () => {
    if (!activeQuiz || finished) return;
    setFinished(true);
    const score = calculateScore(activeQuiz, answers);
    if (user) {
      setSaving(true);
      try {
        await saveQuizAttempt(activeQuiz, score);
      } catch (e) {
        console.warn(e);
      } finally {
        setSaving(false);
      }
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Combine admin-curated rankers + Firestore leaderboard entries for this quiz
  const getCombinedPodium = (quiz: QuizItem, currentScore?: number): RankerEntry[] => {
    const fromSeed: RankerEntry[] = (quiz.topRankers || []).map((r) => ({
      name: r.name,
      photoUrl: r.photoUrl || '/assets/avatars/ranker_1.svg',
      score: r.score,
      totalQuestions: r.totalQuestions || quiz.questions.length,
    }));

    const fromDb: RankerEntry[] = leaderboards
      .filter((lb) => lb.quizId === quiz.id)
      .map((lb) => ({
        name: lb.name,
        photoUrl: lb.photoUrl || '/assets/avatars/ranker_1.svg',
        score: lb.score,
        totalQuestions: lb.totalQuestions,
      }));

    const merged = [...fromSeed, ...fromDb];

    if (typeof currentScore === 'number' && !user) {
      merged.push({
        name: profile?.displayName || 'You (Guest)',
        photoUrl: '/assets/avatars/ranker_2.svg',
        score: currentScore,
        totalQuestions: quiz.questions.length,
      });
    }

    // Deduplicate by name keeping highest score
    const bestByName = new Map<string, RankerEntry>();
    for (const entry of merged) {
      const prev = bestByName.get(entry.name);
      if (!prev || entry.score > prev.score) {
        bestByName.set(entry.name, entry);
      }
    }

    return Array.from(bestByName.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  };

  if (activeQuiz && finished) {
    const score = calculateScore(activeQuiz, answers);
    const total = activeQuiz.questions.length;
    const accuracy = Math.round((score / Math.max(1, total)) * 100);
    const podiumList = getCombinedPodium(activeQuiz, score);
    const rank1 = podiumList[0];
    const rank2 = podiumList[1];
    const rank3 = podiumList[2];

    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
        <button
          type="button"
          onClick={() => setActiveQuiz(null)}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'hi' ? 'सभी क्विज पर वापस जाएं' : 'Back to All Quizzes'}
        </button>

        {/* Score Summary Card */}
        <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-[#0E1633] to-slate-950 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {lang === 'hi' ? 'क्विज परिणाम' : 'Quiz Result'}:{' '}
            {lang === 'hi' && activeQuiz.titleHi ? activeQuiz.titleHi : activeQuiz.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
            <div className="px-5 py-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs text-slate-400">
                {lang === 'hi' ? 'प्राप्त अंक' : 'Your Score'}
              </div>
              <div className="font-mono-tabular text-3xl font-extrabold text-sky-400">
                {score} / {total}
              </div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs text-slate-400">
                {lang === 'hi' ? 'सटीकता' : 'Accuracy'}
              </div>
              <div className="font-mono-tabular text-3xl font-extrabold text-emerald-400">
                {accuracy}%
              </div>
            </div>
          </div>

          {!user ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('auth')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                {lang === 'hi'
                  ? 'अंक सेव करने के लिए लॉगिन / साइन अप करें'
                  : 'Log in or Sign up to save score to your Dashboard'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-emerald-400">
              {saving
                ? 'Saving your score to Firestore...'
                : lang === 'hi'
                ? 'आपका स्कोर आपके डैशबोर्ड में सेव हो गया है।'
                : 'Score saved to your Student Dashboard & Leaderboard.'}
            </p>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startQuiz(activeQuiz)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium text-white"
            >
              <RotateCcw className="w-4 h-4" />
              {lang === 'hi' ? 'पुनः प्रयास करें' : 'Retake Quiz'}
            </button>
          </div>
        </div>

        {/* Gold / Silver / Bronze Podium Leaderboard */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl font-bold text-white">
              {lang === 'hi' ? 'शीर्ष रैंकर्स लीडरबोर्ड' : 'Top 3 Podium Leaderboard'}
            </h2>
            <p className="text-sm text-slate-400">
              {lang === 'hi'
                ? 'गोल्ड (रैंक 1), सिल्वर (रैंक 2) और ब्रॉन्ज़ (रैंक 3) विजेता'
                : 'Gold (Rank 1), Silver (Rank 2) & Bronze (Rank 3) Toppers'}
            </p>
          </div>

          {/* Podium Stage: 2 - 1 - 3 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-3xl mx-auto pt-4">
            {/* Rank 2 - Silver */}
            {rank2 && (
              <div className="order-2 sm:order-1 rounded-2xl border border-slate-300/40 bg-gradient-to-b from-slate-700/30 to-slate-900/90 p-5 text-center space-y-3 sm:min-h-[210px] flex flex-col justify-end">
                <div className="mx-auto relative">
                  <SafeImage
                    src={rank2.photoUrl}
                    alt={rank2.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 mx-auto"
                  />
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-slate-200">
                    <Medal className="w-4 h-4 text-slate-300" />
                    RANK 2 · SILVER
                  </span>
                </div>
                <div className="font-display font-bold text-white text-base truncate">
                  {rank2.name}
                </div>
                <div className="font-mono-tabular text-lg font-extrabold text-slate-200">
                  {rank2.score} / {rank2.totalQuestions}
                </div>
              </div>
            )}

            {/* Rank 1 - Gold */}
            {rank1 && (
              <div className="order-1 sm:order-2 rounded-2xl border-2 border-amber-400/70 bg-gradient-to-b from-amber-500/20 via-amber-900/15 to-slate-900/95 p-6 text-center space-y-3 sm:min-h-[245px] flex flex-col justify-end shadow-[0_0_32px_rgba(251,191,36,0.22)]">
                <div className="mx-auto">
                  <Crown className="w-7 h-7 text-amber-400 mx-auto mb-1.5" />
                  <SafeImage
                    src={rank1.photoUrl}
                    alt={rank1.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 mx-auto"
                  />
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-300">
                    RANK 1 · GOLD
                  </span>
                </div>
                <div className="font-display font-bold text-white text-lg truncate">
                  {rank1.name}
                </div>
                <div className="font-mono-tabular text-2xl font-extrabold text-amber-300">
                  {rank1.score} / {rank1.totalQuestions}
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {rank3 && (
              <div className="order-3 rounded-2xl border border-amber-700/60 bg-gradient-to-b from-orange-900/25 to-slate-900/90 p-5 text-center space-y-3 sm:min-h-[190px] flex flex-col justify-end">
                <div className="mx-auto">
                  <SafeImage
                    src={rank3.photoUrl}
                    alt={rank3.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-600 mx-auto"
                  />
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-500">
                    <Medal className="w-4 h-4 text-amber-600" />
                    RANK 3 · BRONZE
                  </span>
                </div>
                <div className="font-display font-bold text-white text-base truncate">
                  {rank3.name}
                </div>
                <div className="font-mono-tabular text-lg font-extrabold text-amber-400">
                  {rank3.score} / {rank3.totalQuestions}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Detailed Answer Review */}
        <section className="space-y-4">
          <h3 className="font-display text-xl font-bold text-white">
            {lang === 'hi' ? 'उत्तर समीक्षा और व्याख्या' : 'Answer Key & Explanations'}
          </h3>
          <div className="space-y-4">
            {activeQuiz.questions.map((ques, idx) => {
              const userChoice = answers[idx];
              const isCorrect = userChoice === ques.correctIndex;
              const opts = lang === 'hi' && ques.optionsHi ? ques.optionsHi : ques.options;
              return (
                <div
                  key={ques.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-medium text-white text-sm sm:text-base">
                      {idx + 1}. {lang === 'hi' && ques.questionHi ? ques.questionHi : ques.question}
                    </h4>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-400">Your Answer: </span>
                      <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {typeof userChoice === 'number' ? opts[userChoice] : 'Not Answered'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Correct Answer: </span>
                      <span className="text-emerald-400 font-semibold">{opts[ques.correctIndex]}</span>
                    </p>
                    {(ques.explanation || ques.explanationHi) && (
                      <p className="text-slate-400 pt-1 leading-relaxed">
                        {lang === 'hi' && ques.explanationHi ? ques.explanationHi : ques.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (activeQuiz) {
    const ques = activeQuiz.questions[currentIdx];
    const opts = lang === 'hi' && ques.optionsHi ? ques.optionsHi : ques.options;
    const progressPct = Math.round(((currentIdx + 1) / activeQuiz.questions.length) * 100);

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveQuiz(null)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'hi' ? 'बाहर निकलें' : 'Exit Quiz'}
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono-tabular text-sm text-amber-300">
            <Clock className="w-4 h-4" />
            {formatTimer(secondsLeft)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {lang === 'hi' && activeQuiz.titleHi ? activeQuiz.titleHi : activeQuiz.title}
            </span>
            <span className="font-mono-tabular">
              Question {currentIdx + 1} / {activeQuiz.questions.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug">
            {currentIdx + 1}. {lang === 'hi' && ques.questionHi ? ques.questionHi : ques.question}
          </h2>

          <div className="space-y-3">
            {opts.map((opt, idx) => {
              const selected = answers[currentIdx] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [currentIdx]: idx })}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm sm:text-base transition-colors flex items-center gap-3 ${
                    selected
                      ? 'bg-indigo-600/25 border-sky-400 text-white font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-xs font-mono-tabular shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              {lang === 'hi' ? 'पिछला' : 'Previous'}
            </button>

            {currentIdx < activeQuiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white"
              >
                {lang === 'hi' ? 'अगला प्रश्न' : 'Next Question'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishQuiz}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white"
              >
                {lang === 'hi' ? 'सबमिट करें व परिणाम देखें' : 'Submit & View Result'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2 border-b border-slate-800 pb-5">
        <h1 className="font-display text-3xl font-bold text-white">
          {lang === 'hi' ? 'स्टूडेंट मंच मॉक क्विज और लीडरबोर्ड' : 'Interactive Quizzes & Topper Podium'}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
          {lang === 'hi'
            ? 'CUET, SSC, UPSC और जनरल साइंस के द्विभाषी मॉक टेस्ट हल करें, तुरंत स्कोर देखें और टॉप-3 रैंकर्स में शामिल हों।'
            : 'Test your preparation with bilingual MCQs, instant answer explanations, and Gold/Silver/Bronze topper podiums.'}
        </p>
      </div>

      <AdSlot variant="header" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredQuizzes.map((quiz) => {
          const podium = getCombinedPodium(quiz);
          return (
            <div
              key={quiz.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between gap-5 hover:border-sky-500/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-sky-400 font-semibold">{quiz.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{quiz.questions.length} Questions</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{quiz.durationMinutes} min</span>
                </div>
                <h2 className="font-display text-xl font-bold text-white">
                  {lang === 'hi' && quiz.titleHi ? quiz.titleHi : quiz.title}
                </h2>

                {/* Top 3 Preview Strip */}
                {podium.length > 0 && (
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    {podium.slice(0, 3).map((r, i) => (
                      <div key={r.name} className="flex items-center gap-2 text-xs text-slate-300">
                        <SafeImage
                          src={r.photoUrl}
                          alt={r.name}
                          className={`w-7 h-7 rounded-full object-cover border ${
                            i === 0
                              ? 'border-amber-400'
                              : i === 1
                              ? 'border-slate-300'
                              : 'border-amber-600'
                          }`}
                        />
                        <span>
                          #{i + 1} {r.name.split(' ')[0]} ({r.score}/{r.totalQuestions})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => startQuiz(quiz)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-sm font-semibold text-white transition-all shadow-lg shadow-sky-900/30"
                >
                  <Play className="w-4 h-4" />
                  {lang === 'hi' ? 'क्विज शुरू करें' : 'Start Quiz'}
                </button>

                {quiz.externalUrl && (
                  <a
                    href={quiz.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {lang === 'hi' ? 'बाहरी संदर्भ लिंक' : 'External Practice Link'}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
