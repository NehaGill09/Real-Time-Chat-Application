import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ArrowUp, Check, CheckCheck, CircleUserRound, LogOut, MessageCircle, Search, Send, ShieldCheck, Sparkles, Users, Wifi, WifiOff } from 'lucide-react';

type User = { id: string; username: string; email: string; avatarColor?: string; lastSeen?: string };
type ChatMessage = { id: string; senderId: string; sender: string; avatarColor?: string; recipientId: string; text: string; createdAt: string };
const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const SOCKET = import.meta.env.VITE_SOCKET_URL || API;
const palette = ['#8b5cf6', '#ec4899', '#0d9488', '#f97316', '#3b82f6', '#db2777'];
const colorFor = (name: string) => palette[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length];
const initials = (name: string) => name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
const timeLabel = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('pulse-token') || '');
  const [me, setMe] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [active, setActive] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
  };

  useEffect(() => {
    if (!token) { setMe(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const result = await api('/api/auth/me');
        if (cancelled) return;
        setMe(result.user);
        const people = await api('/api/users');
        if (!cancelled) {
          setUsers(people.users);
          setActive(current => current || people.users[0] || null);
        }
      } catch {
        localStorage.removeItem('pulse-token');
        if (!cancelled) { setToken(''); setMe(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token || !me) return;
    const socket = io(SOCKET, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); setError(''); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => { setConnected(false); setError('Realtime connection unavailable. Check that the backend is running.'); });
    socket.on('presence:snapshot', (ids: string[]) => setOnline(new Set(ids)));
    socket.on('presence:update', ({ userId, online: isOnline }: { userId: string; online: boolean }) => {
      setOnline(previous => { const next = new Set(previous); isOnline ? next.add(userId) : next.delete(userId); return next; });
    });
    socket.on('typing:update', ({ userId, typing: isTyping }: { userId: string; typing: boolean }) => {
      setTyping(previous => { const next = new Set(previous); isTyping ? next.add(userId) : next.delete(userId); return next; });
    });
    socket.on('message:new', (message: ChatMessage) => {
      if (message.senderId === me.id || message.recipientId === me.id) {
        setMessages(previous => previous.some(item => item.id === message.id) ? previous : [...previous, message]);
      }
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, me?.id]);

  useEffect(() => {
    if (!active || !token) { setMessages([]); return; }
    let cancelled = false;
    setMessages([]);
    api(`/api/messages/${active.id}`).then(result => {
      if (!cancelled) setMessages(result.messages);
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [active?.id, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const filteredUsers = useMemo(() => users.filter(user => user.username.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const activeMessages = useMemo(() => active ? messages.filter(m => (m.senderId === me?.id && m.recipientId === active.id) || (m.senderId === active.id && m.recipientId === me?.id)) : [], [messages, active?.id, me?.id]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await fetch(`${API}/api/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.message || 'Unable to sign in.');
      localStorage.setItem('pulse-token', data.token);
      setMe(data.user); setToken(data.token);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !active || !socketRef.current?.connected) return;
    socketRef.current.emit('message:send', { recipientId: active.id, text }, (result: { error?: string }) => {
      if (result?.error) setError(result.error);
      else { setDraft(''); setError(''); socketRef.current?.emit('typing:set', { recipientId: active.id, typing: false }); }
    });
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (!active || !socketRef.current) return;
    socketRef.current.emit('typing:set', { recipientId: active.id, typing: value.trim().length > 0 });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit('typing:set', { recipientId: active.id, typing: false }), 1200);
  }

  function logout() {
    socketRef.current?.disconnect();
    localStorage.removeItem('pulse-token');
    setToken(''); setMe(null); setUsers([]); setActive(null); setMessages([]); setOnline(new Set());
  }

  if (!token || !me) return (
    <main className="auth-shell">
      <div className="auth-decoration deco-one" /><div className="auth-decoration deco-two" />
      <section className="auth-card">
        <div className="brand-mark"><MessageCircle size={23} fill="currentColor" /></div>
        <p className="eyebrow">YOUR SPACE TO CONNECT</p>
        <h1>Good conversations<br /><span>start here.</span></h1>
        <p className="auth-copy">A little closer, no matter the distance. Meet your people in real time.</p>
        <div className="auth-tabs"><button className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setError(''); }}>Sign in</button><button className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setError(''); }}>Create account</button></div>
        <form className="auth-form" onSubmit={handleAuth}>
          {authMode === 'register' && <label>Display name<input autoComplete="username" required minLength={2} maxLength={24} placeholder="How should we call you?" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>}
          <label>Email address<input type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={128} placeholder="At least 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'One moment…' : authMode === 'login' ? 'Sign in to Pulse' : 'Create my account'} <ArrowUp size={17} className="arrow-right" /></button>
        </form>
        <p className="secure-note"><ShieldCheck size={14} /> Your conversations belong to you.</p>
      </section>
      <footer className="auth-footer">PULSE <span>·</span> LITTLE MOMENTS, IN REAL TIME</footer>
    </main>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small"><MessageCircle size={19} fill="currentColor" /></div><span>pulse<span className="brand-dot">.</span></span><span className="beta-tag">BETA</span></div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <div className="profile-card"><div className="avatar self-avatar" style={{ background: me.avatarColor || colorFor(me.username) }}>{initials(me.username)}</div><div className="profile-meta"><strong>{me.username}</strong><span><i className="online-dot" /> Available</span></div><button className="icon-button logout-button" title="Sign out" onClick={logout}><LogOut size={17} /></button></div>
        <div className="section-heading"><span>MESSAGES</span><span className="count-pill">{users.length}</span></div>
        <div className="search-box"><Search size={16} /><input placeholder="Find a person..." value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌘ K</kbd></div>
        <div className="contact-list">
          {filteredUsers.map(user => <button key={user.id} className={active?.id === user.id ? 'contact active' : 'contact'} onClick={() => { setActive(user); setError(''); }}>
            <div className="avatar contact-avatar" style={{ background: user.avatarColor || colorFor(user.username) }}>{initials(user.username)}<i className={online.has(user.id) ? 'presence online' : 'presence'} /></div>
            <div className="contact-info"><strong>{user.username}</strong><span>{online.has(user.id) ? 'Active now' : 'Away'}</span></div>
            {active?.id === user.id && <span className="active-indicator" />}
          </button>)}
          {filteredUsers.length === 0 && <div className="empty-contacts"><Users size={22} /><p>{search ? 'No people match your search.' : 'No conversations yet.'}</p><span>Invite a friend by sharing this app.</span></div>}
        </div>
        <div className="sidebar-bottom"><div className="connection-pill">{connected ? <><Wifi size={14} /><span>Live connection</span><i className="online-dot" /></> : <><WifiOff size={14} /><span>Connecting…</span></>}</div><span className="version-label">PULSE MESSENGER · 1.0</span></div>
      </aside>
      <section className="chat-panel">
        <header className="chat-header">
          {active ? <><div className="avatar header-avatar" style={{ background: active.avatarColor || colorFor(active.username) }}>{initials(active.username)}<i className={online.has(active.id) ? 'presence online' : 'presence'} /></div><div className="header-person"><h2>{active.username}</h2><span>{typing.has(active.id) ? <span className="typing-label">typing<span className="typing-dots">...</span></span> : online.has(active.id) ? 'Online now' : 'Offline'}</span></div><div className="header-right"><span className="encrypted-label"><ShieldCheck size={15} /> Private conversation</span><button className="icon-button mobile-logout" onClick={logout} title="Sign out"><LogOut size={18} /></button></div></> : <div className="header-person"><h2>Your messages</h2><span>Choose someone to start chatting</span></div>}
        </header>
        {active ? <><div className="messages-area">
          <div className="conversation-intro"><div className="intro-avatar" style={{ background: active.avatarColor || colorFor(active.username) }}>{initials(active.username)}</div><span className="intro-kicker">THIS IS THE BEGINNING</span><h3>You and {active.username}</h3><p>Your conversations start with a hello.<br />Make it a good one.</p><div className="intro-date"><span /> TODAY <span /></div></div>
          {activeMessages.map((message, index) => {
            const mine = message.senderId === me.id;
            const previous = activeMessages[index - 1];
            const showAvatar = !mine && (!previous || previous.senderId !== message.senderId);
            return <div className={mine ? 'message-row mine' : 'message-row'} key={message.id}>
              {!mine && <div className="message-avatar-slot">{showAvatar && <div className="avatar tiny-avatar" style={{ background: message.avatarColor || colorFor(message.sender) }}>{initials(message.sender)}</div>}</div>}
              <div className="message-content">{!mine && showAvatar && <span className="message-author">{message.sender}</span>}<div className="bubble">{message.text}</div><div className="message-meta"><span>{timeLabel(message.createdAt)}</span>{mine && <CheckCheck size={13} className="read-check" />}</div></div>
            </div>;
          })}
          {typing.has(active.id) && <div className="typing-row"><span /><span /><span /></div>}
          <div ref={bottomRef} />
        </div>
        {error && <div className="inline-error">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
        <div className="composer-wrap"><form className="composer" onSubmit={sendMessage}><button type="button" className="composer-extra" title="Messaging is ready"><Sparkles size={18} /></button><input value={draft} onChange={e => updateDraft(e.target.value)} placeholder={connected ? `Message ${active.username}...` : 'Connecting to chat…'} disabled={!connected} maxLength={4000} /><span className="composer-hint">↵</span><button className="send-button" disabled={!draft.trim() || !connected} aria-label="Send message"><Send size={17} /></button></form><div className="composer-foot"><span>Be kind. Keep it human.</span><span>{draft.length > 0 ? `${draft.length}/4000` : <><Check size={12} /> Messages delivered in real time</>}</span></div></div></> :
        <div className="empty-chat"><div className="empty-chat-icon"><MessageCircle size={30} /></div><h2>A little hello goes a long way.</h2><p>Select someone from your contacts to start a conversation.</p></div>}
      </section>
    </main>
  );
}
