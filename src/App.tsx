import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { NoticesPage } from './pages/NoticesPage';
import { CollegesPage } from './pages/CollegesPage';
import { NewsPage } from './pages/NewsPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { LegalPages } from './pages/LegalPages';

const AppShell: React.FC = () => {
  const { route, navigate, lang } = useApp();

  const renderPage = () => {
    switch (route) {
      case 'home':
        return <HomePage />;
      case 'quiz':
        return <QuizPage />;
      case 'notices':
        return <NoticesPage />;
      case 'colleges':
        return <CollegesPage />;
      case 'news':
      case 'article':
        return <NewsPage />;
      case 'auth':
        return <AuthPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'admin':
        return <AdminPage />;
      case 'about':
      case 'contact':
      case 'privacy-policy':
      case 'terms':
      case 'disclaimer':
      case 'dmca':
        return <LegalPages page={route} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B19] text-slate-100">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CookieBanner onNavigate={(r) => navigate(r)} lang={lang} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
