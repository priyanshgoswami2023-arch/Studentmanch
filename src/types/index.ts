export type Language = 'en' | 'hi';

export type NewsCategory = 'Exam' | 'Result' | 'Admission' | 'Job' | 'Scholarship';

export type PageRoute =
  | 'home'
  | 'quiz'
  | 'notices'
  | 'colleges'
  | 'news'
  | 'article'
  | 'auth'
  | 'dashboard'
  | 'admin'
  | 'about'
  | 'contact'
  | 'privacy-policy'
  | 'terms'
  | 'disclaimer'
  | 'dmca';

export interface QuizQuestion {
  id: string;
  question: string;
  questionHi?: string;
  options: string[];
  optionsHi?: string[];
  correctIndex: number;
  explanation?: string;
  explanationHi?: string;
}

export interface RankerEntry {
  rank?: number;
  name: string;
  photoUrl?: string;
  score: number;
  totalQuestions: number;
}

export interface QuizItem {
  id: string;
  title: string;
  titleHi?: string;
  category: string;
  durationMinutes: number;
  externalUrl?: string;
  questions: QuizQuestion[];
  topRankers?: RankerEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  quizId: string;
  userId: string;
  name: string;
  photoUrl?: string;
  score: number;
  totalQuestions: number;
  createdAt?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  titleHi?: string;
  date: string;
  category: string;
  summary: string;
  imageUrl?: string;
  pdfUrl?: string;
  externalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollegeItem {
  id: string;
  name: string;
  nameHi?: string;
  location: string;
  stream: string;
  details: string;
  detailsHi?: string;
  fees?: string;
  examsAccepted?: string;
  imageUrl?: string;
  pdfUrl?: string;
  externalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  headline: string;
  headlineHi?: string;
  category: NewsCategory;
  date: string;
  author: string;
  readTime: string;
  excerpt: string;
  content: string;
  contentHi?: string;
  imageUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  stream?: string;
  photoUrl?: string;
  email?: string;
  emailVerified?: boolean;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'news' | 'notice' | 'college' | 'quiz';
  title: string;
  createdAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}

export interface AdminWhitelistEntry {
  id: string;
  email: string;
  role: 'owner' | 'editor';
  active: boolean;
  addedBy: string;
  createdAt?: string;
  updatedAt?: string;
}
