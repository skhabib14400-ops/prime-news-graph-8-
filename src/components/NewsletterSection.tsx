import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const NewsletterSection: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot spam check: bots automatically fill hidden input
    if (honeypot) {
      return;
    }

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please provide a valid email address.');
      return;
    }

    try {
      setStatus('loading');
      const res = await api.subscribeNewsletter(email);
      if (res.success) {
        setStatus('success');
        setMessage(res.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(res.message || 'Subscription failed. Please try again.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Connection error. Please try again.');
    }
  };

  return (
    <section className="rounded-xl bg-gradient-to-r from-[#101D35] to-[#1E293B] p-8 text-white shadow-md my-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#246BFD]/20 text-[#246BFD] mb-4">
          <Mail className="h-6 w-6" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
          {t('newsletter_title')}
        </h3>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t('newsletter_desc')}
        </p>

        {/* Subscription Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {/* Honeypot anti-spam input */}
          <input
            type="text"
            name="website_url"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder="your.email@example.com"
            disabled={status === 'loading'}
            className="w-full sm:w-96 rounded-lg bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-[#246BFD] focus:outline-none focus:ring-1 focus:ring-[#246BFD]"
            required
          />

          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#246BFD] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#246BFD] transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{t('subscribe_btn')}</span>
            )}
          </button>
        </form>

        {/* Feedback Message */}
        {status === 'success' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-rose-400">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </section>
  );
};
