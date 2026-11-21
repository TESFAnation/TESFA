'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { ClipboardCheck, Building2, FileText, Flag, LogOut, Moon, RefreshCcw, Sun, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Campaign = {
  id: string; title: string; category: string; location: string | null; story: string;
  goal_etb: number; status: string; owner_id: string; created_at: string;
  organizer_name: string | null; spending_plan: string | null;
};
type Evidence = { id: string; document_type: string; storage_path: string };
type CampaignPhoto = { id: string; storage_path: string };
type Report = { id: string; campaign_id: string; reason: string; details: string; status: string; created_at: string };
type Organization = {
  id: string; name: string; registration_reference: string; note: string;
  status: string; created_at: string;
};
type Update = { id: string; campaign_id: string; body: string; status: string; created_at: string };
type Section = 'campaigns' | 'organizations' | 'updates' | 'reports';
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
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [photos, setPhotos] = useState<CampaignPhoto[]>([]);
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
    const [campaignsResponse, orgsResponse, updatesResponse, reportsResponse] = await Promise.all([
      supabase.from('campaigns').select('id,title,category,location,story,goal_etb,status,owner_id,created_at,organizer_name,spending_plan').order('created_at', { ascending: false }),
      supabase.from('organizations').select('id,name,registration_reference,note,status,created_at').order('created_at', { ascending: false }),
      supabase.from('campaign_updates').select('id,campaign_id,body,status,created_at').order('created_at', { ascending: false }),
      supabase.from('campaign_reports').select('id,campaign_id,reason,details,status,created_at').order('created_at', { ascending: false }),
    ]);
    if (campaignsResponse.error || orgsResponse.error || updatesResponse.error || reportsResponse.error) {
      setMessage('Could not load some review data. Check your account permissions.');
      return;
    }
    setCampaigns((campaignsResponse.data || []) as Campaign[]);
    setOrganizations((orgsResponse.data || []) as Organization[]);
    setUpdates((updatesResponse.data || []) as Update[]);
    setReports((reportsResponse.data || []) as Report[]);
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
    setSelected(item); setReviewed(false); setNotes(''); setEvidence([]); setPhotos([]); setMessage('');
    const [response, media] = await Promise.all([
      supabase.from('verification_documents').select('id,document_type,storage_path').eq('campaign_id', item.id),
      supabase.from('campaign_media').select('id,storage_path').eq('campaign_id', item.id).order('display_order'),
    ]);
    if (response.error || media.error) setMessage(response.error?.message || media.error?.message || 'Could not load files.');
    else {
      setEvidence((response.data || []) as Evidence[]);
      setPhotos((media.data || []) as CampaignPhoto[]);
    }
  }
  async function openEvidence(doc: Evidence) {
    const { data, error } = await supabase.storage.from('tesfa-private-evidence').createSignedUrl(doc.storage_path, 60);
    if (error || !data?.signedUrl) { setMessage(error?.message || 'Could not open evidence file.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }
  async function reviewCampaign(status: 'approved' | 'needs_info' | 'rejected') {
    if (!user || !selected) return;
    if (status === 'approved' && (!reviewed || evidence.length === 0 || photos.length === 0 || selected.story.trim().length < 80 || !selected.location?.trim() ||
      (selected.organizer_name || '').trim().length < 3 || (selected.spending_plan || '').trim().length < 25)) {
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
      notes: notes.trim() || 'Reviewer checked submitted evidence and application details.',
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
  async function reviewReport(id: string, status: 'resolved' | 'dismissed') {
    setBusy(true);
    const result = await supabase.from('campaign_reports').update({ status }).eq('id', id);
    setBusy(false);
    setMessage(result.error?.message || 'Report marked ' + status + '.');
    await refresh();
  }

  const pending = campaigns.filter((item) => item.status === 'submitted').length;
  const approved = campaigns.filter((item) => item.status === 'approved').length;
  const needInfo = campaigns.filter((item) => item.status === 'needs_info').length;
  const completeChecks = !!selected && selected.story.trim().length >= 80 && !!selected.location?.trim() &&
    (selected.organizer_name || '').trim().length >= 3 && (selected.spending_plan || '').trim().length >= 25 &&
    evidence.length > 0 && photos.length > 0;

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
        <button className={'nav-item ' + (section === 'reports' ? 'active' : '')} onClick={() => { setSection('reports'); setSelected(null); }}><Flag size={18} /> Reports {reports.filter((item) => item.status === 'pending').length > 0 ? '(' + reports.filter((item) => item.status === 'pending').length + ')' : ''}</button>
      </nav>
      <div style={{ marginTop: 'auto', display: 'grid', gap: 9 }}>
        <span className="small">{user.email}</span>
        <button className="nav-item" onClick={toggleTheme}>{dark ? <Sun size={17} /> : <Moon size={17} />} {dark ? 'Light mode' : 'Dark mode'}</button>
        <button className="nav-item" onClick={() => supabase.auth.signOut()}><LogOut size={17} /> Sign out</button>
      </div>
    </aside>
    <main className="content">
      <div className="topline">
        <div><div className="small">REVIEW WORKSPACE</div><h1>{section === 'campaigns' ? 'Campaign reviews' : section === 'organizations' ? 'Organizations' : section === 'updates' ? 'Campaign updates' : 'Campaign reports'}</h1></div>
        <button className="btn secondary" onClick={refresh}><RefreshCcw size={15} style={{ verticalAlign: 'middle' }} /> Refresh</button>
      </div>
      <p className="muted">Staff review of submitted campaigns, supporting files, and updates. Payments are not enabled.</p>
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
            <h3>Organizer</h3><p>{selected.organizer_name || 'Not provided'}</p>
            <h3>Campaign story</h3><p style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{selected.story}</p>
            <h3>Spending plan</h3><p style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{selected.spending_plan || 'Not provided'}</p>
            <h3>Campaign photos</h3>
            {photos.length ? <div className="photo-grid">{photos.map((photo) => <a key={photo.id}
              href={supabase.storage.from('tesfa-campaign-photos').getPublicUrl(photo.storage_path).data.publicUrl}
              target="_blank" rel="noreferrer" aria-label="Open campaign photo">
              {/* The path is generated by the uploader; reviewers can open the original file. */}
              <span className="photo" style={{ backgroundImage: 'url(' + supabase.storage.from('tesfa-campaign-photos').getPublicUrl(photo.storage_path).data.publicUrl + ')' }} />
            </a>)}</div> : <p className="muted">No campaign photos uploaded.</p>}
            <h3>Private supporting evidence</h3>
            {evidence.length ? evidence.map((doc) => <div key={doc.id} className="card" style={{ marginTop: 10, padding: 13 }}>
              <strong>{doc.document_type}</strong><div className="small">Uploaded file. This does not establish authenticity.</div>
              <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => openEvidence(doc)}>View private file</button>
            </div>) : <p className="muted">No evidence files submitted.</p>}
          </section>
          <section className="card">
            <h2>Review checklist</h2>
            <p className="small">Automated completeness checks only. These do not establish authenticity.</p>
            <div className="check">{selected.story.trim().length >= 80 ? '✓' : '✕'} Story has at least 80 characters</div>
            <div className="check">{selected.location?.trim() ? '✓' : '✕'} Location provided</div>
            <div className="check">{(selected.organizer_name || '').trim().length >= 3 ? '✓' : '✕'} Organizer provided</div>
            <div className="check">{(selected.spending_plan || '').trim().length >= 25 ? '✓' : '✕'} Spending plan provided</div>
            <div className="check">{photos.length ? '✓' : '✕'} Campaign photo uploaded</div>
            <div className="check">{evidence.length ? '✓' : '✕'} Supporting evidence uploaded</div>
            <label className="check"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I opened the evidence and inspected the application. I understand this does not establish document authenticity.</label>
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
            <td><strong>{item.name}</strong><div className="small">{item.registration_reference}</div><div className="small">{item.note}</div></td>
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
      {section === 'reports' && <div className="card"><h2>Reported campaigns</h2>
        <div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Campaign</th><th>Reason</th><th>Details</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {reports.map((item) => <tr key={item.id}>
            <td><strong>{campaigns.find((campaign) => campaign.id === item.campaign_id)?.title || 'Campaign'}</strong><div className="small">{date(item.created_at)}</div></td>
            <td>{item.reason}</td><td>{item.details || 'No details provided'}</td>
            <td><span className="status">{item.status}</span></td>
            <td><div className="actions">
              <button className="btn secondary" onClick={() => { setSection('campaigns'); const campaign = campaigns.find((c) => c.id === item.campaign_id); if (campaign) openCampaign(campaign); }}>Open</button>
              {item.status === 'pending' && <>
                <button className="btn secondary" disabled={busy} onClick={() => reviewReport(item.id, 'resolved')}>Resolve</button>
                <button className="btn secondary" disabled={busy} onClick={() => reviewReport(item.id, 'dismissed')}>Dismiss</button>
              </>}
            </div></td>
          </tr>)}
          {!reports.length && <tr><td colSpan={5} className="empty">No reports submitted yet.</td></tr>}
        </tbody></table></div>
      </div>}
      <p className="small" style={{ marginTop: 30 }}><ShieldCheck size={14} style={{ verticalAlign: 'middle' }} /> All approvals here are for prototype testing. They are not legal, medical, or governmental verification.</p>
    </main>
  </div>;
}
