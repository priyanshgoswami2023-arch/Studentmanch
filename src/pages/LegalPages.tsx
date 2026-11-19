import React, { useState } from 'react';
import { CheckCircle2, Mail, MapPin, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageRoute } from '../types';

export const LegalPages: React.FC<{ page: PageRoute }> = ({ page }) => {
  const { submitContactForm } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitContactForm({ name, email, subject, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (page === 'about') {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">About Us — Student Manch</h1>
        <div className="space-y-4 text-slate-300 leading-relaxed text-base">
          <p>
            <strong>Student Manch (studentmanch.online)</strong> is an independent bilingual (Hindi & English) educational portal created to help school, undergraduate, and competitive-exam students across India navigate academic milestones with clarity.
          </p>
          <p>
            Across India, crucial updates regarding CUET, JEE, NEET, UPSC, SSC, board results, and government scholarships are often scattered across complex circulars. Student Manch organizes official notices with downloadable PDFs, structured college profiles, interactive MCQ quizzes, and original step-by-step guidance articles in plain Hindi and English.
          </p>
          <h2 className="font-display text-xl font-bold text-white pt-4">Our Editorial Standards</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Original, human-reviewed educational guides written specifically for Indian learners.</li>
            <li>Direct links to official government, university, and exam-authority portals so students can cross-verify every deadline.</li>
            <li>Zero clickbait headlines, zero misleading download buttons, and clear separation between editorial content and advertisements.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <h1 className="font-display text-3xl font-bold text-white">Contact Us</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Have a question about an exam notice, college brochure, quiz correction, or partnership? Reach out to the Student Manch editorial desk.
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-200">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>contact@studentmanch.online</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-200">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>support@studentmanch.online</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>Academic Editorial Desk, New Delhi, India</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <form
            onSubmit={handleContact}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4"
          >
            {submitted && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center gap-2.5 text-sm text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                Thank you! Your message has been received by the Student Manch team.
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Your Name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Subject</label>
              <input
                type="text"
                required
                minLength={2}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Notice correction / General query"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Message</label>
              <textarea
                required
                minLength={10}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (page === 'privacy-policy') {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-5 text-slate-300 leading-relaxed">
        <h1 className="font-display text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last Updated: November 2026 · Student Manch (studentmanch.online)</p>
        <p>
          At Student Manch (studentmanch.online), accessible from https://studentmanch.online, safeguarding the privacy of our student visitors is one of our highest priorities. This Privacy Policy outlines the types of information collected and how we use it.
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">1. Information We Collect</h2>
        <p>
          When you register for a Student Manch account, we collect your display name, email address, and optional academic stream via Firebase Authentication to store your quiz attempts and bookmarks. Visitors who contact us through the Contact Us form provide their name, email, and message solely so our team can respond.
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">2. Cookies and Web Beacons</h2>
        <p>
          Student Manch uses cookies to store visitor preferences (such as language selection and cookie consent) and improve user experience. You may choose to disable cookies through your individual browser options.
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">3. Google AdSense & DoubleClick DART Cookie</h2>
        <p>
          Google is a third-party vendor on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to studentmanch.online and other websites on the internet. Visitors may opt out of personalized advertising by visiting Google Ads Settings (https://adssettings.google.com) or Google’s Privacy Policy (https://policies.google.com/technologies/ads).
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">4. Children’s Privacy & DPDP Compliance</h2>
        <p>
          In accordance with applicable Indian Digital Personal Data Protection guidelines, we do not knowingly sell personal data. For data deletion or privacy requests, email contact@studentmanch.online.
        </p>
      </div>
    );
  }

  if (page === 'terms') {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-5 text-slate-300 leading-relaxed">
        <h1 className="font-display text-3xl font-bold text-white">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Effective Date: November 2026</p>
        <p>
          By accessing and using Student Manch (studentmanch.online), you accept and agree to be bound by the terms and provisions of this agreement.
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">1. Educational Use License</h2>
        <p>
          All quizzes, articles, notice summaries, and college guides published on Student Manch are provided strictly for personal, non-commercial educational reference. Republishing or scraping our original articles without written permission is prohibited.
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">2. User Accounts & Fair Play</h2>
        <p>
          Students registering accounts agree to provide accurate information and refrain from automated score manipulation on quiz leaderboards.
        </p>
        <h2 className="font-display text-xl font-bold text-white pt-2">3. External Links</h2>
        <p>
          Student Manch links to official university and exam portals (such as NTA, UPSC, SSC, and AICTE) for student convenience. We do not control external third-party websites.
        </p>
      </div>
    );
  }

  if (page === 'disclaimer') {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-5 text-slate-300 leading-relaxed">
        <h1 className="font-display text-3xl font-bold text-white">Disclaimer</h1>
        <p>
          <strong>Student Manch (studentmanch.online) is an independent private educational information portal</strong> and is NOT affiliated with, endorsed by, or officially connected to any government body, examination agency (NTA, UPSC, SSC, CBSE), or university.
        </p>
        <p>
          While our editorial team makes every effort to verify dates, syllabus details, fees, and notice summaries before publishing, examination authorities may revise schedules without prior notice. All students are strongly advised to verify final instructions, admit cards, and fee deadlines directly on the respective official government or university portal linked below each notice and college card.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-5 text-slate-300 leading-relaxed">
      <h1 className="font-display text-3xl font-bold text-white">DMCA & Copyright Policy</h1>
      <p>
        Student Manch (studentmanch.online) respects the intellectual property rights of authors, educators, publishers, and institutions. All articles and mock questions published by our team are original educational works.
      </p>
      <p>
        If you believe any content, PDF, or image on Student Manch infringes upon your copyright, please send a formal DMCA takedown notice to <strong>contact@studentmanch.online</strong> containing:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>Exact URL on studentmanch.online where the material appears.</li>
        <li>Your contact details (name, organization, email, phone).</li>
        <li>A good-faith statement of ownership or authorized representation.</li>
      </ul>
      <p>Verified requests are reviewed and resolved within 48 business hours.</p>
    </div>
  );
};
