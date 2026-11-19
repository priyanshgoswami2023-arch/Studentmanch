import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  emailToWhitelistId,
  getDocsFromServer,
  getDownloadURL,
  handleFirestoreError,
  OperationType,
  ref,
  signOut,
  storage,
  uploadBytes,
} from '../lib/firebase';
import { SEED_NEWS } from '../data/seedNews';
import { SEED_COLLEGES, SEED_NOTICES, SEED_QUIZZES } from '../data/seedCatalog';
import {
  AdminWhitelistEntry,
  BookmarkItem,
  CollegeItem,
  ContactMessage,
  Language,
  LeaderboardEntry,
  NewsArticle,
  NoticeItem,
  PageRoute,
  QuizAttempt,
  QuizItem,
  UserProfile,
} from '../types';

interface AppContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  route: PageRoute;
  selectedArticleSlug: string | null;
  navigate: (route: PageRoute, articleSlug?: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  isAdminUser: boolean;
  isPrimaryOwner: boolean;
  whitelistChecked: boolean;
  adminWhitelist: AdminWhitelistEntry[];
  quizzes: QuizItem[];
  notices: NoticeItem[];
  colleges: CollegeItem[];
  news: NewsArticle[];
  attempts: QuizAttempt[];
  bookmarks: BookmarkItem[];
  leaderboards: LeaderboardEntry[];
  contactMessages: ContactMessage[];
  saveQuizAttempt: (quiz: QuizItem, score: number) => Promise<void>;
  toggleBookmark: (item: { id: string; type: 'news' | 'notice' | 'college' | 'quiz'; title: string }) => Promise<void>;
  submitContactForm: (data: { name: string; email: string; subject: string; message: string }) => Promise<void>;
  saveQuiz: (quiz: QuizItem) => Promise<{ remoteSaved: boolean }>;
  deleteQuiz: (id: string) => Promise<{ remoteSaved: boolean }>;
  saveNotice: (notice: NoticeItem) => Promise<{ remoteSaved: boolean }>;
  deleteNotice: (id: string) => Promise<{ remoteSaved: boolean }>;
  saveCollege: (college: CollegeItem) => Promise<{ remoteSaved: boolean }>;
  deleteCollege: (id: string) => Promise<{ remoteSaved: boolean }>;
  saveNews: (article: NewsArticle) => Promise<{ remoteSaved: boolean }>;
  deleteNews: (id: string) => Promise<{ remoteSaved: boolean }>;
  addAdminWhitelistEmail: (email: string, role?: 'owner' | 'editor') => Promise<void>;
  toggleAdminWhitelistActive: (entry: AdminWhitelistEntry) => Promise<void>;
  removeAdminWhitelistEmail: (id: string) => Promise<void>;
  uploadAssetFile: (file: File, folder: 'images' | 'pdfs') => Promise<string>;
  refreshCatalog: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

type CatalogKind = 'quiz' | 'notice' | 'college' | 'news';

function mergeCatalog<T extends { id: string }>(
  seeds: T[],
  remote: T[],
  tombstones: Set<string>,
  kind: CatalogKind
): T[] {
  const isDeleted = (id: string) => tombstones.has(`${kind}:${id}`) || tombstones.has(id);
  const map = new Map<string, T>();
  for (const s of seeds) {
    if (!isDeleted(s.id)) map.set(s.id, s);
  }
  for (const r of remote) {
    if (!isDeleted(r.id)) map.set(r.id, r);
  }
  return Array.from(map.values());
}

async function compressImageToDataUrl(file: File): Promise<string> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  return await new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const renderAt = (maxDim: number, quality: number): string => {
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const width = Math.max(1, Math.round((img.width || maxDim) * scale));
          const height = Math.max(1, Math.round((img.height || maxDim) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', quality);
        };

        let result = renderAt(900, 0.72);
        if (result.length > 220000) {
          result = renderAt(640, 0.55);
        }
        if (result.length > 280000) {
          result = renderAt(480, 0.45);
        }
        URL.revokeObjectURL(objectUrl);
        if (result.length > 290000) {
          reject(new Error('Image is still too large after compression. Please use a smaller photo or image URL.'));
          return;
        }
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error('Failed to process image'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unsupported or corrupted image file'));
    };
    img.src = objectUrl;
  });
}

