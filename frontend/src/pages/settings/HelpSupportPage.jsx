import React, { useEffect, useState } from 'react';
import { ChevronLeft, Headphones, MessageCircle, Mail, ChevronRight, Send, Clock3, CheckCircle2, Loader2 } from 'lucide-react';
import { supportAPI } from '../../services/api';

const faqs = [
  { q: 'How do I reset my account?', a: 'Go to Login, tap "Forgot Password?", and follow the OTP steps to set a new password.' },
  { q: 'How do I update my profile?', a: 'Open Profile → Profile Overview to edit your display name and bio.' },
  { q: 'How do payouts work?', a: 'Open Billing, Ads & Earnings from your profile. Payout features depend on your creator and monetization status.' },
  { q: 'How can I report a problem?', a: 'Use the support form below. Your request gets a ticket number and can be tracked here.' },
];

const statusLabel = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

export default function HelpSupportPage({ onBack }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTickets = async () => {
    try {
      const res = await supportAPI.mine();
      setTickets(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!subject.trim() || !message.trim()) { setError('Please enter a subject and describe your issue.'); return; }
    setSubmitting(true);
    try {
      const res = await supportAPI.create({ category, subject: subject.trim(), message: message.trim() });
      const ticketId = res.data?.data?.id;
      setSubject('');
      setMessage('');
      setSuccess(ticketId ? `Support request submitted. Ticket #${ticketId.slice(0, 8)}.` : 'Support request submitted successfully.');
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit support request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 pb-8">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} aria-label="Back"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Help & Support</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold">RA Social Support</p>
            <p className="text-sm text-gray-500 break-all">rasocialofficial@gmail.com</p>
            <p className="text-xs text-gray-400 mt-1">Submit a request and track its status below.</p>
          </div>
        </div>

        <h3 className="font-bold mb-2">Frequently Asked Questions</h3>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mb-5">
          {faqs.map((f, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-medium text-sm">{f.q}</span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-gray-500">{f.a}</p>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4"><MessageCircle className="w-5 h-5 text-pink-500" /><h3 className="font-bold">Contact Support</h3></div>
          {error && <div className="mb-3 rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          {success && <div className="mb-3 rounded-xl bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}
          <form onSubmit={submit} className="space-y-3">
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white">
              <option>General</option><option>Account</option><option>Payment</option><option>Creator / Monetization</option><option>Technical Issue</option><option>Safety / Report</option><option>Other</option>
            </select>
            <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={160} placeholder="Subject" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-purple-400" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={5000} rows={6} placeholder="Describe your issue..." className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm resize-none focus:outline-none focus:border-purple-400" />
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Support Request'}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between mb-2"><h3 className="font-bold">My Support Requests</h3><span className="text-xs text-gray-400">{tickets.length} total</span></div>
        <div className="space-y-3">
          {loading ? <div className="bg-white rounded-2xl p-5 text-center text-sm text-gray-400">Loading...</div> : tickets.length === 0 ? <div className="bg-white rounded-2xl p-5 text-center text-sm text-gray-400">No support requests yet.</div> : tickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-blue-500" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-sm truncate">{ticket.subject}</p><span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">{statusLabel[ticket.status] || ticket.status}</span></div>
                  <p className="text-xs text-gray-400 mt-1">#{ticket.id.slice(0, 8)} · {ticket.category} · {new Date(ticket.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ticket.message}</p>
                  {ticket.adminReply && <div className="mt-3 rounded-xl bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Support reply</p><p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{ticket.adminReply}</p></div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <Clock3 className="w-5 h-5 text-purple-500" />
          <p className="text-xs text-gray-500">Support requests are handled by the RA Social admin team. Replies are sent to your registered email.</p>
        </div>
      </div>
    </div>
  );
}
