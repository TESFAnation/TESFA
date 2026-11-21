'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { ClipboardCheck, Building2, FileText, LogOut, Moon, RefreshCcw, Sun, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Campaign = {
  id: string; title: string; category: string; location: string | null; story: string;
  goal_etb: number; status: string; owner_id: string; created_at: string;
};
type Evidence = { id: string; document_type: string; storage_path: string };
type Organization = {
  id: string; name: string; registration_reference: string; note: string;
  status: string; created_at: string;
};
type Update = { id: string; campaign_id: string; body: string; status: string; created_at: string };
type Section = 'campaigns' | 'organizations' | 'updates';
const cash = (value: number) => 'ETB ' + Math.round(Number(value)).toLocaleString('en-US');
const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [staff, setStaff] = useState(false);
  const [checking, setChecking] = useState(false);
  const [section, setSection] = useState<Section>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [notes, setNotes] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tesfa-admin-theme');
    const next = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(next);
    document.body.dataset.theme = next ? 'dark' : 'light';
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('tesfa-admin-theme', next ? 'dark' : 'light');
    document.body.dataset.theme = next ? 'dark' : 'light';
  }

  const refresh = useCallback(async () => {
    const [campaignsResponse, orgsResponse, updatesResponse] = await Promise.all([
      supabase.from('campaigns').select('id,title,category,location,story,goal_etb,status,owner_id,created_at').order('created_at', { ascending: false }),
      supabase.from('organizations').select('id,name,registration_reference,note,status,created_at').order('created_at', { ascending: false }),
      supabase.from('campaign_updates').select('id,campaign_id,body,status,created_at').order('created_at', { ascending: false }),
    ]);
    if (campaignsResponse.error || orgsResponse.error || updatesResponse.error) {
      setMessage('Could not load some review data. Check your account permissions.');
      return;
    }
    setCampaigns((campaignsResponse.data || []) as Campaign[]);
    setOrganizations((orgsResponse.data || []) as Organization[]);
    setUpdates((updatesResponse.data || []) as Update[]);
  }, []);

  useEffect(() => {
    if (!user) { setStaff(false); setChecking(false); return; }
    let active = true;
    setChecking(true);
    supabase.from('staff_members').select('role').eq('user_id', user.id).maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;
        setStaff(!!data && !error);
        setChecking(false);
        if (data && !error) await refresh();
      });
    return () => { active = false; };
  }, [user?.id, refresh, user]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMessage(error.message);
  }
  async function openCampaign(item: Campaign) {
    setSelected(item); setReviewed(false); setNotes(''); setEvidence([]); setMessage('');
    const response = await supabase.from('verification_documents').select('id,document_type,storage_path').eq('campaign_id', item.id);
    if (response.error) setMessage(response.error.message);
    else setEvidence((response.data || []) as Evidence[]);
  }
  async function reviewCampaign(status: 'approved' | 'needs_info' | 'rejected') {
    if (!user || !selected) return;
    if (status === 'approved' && (!reviewed || evidence.length === 0 || selected.story.trim().length < 80 || !selected.location?.trim())) {
      setMessage('Complete the checks and confirm human review before approving.');
      return;
    }
    if (status !== 'approved' && notes.trim().length < 8) {
      setMessage('Give the applicant a clear explanation in the reviewer notes.');
      return;
    }
    setBusy(true); setMessage('');
    const { error } = await supabase.from('campaigns').update({ status }).eq('id', selected.id);
    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }
    const event = await supabase.from('review_events').insert({
      campaign_id: selected.id, reviewer_id: user.id, decision: status,
      notes: notes.trim() || 'Reviewer confirmed sample evidence and application details.',
    });
    if (event.error) setMessage('Status changed, but audit entry failed: ' + event.error.message);
    else setMessage('Campaign review saved.');
    setBusy(false); setSelected(null); await refresh();
  }
  async function reviewOrganization(id: string, status: 'approved' | 'rejected') {
    setBusy(true);
    const result = await supabase.from('organizations').update({ status }).eq('id', id);
    setBusy(false);
    setMessage(result.error?.message || 'Organization status saved.');
    await refresh();
  }
  async function reviewUpdate(id: string, status: 'approved' | 'rejected') {
    setBusy(true);
    const result = await supabase.from('campaign_updates').update({ status }).eq('id', id);
    setBusy(false);
    setMessage(result.error?.message || 'Update review saved.');
    await refresh();
  }

  const pending = campaigns.filter((item) => item.status === 'submitted').length;
  const approved = campaigns.filter((item) => item.status === 'approved').length;
  const needInfo = campaigns.filter((item) => item.status === 'needs_info').length;
  const completeChecks = !!selected && selected.story.trim().length >= 80 && !!selected.location?.trim() && evidence.length > 0;

  if (!ready || checking) return <main className="sign-in card"><div className="brand">TESFA</div><p className="muted">Checking your account…</p></main>;
  if (!user) return <main className="sign-in card">
    <div className="topline"><div className="brand">TESFA</div><button className="btn secondary" type="button" onClick={toggleTheme} aria-label="Switch appearance">{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div>
    <h1>Staff sign in</h1>
    <p className="muted">Campaign applications are reviewed here. Access is restricted to TESFA staff accounts.</p>
    <form onSubmit={signIn}>
      <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {!!message && <p className="message" role="alert">{message}</p>}
    </form>
    <p className="small" style={{ marginTop: 20 }}>Prototype only. Do not upload real IDs or confidential medical records.</p>
  </main>;

  if (!staff) return <main className="sign-in card">
    <div className="brand">TESFA</div><h1>Access restricted</h1>
    <p className="muted">Your account is signed in but is not assigned as a reviewer. The project owner must grant staff access in Supabase.</p>
    <p className="small">Signed in as {user.email}</p>
    <button className="btn secondary" onClick={() => supabase.auth.signOut()}>Sign out</button>
  </main>;

  return <div className="layout">
    <aside className="sidebar">
      <div><div className="brand">TESFA</div><div className="small">REVIEW DASHBOARD</div></div>
      <nav aria-label="Admin navigation">
        <button className={'nav-item ' + (section === 'campaigns' ? 'active' : '')} onClick={() => { setSection('campaigns'); setSelected(null); }}><ClipboardCheck size={18} /> Campaigns</button>
        <button className={'nav-item ' + (section === 'organizations' ? 'active' : '')} onClick={() => { setSection('organizations'); setSelected(null); }}><Building2 size={18} /> Organizations</button>
        <button className={'nav-item ' + (section === 'updates' ? 'active' : '')} onClick={() => { setSection('updates'); setSelected(null); }}><FileText size={18} /> Updates</button>
      </nav>
      <div style={{ marginTop: 'auto', display: 'grid', gap: 9 }}>
        <span className="small">{user.email}</span>
        <button className="nav-item" onClick={toggleTheme}>{dark ? <Sun size={17} /> : <Moon size={17} />} {dark ? 'Light mode' : 'Dark mode'}</button>
        <button className="nav-item" onClick={() => supabase.auth.signOut()}><LogOut size={17} /> Sign out</button>
      </div>
    </aside>
    <main className="content">
      <div className="topline">
        <div><div className="small">TESFA PROTOTYPE</div><h1>{section === 'campaigns' ? 'Campaign reviews' : section === 'organizations' ? 'Organizations' : 'Campaign updates'}</h1></div>
        <button className="btn secondary" onClick={refresh}><RefreshCcw size={15} style={{ verticalAlign: 'middle' }} /> Refresh</button>
      </div>
      <p className="muted">Human review with fictional sample evidence. No live documents or payment transactions.</p>
      {!!message && <p className="message" role="status">{message}</p>}
      {section === 'campaigns' && <>
        <div className="cards">
          <div className="card"><div className="small">Awaiting review</div><div className="count">{pending}</div></div>
          <div className="card"><div className="small">Approved</div><div className="count">{approved}</div></div>
          <div className="card"><div className="small">Needs information</div><div className="count">{needInfo}</div></div>
        </div>
        <div className="card">
          <h2>Applications</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table"><thead><tr><th>Campaign</th><th className="hide-small">Category</th><th>Status</th><th className="hide-small">Submitted</th><th>Review</th></tr></thead><tbody>
              {campaigns.map((item) => <tr key={item.id}>
                <td><strong>{item.title}</strong><div className="small">{cash(item.goal_etb)}</div></td>
                <td className="hide-small">{item.category}</td>
                <td><span className="status">{item.status.replace('_', ' ')}</span></td>
                <td className="hide-small">{date(item.created_at)}</td>
                <td><button className="link" onClick={() => openCampaign(item)}>Open</button></td>
              </tr>)}
              {!campaigns.length && <tr><td colSpan={5} className="empty">No campaign applications yet.</td></tr>}
            </tbody></table>
          </div>
        </div>
        {selected && <div className="review">
          <section className="card">
            <div className="topline"><h2>{selected.title}</h2><button className="btn secondary" onClick={() => setSelected(null)}>Close</button></div>
            <p className="small">{selected.category.toUpperCase()} · {selected.location || 'No location'} · {cash(selected.goal_etb)}</p>
            <h3>Campaign story</h3><p style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{selected.story}</p>
            <h3>Sample evidence records</h3>
            {evidence.length ? evidence.map((doc) => <div key={doc.id} className="card" style={{ marginTop: 10, padding: 13 }}>
              <strong>{doc.document_type}</strong><div className="small">Sample metadata only. No document file or ID verification.</div>
            </div>) : <p className="muted">No evidence metadata submitted.</p>}
          </section>
          <section className="card">
            <h2>Review checklist</h2>
            <p className="small">Automated completeness checks only. These do not establish authenticity.</p>
            <div className="check">{selected.story.trim().length >= 80 ? '✓' : '✕'} Story has at least 80 characters</div>
            <div className="check">{selected.location?.trim() ? '✓' : '✕'} Location provided</div>
            <div className="check">{evidence.length ? '✓' : '✕'} Sample evidence type submitted</div>
            <label className="check"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I manually reviewed the fictional application and its limitations.</label>
            <div className="field"><label htmlFor="review-notes">Reviewer notes</label><textarea id="review-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for your decision" /></div>
            <div className="actions">
              <button className="btn" disabled={busy || !reviewed || !completeChecks} onClick={() => reviewCampaign('approved')}>Approve</button>
              <button className="btn secondary" disabled={busy} onClick={() => reviewCampaign('needs_info')}>More evidence</button>
              <button className="btn warn" disabled={busy} onClick={() => reviewCampaign('rejected')}>Reject</button>
            </div>
          </section>
        </div>}
      </>}
      {section === 'organizations' && <div className="card"><h2>Organization applications</h2>
        <div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Organization</th><th>Status</th><th>Review</th></tr></thead><tbody>
          {organizations.map((item) => <tr key={item.id}>
            <td><strong>{item.name}</strong><div className="small">{item.registration_reference} · Sample data</div><div className="small">{item.note}</div></td>
            <td><span className="status">{item.status}</span></td>
            <td><div className="actions"><button className="btn secondary" disabled={busy} onClick={() => reviewOrganization(item.id, 'approved')}>Approve</button><button className="btn secondary" disabled={busy} onClick={() => reviewOrganization(item.id, 'rejected')}>Reject</button></div></td>
          </tr>)}
          {!organizations.length && <tr><td colSpan={3} className="empty">No organization applications.</td></tr>}
        </tbody></table></div>
        <p className="small">Organization approval is only a prototype status. Real registration certificates have not been authenticated.</p>
      </div>}
      {section === 'updates' && <div className="card"><h2>Organizer updates</h2>
        <div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Update text</th><th>Status</th><th>Review</th></tr></thead><tbody>
          {updates.map((item) => <tr key={item.id}>
            <td>{item.body}<div className="small">{date(item.created_at)}</div></td>
            <td><span className="status">{item.status}</span></td>
            <td><div className="actions"><button className="btn secondary" disabled={busy} onClick={() => reviewUpdate(item.id, 'approved')}>Approve</button><button className="btn secondary" disabled={busy} onClick={() => reviewUpdate(item.id, 'rejected')}>Reject</button></div></td>
          </tr>)}
          {!updates.length && <tr><td colSpan={3} className="empty">No updates submitted yet.</td></tr>}
        </tbody></table></div>
      </div>}
      <p className="small" style={{ marginTop: 30 }}><ShieldCheck size={14} style={{ verticalAlign: 'middle' }} /> All approvals here are for prototype testing. They are not legal, medical, or governmental verification.</p>
    </main>
  </div>;
}