const ROUTE_PATHS: Record<PageRoute, string> = {
  home: '/',
  quiz: '/quiz',
  notices: '/notices',
  colleges: '/colleges',
  news: '/news',
  article: '/news',
  auth: '/auth',
  dashboard: '/dashboard',
  admin: '/admin',
  about: '/about',
  contact: '/contact',
  'privacy-policy': '/privacy-policy',
  terms: '/terms',
  disclaimer: '/disclaimer',
  dmca: '/dmca',
};

function parseInitialRoute(): { route: PageRoute; slug: string | null } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/news/')) {
    return { route: 'article', slug: path.replace('/news/', '') };
  }
  const match = (Object.entries(ROUTE_PATHS) as [PageRoute, string][]).find(
    ([r, p]) => r !== 'article' && p === path
  );
  return { route: match ? match[0] : 'home', slug: null };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = parseInitialRoute();
  const [lang, setLang] = useState<Language>('en');
  const [route, setRoute] = useState<PageRoute>(initial.route);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(initial.slug);
  const [searchQuery, setSearchQuery] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [remoteQuizzes, setRemoteQuizzes] = useState<QuizItem[]>([]);
  const [remoteNotices, setRemoteNotices] = useState<NoticeItem[]>([]);
  const [remoteColleges, setRemoteColleges] = useState<CollegeItem[]>([]);
  const [remoteNews, setRemoteNews] = useState<NewsArticle[]>([]);
  const [tombstones, setTombstones] = useState<Set<string>>(new Set());

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [adminWhitelist, setAdminWhitelist] = useState<AdminWhitelistEntry[]>([]);
  const [isWhitelistedAdmin, setIsWhitelistedAdmin] = useState(false);
  const [whitelistChecked, setWhitelistChecked] = useState(false);

  const isPrimaryOwner = Boolean(
    user && user.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified
  );
  const isAdminUser = Boolean(
    user && user.emailVerified && (isWhitelistedAdmin || isPrimaryOwner)
  );

  const navigate = (nextRoute: PageRoute, articleSlug: string | null = null) => {
    setRoute(nextRoute);
    setSelectedArticleSlug(articleSlug);
    const targetUrl =
      nextRoute === 'article' && articleSlug ? `/news/${articleSlug}` : ROUTE_PATHS[nextRoute];
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPop = () => {
      const parsed = parseInitialRoute();
      setRoute(parsed.route);
      setSelectedArticleSlug(parsed.slug);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Auth state listener + automatic user profile sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const displayName =
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'Student';
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: displayName.slice(0, 120),
              stream: 'General Studies',
              photoUrl: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            if (firebaseUser.email) {
              await setDoc(doc(db, 'users', firebaseUser.uid, 'private', 'info'), {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            setProfile({
              uid: firebaseUser.uid,
              displayName,
              stream: 'General Studies',
              photoUrl: firebaseUser.photoURL || '',
              email: firebaseUser.email || undefined,
              emailVerified: firebaseUser.emailVerified,
            });
          } else {
            const d = snap.data();
            setProfile({
              uid: firebaseUser.uid,
              displayName: d.displayName || firebaseUser.displayName || 'Student',
              stream: d.stream || 'General Studies',
              photoUrl: d.photoUrl || firebaseUser.photoURL || '',
              email: firebaseUser.email || undefined,
              emailVerified: firebaseUser.emailVerified,
            });
          }
        } catch (err) {
          console.warn('Profile sync warning:', err);
          setProfile({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
            photoUrl: firebaseUser.photoURL || '',
            email: firebaseUser.email || undefined,
            emailVerified: firebaseUser.emailVerified,
          });
        }
      } else {
        setProfile(null);
        setAttempts([]);
        setBookmarks([]);
        setContactMessages([]);
        setAdminWhitelist([]);
        setIsWhitelistedAdmin(false);
        setWhitelistChecked(true);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const fetchCollectionFromServer = async (colName: string) => {
    const colRef = collection(db, colName);
    try {
      return await getDocsFromServer(colRef);
    } catch {
      return await getDocs(colRef);
    }
  };

  const refreshCatalog = async () => {
    try {
      const [qSnap, nSnap, cSnap, newsSnap, tombSnap, lbSnap] = await Promise.all([
        fetchCollectionFromServer('quizzes'),
        fetchCollectionFromServer('notices'),
        fetchCollectionFromServer('colleges'),
        fetchCollectionFromServer('news'),
        fetchCollectionFromServer('catalog_tombstones'),
        fetchCollectionFromServer('leaderboards'),
      ]);
      setRemoteQuizzes(qSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuizItem, 'id'>) })));
      setRemoteNotices(nSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NoticeItem, 'id'>) })));
      setRemoteColleges(cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CollegeItem, 'id'>) })));
      setRemoteNews(newsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsArticle, 'id'>) })));
      const deleted = new Set<string>();
      for (const d of tombSnap.docs) {
        const data = d.data() as { id?: string; kind?: string };
        if (data?.kind) deleted.add(`${data.kind}:${d.id}`);
        deleted.add(d.id);
      }
      setTombstones(deleted);
      setLeaderboards(lbSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LeaderboardEntry, 'id'>) })));
    } catch (err) {
      console.warn('Catalog server refresh warning:', err);
    }
  };

  // Public content real-time listeners + server sync on focus/online
  useEffect(() => {
    const unsubQuizzes = onSnapshot(
      collection(db, 'quizzes'),
      (snap) => {
        setRemoteQuizzes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuizItem, 'id'>) })));
      },
      (err) => console.warn('Quizzes listener:', err.message)
    );
    const unsubNotices = onSnapshot(
      collection(db, 'notices'),
      (snap) => {
        setRemoteNotices(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NoticeItem, 'id'>) })));
      },
      (err) => console.warn('Notices listener:', err.message)
    );
    const unsubColleges = onSnapshot(
      collection(db, 'colleges'),
      (snap) => {
        setRemoteColleges(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CollegeItem, 'id'>) })));
      },
      (err) => console.warn('Colleges listener:', err.message)
    );
    const unsubNews = onSnapshot(
      collection(db, 'news'),
      (snap) => {
        setRemoteNews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsArticle, 'id'>) })));
      },
      (err) => console.warn('News listener:', err.message)
    );
    const unsubTombstones = onSnapshot(
      collection(db, 'catalog_tombstones'),
      (snap) => {
        const deleted = new Set<string>();
        for (const d of snap.docs) {
          const data = d.data() as { id?: string; kind?: string };
          if (data?.kind) deleted.add(`${data.kind}:${d.id}`);
          deleted.add(d.id);
        }
        setTombstones(deleted);
      },
      (err) => console.warn('Tombstones listener:', err.message)
    );
    const unsubLB = onSnapshot(
      collection(db, 'leaderboards'),
      (snap) => {
        setLeaderboards(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LeaderboardEntry, 'id'>) })));
      },
      (err) => console.warn('Leaderboards listener:', err.message)
    );

    refreshCatalog();

    const onFocusOrOnline = () => {
      refreshCatalog();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCatalog();
      }
    };
    window.addEventListener('focus', onFocusOrOnline);
    window.addEventListener('online', onFocusOrOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsubQuizzes();
      unsubNotices();
      unsubColleges();
      unsubNews();
      unsubTombstones();
      unsubLB();
      window.removeEventListener('focus', onFocusOrOnline);
      window.removeEventListener('online', onFocusOrOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Authenticated user-scoped listeners
  useEffect(() => {
    if (!authReady || !user) return;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            uid: user.uid,
            displayName: d.displayName || user.displayName || 'Student',
            stream: d.stream || 'General Studies',
            photoUrl: d.photoUrl || user.photoURL || '',
            email: user.email || undefined,
            emailVerified: user.emailVerified,
          });
        }
      },
      (error) => console.warn('Profile listener:', error.message)
    );

    const qAttempts = query(collection(db, 'quiz_attempts'), where('userId', '==', user.uid));
    const unsubAttempts = onSnapshot(
      qAttempts,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            quizId: data.quizId,
            quizTitle: data.quizTitle,
            score: data.score,
            totalQuestions: data.totalQuestions,
            accuracy: data.accuracy,
            completedAt:
              typeof data.completedAt?.toDate === 'function'
                ? data.completedAt.toDate().toISOString()
                : new Date().toISOString(),
          } as QuizAttempt;
        });
        setAttempts(rows.sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'quiz_attempts')
    );

    const qBookmarks = query(collection(db, 'bookmarks'), where('userId', '==', user.uid));
    const unsubBookmarks = onSnapshot(
      qBookmarks,
      (snap) => {
        setBookmarks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BookmarkItem, 'id'>) })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'bookmarks')
    );

    let unsubWhitelistSelf = () => {};
    if (user.email && user.emailVerified) {
      const normalizedEmail = user.email.trim().toLowerCase();
      const entryId = emailToWhitelistId(normalizedEmail);
      const wlRef = doc(db, 'admin_whitelist', entryId);
      unsubWhitelistSelf = onSnapshot(
        wlRef,
        async (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            const allowed =
              d.active === true &&
              String(d.email || '').toLowerCase() === normalizedEmail;
            setIsWhitelistedAdmin(allowed);
            setWhitelistChecked(true);
          } else if (normalizedEmail === ADMIN_EMAIL) {
            try {
              await setDoc(wlRef, {
                id: entryId,
                email: ADMIN_EMAIL,
                role: 'owner',
                active: true,
                addedBy: ADMIN_EMAIL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              setIsWhitelistedAdmin(true);
            } catch (err) {
              console.warn('Owner whitelist auto-seed:', err);
              setIsWhitelistedAdmin(true);
            } finally {
              setWhitelistChecked(true);
            }
          } else {
            setIsWhitelistedAdmin(false);
            setWhitelistChecked(true);
          }
        },
        () => {
          setIsWhitelistedAdmin(false);
          setWhitelistChecked(true);
        }
      );
    } else {
      setIsWhitelistedAdmin(false);
      setWhitelistChecked(true);
    }

    let unsubMessages = () => {};
    let unsubWhitelistAll = () => {};
    if (isPrimaryOwner) {
      unsubMessages = onSnapshot(
        collection(db, 'contact_messages'),
        (snap) => {
          setContactMessages(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ContactMessage, 'id'>),
            }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'contact_messages')
      );
      unsubWhitelistAll = onSnapshot(
        collection(db, 'admin_whitelist'),
        (snap) => {
          setAdminWhitelist(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<AdminWhitelistEntry, 'id'>),
            }))
          );
        },
        (error) => console.warn('Admin whitelist listener:', error.message)
      );
    }

    return () => {
      unsubProfile();
      unsubAttempts();
      unsubBookmarks();
      unsubWhitelistSelf();
      unsubMessages();
      unsubWhitelistAll();
    };
  }, [authReady, user, isPrimaryOwner]);

  const quizzes = mergeCatalog(SEED_QUIZZES, remoteQuizzes, tombstones, 'quiz');
  const notices = mergeCatalog(SEED_NOTICES, remoteNotices, tombstones, 'notice').sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const colleges = mergeCatalog(SEED_COLLEGES, remoteColleges, tombstones, 'college');
  const news = mergeCatalog(SEED_NEWS, remoteNews, tombstones, 'news').sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const saveQuizAttempt = async (quiz: QuizItem, score: number) => {
    if (!user) return;
    const totalQuestions = quiz.questions.length;
    const accuracy = Math.round((score / Math.max(1, totalQuestions)) * 100);
    const attemptId = `att_${user.uid.slice(0, 8)}_${Date.now()}`;
    const entryId = `lb_${quiz.id.slice(0, 12)}_${user.uid.slice(0, 12)}`;
    const displayName = (profile?.displayName || user.displayName || 'Student').slice(0, 120);
    const photoUrl = profile?.photoUrl || user.photoURL || '/assets/avatars/ranker_1.svg';

    try {
      await setDoc(doc(db, 'quiz_attempts', attemptId), {
        id: attemptId,
        userId: user.uid,
        quizId: quiz.id,
        quizTitle: quiz.title.slice(0, 200),
        score,
        totalQuestions,
        accuracy,
        completedAt: serverTimestamp(),
      });

      const lbRef = doc(db, 'leaderboards', entryId);
      const lbSnap = await getDoc(lbRef);
      if (lbSnap.exists()) {
        const prevScore = Number(lbSnap.data()?.score ?? 0);
        if (score >= prevScore) {
          await updateDoc(lbRef, {
            name: displayName,
            photoUrl,
            score,
            totalQuestions,
          });
        }
      } else {
        await setDoc(lbRef, {
          id: entryId,
          quizId: quiz.id,
          userId: user.uid,
          name: displayName,
          photoUrl,
          score,
          totalQuestions,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'quiz_attempts');
    }
  };

  const toggleBookmark = async (item: {
    id: string;
    type: 'news' | 'notice' | 'college' | 'quiz';
    title: string;
  }) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const existing = bookmarks.find((b) => b.itemId === item.id && b.itemType === item.type);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'bookmarks', existing.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bookmarks/${existing.id}`);
      }
      return;
    }
    const bmId = `bm_${user.uid.slice(0, 8)}_${Date.now()}`;
    try {
      await setDoc(doc(db, 'bookmarks', bmId), {
        id: bmId,
        userId: user.uid,
        itemId: item.id,
        itemType: item.type,
        title: item.title.slice(0, 240),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bookmarks/${bmId}`);
    }
  };

  const submitContactForm = async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'contact_messages', msgId), {
        id: msgId,
        name: data.name.trim().slice(0, 120),
        email: data.email.trim().slice(0, 254),
        subject: data.subject.trim().slice(0, 200),
        message: data.message.trim().slice(0, 3000),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `contact_messages/${msgId}`);
    }
  };

  const uploadAssetFile = async (file: File, folder: 'images' | 'pdfs'): Promise<string> => {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    try {
      const storageRef = ref(storage, `studentmanch/${folder}/${safeName}`);
      const uploadPromise = uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 7000)
      );
      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch {
      if (folder === 'images') {
        return await compressImageToDataUrl(file);
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read uploaded PDF file'));
        reader.readAsDataURL(file);
      });
      if (dataUrl.length > 480000) {
        throw new Error(
          'PDF file is too large (>350KB) for direct database sync. Please compress the PDF or paste an official PDF link instead.'
        );
      }
      return dataUrl;
    }
  };

  const assertAdmin = () => {
    if (!isAdminUser) {
      throw new Error('Unauthorized: Only verified owner account can edit Student Manch.');
    }
  };

  const clearTombstoneIfAny = async (cleanId: string) => {
    try {
      await deleteDoc(doc(db, 'catalog_tombstones', cleanId));
    } catch {
      // ignore if tombstone didn't exist
    }
  };

  const writeTombstone = async (rawId: string, kind: CatalogKind) => {
    const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '-');
    await setDoc(doc(db, 'catalog_tombstones', cleanId), {
      id: cleanId,
      kind,
      deletedAt: serverTimestamp(),
    });
  };

  const saveQuiz = async (quiz: QuizItem): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    const cleanId = quiz.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const docRef = doc(db, 'quizzes', cleanId);
    const safeRankers = (quiz.topRankers || []).slice(0, 10).map((r) => ({
      ...r,
      name: String(r.name || '').slice(0, 120),
      photoUrl:
        r.photoUrl && r.photoUrl.length <= 120000
          ? r.photoUrl
          : '/assets/avatars/ranker_1.svg',
    }));
    const baseData = {
      id: cleanId,
      title: quiz.title.slice(0, 200),
      titleHi: (quiz.titleHi || '').slice(0, 200),
      category: quiz.category.slice(0, 60),
      durationMinutes: Number(quiz.durationMinutes) || 10,
      externalUrl: (quiz.externalUrl || '').slice(0, 1000),
      questions: quiz.questions.slice(0, 50),
      topRankers: safeRankers,
    };
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, { ...baseData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await clearTombstoneIfAny(cleanId);
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `quizzes/${cleanId}`);
    }
  };

  const deleteQuiz = async (id: string): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    try {
      await deleteDoc(doc(db, 'quizzes', id));
      await writeTombstone(id, 'quiz');
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quizzes/${id}`);
    }
  };

  const saveNotice = async (notice: NoticeItem): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    if ((notice.imageUrl || '').length > 295000) {
      throw new Error('Notice image is too large to sync. Please re-upload a compressed image or use an image URL.');
    }
    if ((notice.pdfUrl || '').length > 495000) {
      throw new Error('Notice PDF is too large to sync. Please upload a PDF under 350KB or use an external link.');
    }
    const cleanId = notice.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const docRef = doc(db, 'notices', cleanId);
    const baseData = {
      id: cleanId,
      title: notice.title.slice(0, 240),
      titleHi: (notice.titleHi || '').slice(0, 240),
      date: notice.date.slice(0, 40),
      category: notice.category.slice(0, 60),
      summary: notice.summary.slice(0, 2000),
      imageUrl: notice.imageUrl || '',
      pdfUrl: notice.pdfUrl || '',
      externalUrl: (notice.externalUrl || '').slice(0, 1000),
    };
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, { ...baseData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await clearTombstoneIfAny(cleanId);
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notices/${cleanId}`);
    }
  };

  const deleteNotice = async (id: string): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    try {
      await deleteDoc(doc(db, 'notices', id));
      await writeTombstone(id, 'notice');
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notices/${id}`);
    }
  };

  const saveCollege = async (college: CollegeItem): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    if ((college.imageUrl || '').length > 295000) {
      throw new Error('Campus image is too large to sync. Please re-upload a compressed image or use an image URL.');
    }
    if ((college.pdfUrl || '').length > 495000) {
      throw new Error('Brochure PDF is too large to sync. Please upload a PDF under 350KB or use an external link.');
    }
    const cleanId = college.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const docRef = doc(db, 'colleges', cleanId);
    const baseData = {
      id: cleanId,
      name: college.name.slice(0, 200),
      nameHi: (college.nameHi || '').slice(0, 200),
      location: college.location.slice(0, 120),
      stream: college.stream.slice(0, 80),
      details: college.details.slice(0, 2500),
      detailsHi: (college.detailsHi || '').slice(0, 2500),
      fees: (college.fees || '').slice(0, 120),
      examsAccepted: (college.examsAccepted || '').slice(0, 200),
      imageUrl: college.imageUrl || '',
      pdfUrl: college.pdfUrl || '',
      externalUrl: (college.externalUrl || '').slice(0, 1000),
    };
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, { ...baseData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await clearTombstoneIfAny(cleanId);
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `colleges/${cleanId}`);
    }
  };

  const deleteCollege = async (id: string): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    try {
      await deleteDoc(doc(db, 'colleges', id));
      await writeTombstone(id, 'college');
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `colleges/${id}`);
    }
  };

  const saveNews = async (article: NewsArticle): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    if ((article.imageUrl || '').length > 295000) {
      throw new Error('Article cover image is too large to sync. Please re-upload a compressed image or use an image URL.');
    }
    const cleanId = article.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const docRef = doc(db, 'news', cleanId);
    const baseData = {
      id: cleanId,
      slug: article.slug.slice(0, 180),
      headline: article.headline.slice(0, 240),
      headlineHi: (article.headlineHi || '').slice(0, 240),
      category: article.category,
      date: article.date.slice(0, 40),
      author: article.author.slice(0, 100),
      readTime: article.readTime.slice(0, 30),
      excerpt: article.excerpt.slice(0, 600),
      content: article.content.slice(0, 15000),
      contentHi: (article.contentHi || '').slice(0, 15000),
      imageUrl: article.imageUrl || '',
      tags: (article.tags || []).slice(0, 10),
    };
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, { ...baseData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      await clearTombstoneIfAny(cleanId);
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `news/${cleanId}`);
    }
  };

  const deleteNews = async (id: string): Promise<{ remoteSaved: boolean }> => {
    assertAdmin();
    try {
      await deleteDoc(doc(db, 'news', id));
      await writeTombstone(id, 'news');
      return { remoteSaved: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `news/${id}`);
    }
  };

  const addAdminWhitelistEmail = async (email: string, role: 'owner' | 'editor' = 'editor') => {
    if (!isPrimaryOwner || !user?.email) {
      throw new Error('Only the primary owner can modify the admin whitelist.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 120) {
      throw new Error('Please enter a valid email address (max 120 characters).');
    }
    const entryId = emailToWhitelistId(cleanEmail);
    const wlRef = doc(db, 'admin_whitelist', entryId);
    try {
      const snap = await getDoc(wlRef);
      if (snap.exists()) {
        await updateDoc(wlRef, {
          role,
          active: true,
          addedBy: user.email.toLowerCase(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(wlRef, {
          id: entryId,
          email: cleanEmail,
          role,
          active: true,
          addedBy: user.email.toLowerCase(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admin_whitelist/${entryId}`);
    }
  };

  const toggleAdminWhitelistActive = async (entry: AdminWhitelistEntry) => {
    if (!isPrimaryOwner || !user?.email) {
      throw new Error('Only the primary owner can modify the admin whitelist.');
    }
    if (entry.email.toLowerCase() === ADMIN_EMAIL && entry.active) {
      throw new Error('Primary owner account cannot be deactivated from the whitelist.');
    }
    try {
      await updateDoc(doc(db, 'admin_whitelist', entry.id), {
        role: entry.role,
        active: !entry.active,
        addedBy: user.email.toLowerCase(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admin_whitelist/${entry.id}`);
    }
  };

  const removeAdminWhitelistEmail = async (id: string) => {
    if (!isPrimaryOwner) {
      throw new Error('Only the primary owner can remove whitelist entries.');
    }
    if (id === emailToWhitelistId(ADMIN_EMAIL)) {
      throw new Error('Primary owner cannot be removed from the whitelist.');
    }
    try {
      await deleteDoc(doc(db, 'admin_whitelist', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admin_whitelist/${id}`);
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate('home');
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        route,
        selectedArticleSlug,
        navigate,
        searchQuery,
        setSearchQuery,
        user,
        profile,
        authReady,
        isAdminUser,
        isPrimaryOwner,
        whitelistChecked,
        adminWhitelist,
        quizzes,
        notices,
        colleges,
        news,
        attempts,
        bookmarks,
        leaderboards,
        contactMessages,
        saveQuizAttempt,
        toggleBookmark,
        submitContactForm,
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
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
