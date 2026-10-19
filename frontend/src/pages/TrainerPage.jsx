import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppNav from '../components/AppNav';
import '../styles/trainer.css';

const tabs = [
  { id: 'overview', label: 'Overview', number: '01' },
  { id: 'clients', label: 'Clients', number: '02' },
  { id: 'content', label: 'Content management', number: '03' },
  { id: 'consultations', label: 'Consultations', number: '04' }
];

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function formatDate(value) { return value ? new Date(value).toLocaleString() : ''; }
function shortDate(value) { return value ? new Date(value).toLocaleDateString() : '—'; }
function formatBytes(bytes) {
  let n = Number(bytes || 0), i = 0;
  const units = ['B', 'KB', 'MB', 'GB'];
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(i ? 1 : 0) + ' ' + units[i];
}
function initials(client) {
  return ((client.firstName?.charAt(0) || '') + (client.lastName?.charAt(0) || '')).toUpperCase() || 'CL';
}
function clientStatus(client) {
  if (client.canReceiveNewContent) return { text: 'Active', active: true };
  if ((client.Purchases || []).length) return { text: 'Past client', active: false };
  return { text: 'No purchase', active: false };
}
function Status({ client }) {
  const status = clientStatus(client);
  return <span className={'td-status' + (status.active ? ' is-active' : '')}>
    <span className="td-status-dot" />{status.text}
  </span>;
}

export default function TrainerPage() {
  const { user, loading } = useSelector(s => s.session);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [form, setForm] = useState({ userId: '', productId: '', title: '', description: '', file: null });

  const load = async () => {
    try {
      const next = await api('/api/trainer/dashboard');
      setData(next);
      setError('');
    } catch (err) { setError(err.message); }
  };
  useEffect(() => { if (user?.isTrainer) load(); }, [user]);

  const clients = data?.clients || [];
  const contacts = data?.contacts || [];
  const paidClients = useMemo(() => data?.clients?.filter(c => c.canReceiveNewContent) || [], [data]);
  const selectedClient = paidClients.find(c => String(c.id) === String(form.userId));
  const eligiblePrograms = selectedClient?.deliveryPrograms || [];

  const eligibleCount = clients.filter(c => c.canReceiveNewContent).length;
  const noPurchaseCount = clients.filter(c => !(c.Purchases || []).length).length;
  const newContacts = contacts.filter(c => c.status === 'new');
  const deliveredCount = clients.reduce((total, c) => total + (c.ClientFiles || []).length, 0);

  const visibleClients = clients.filter(c => {
    const term = search.trim().toLowerCase();
    const match = !term || [c.firstName, c.lastName, c.email, c.phone].some(v => String(v || '').toLowerCase().includes(term));
    const status = clientFilter === 'all' ||
      (clientFilter === 'active' && c.canReceiveNewContent) ||
      (clientFilter === 'inactive' && !c.canReceiveNewContent) ||
      (clientFilter === 'unconverted' && !(c.Purchases || []).length);
    return match && status;
  });

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isTrainer) return <Navigate to="/account" replace />;

  const changeTab = next => { setTab(next); setError(''); };
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const chooseClient = e => setForm(prev => ({ ...prev, userId: e.target.value, productId: '' }));

  const upload = async e => {
    e.preventDefault();
    setError('');
    if (!form.file || !form.userId || !form.productId || !form.title.trim()) {
      setError('Choose an eligible client, program, title, and file.');
      return;
    }
    setBusy(true);
    try {
      const presign = await api('/api/trainer/uploads/presign', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(form.userId), productId: Number(form.productId),
          originalName: form.file.name, mimeType: form.file.type || 'application/octet-stream',
          sizeBytes: form.file.size
        })
      });
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': form.file.type || 'application/octet-stream' },
        body: form.file
      });
      if (!put.ok) throw new Error('Upload to storage failed. Check the S3 bucket CORS settings.');
      await api('/api/trainer/uploads/complete', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(form.userId), productId: Number(form.productId),
          title: form.title, description: form.description, storageKey: presign.key,
          originalName: form.file.name, mimeType: form.file.type || 'application/octet-stream',
          sizeBytes: form.file.size
        })
      });
      setForm({ userId: '', productId: '', title: '', description: '', file: null });
      const fileInput = document.getElementById('trainer-file');
      if (fileInput) fileInput.value = '';
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const removeFile = async id => {
    if (!window.confirm('Remove this file from the client account?')) return;
    try { await api('/api/trainer/files/' + id, { method: 'DELETE' }); await load(); }
    catch (err) { setError(err.message); }
  };
  const updateLead = async (id, status) => {
    try {
      await api('/api/trainer/contacts/' + id, {
        method: 'PATCH', body: JSON.stringify({ status })
      });
      await load();
    } catch (err) { setError(err.message); }
  };

  return <div className="app-page trainer-page">
    <AppNav />
    <main className="app-main trainer-main">
      <div className="td-topline"><span>SHARP FITNESS / OPERATIONS</span><span className="td-environment">TRAINER WORKSPACE</span></div>
      <div className="td-heading">
        <div>
          <h1>Run your business<span className="td-accent">.</span></h1>
          <p>Manage clients, deliver coaching content, and keep every consultation organized.</p>
        </div>
        <button className="td-outline-btn" type="button" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : '↻ Refresh data'}
        </button>
      </div>

      {error && <div className="td-error" role="alert">{error}</div>}

      <div className="td-layout">
        <aside className="td-sidebar">
          <p className="td-side-label">WORKSPACE</p>
          <nav className="td-tabs" aria-label="Dashboard sections">
            {tabs.map(item => <button
              key={item.id} type="button"
              className={'td-tab' + (tab === item.id ? ' is-selected' : '')}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => changeTab(item.id)}>
              <span className="td-tab-number">{item.number}</span>
              <span>{item.label}</span>
              {tab === item.id && <span className="td-tab-indicator" aria-hidden="true">•</span>}
            </button>)}
          </nav>
          <div className="td-sidebar-note"><span className="td-note-light" />CLIENT DATA<br /><small>Visible only to trainer accounts</small></div>
        </aside>

        <div className="td-workspace">
          {tab === 'overview' && <>
            <div className="td-section-title"><div><p className="td-kicker">AT A GLANCE</p><h2>Overview</h2></div><span className="td-subtext">Live account summary</span></div>
            <div className="td-stats">
              <button className="td-stat" type="button" onClick={() => changeTab('clients')}>
                <span>Registered clients</span><strong>{clients.length}</strong><small>View client directory →</small>
              </button>
              <button className="td-stat" type="button" onClick={() => { setClientFilter('active'); changeTab('clients'); }}>
                <span>Eligible for delivery</span><strong>{eligibleCount}</strong><small>Clients with active access →</small>
              </button>
              <button className="td-stat" type="button" onClick={() => { setClientFilter('unconverted'); changeTab('clients'); }}>
                <span>Without a purchase</span><strong>{noPurchaseCount}</strong><small>Potential follow-ups →</small>
              </button>
              <button className="td-stat" type="button" onClick={() => changeTab('consultations')}>
                <span>New consultations</span><strong>{newContacts.length}</strong><small>Review requests →</small>
              </button>
            </div>

            <div className="td-overview-grid">
              <section className="td-panel td-overview-panel">
                <div className="td-panel-heading"><div><p className="td-kicker">PEOPLE</p><h3>Recent accounts</h3></div><button type="button" onClick={() => changeTab('clients')}>View all →</button></div>
                {clients.length ? clients.slice(0, 5).map(c =>
                  <div className="td-mini-client" key={c.id}>
                    <div className="td-avatar" aria-hidden="true">{initials(c)}</div>
                    <div className="td-mini-client-name"><strong>{c.firstName} {c.lastName}</strong><span>{c.email}</span></div>
                    <Status client={c} />
                  </div>
                ) : <p className="td-empty">No client accounts yet.</p>}
              </section>
              <section className="td-panel td-overview-panel">
                <div className="td-panel-heading"><div><p className="td-kicker">INBOX</p><h3>Consultation queue</h3></div><button type="button" onClick={() => changeTab('consultations')}>Open inbox →</button></div>
                {contacts.length ? contacts.slice(0, 4).map(c =>
                  <div className="td-mini-lead" key={c.id}>
                    <div><strong>{c.name}</strong><span>{c.interestedIn || c.goal || 'General consultation'}</span></div>
                    <span className={'td-status' + (c.status === 'new' ? ' is-new' : '')}>{c.status}</span>
                  </div>
                ) : <p className="td-empty">No consultation requests yet.</p>}
                <div className="td-panel-footnote">{deliveredCount} client file{deliveredCount === 1 ? '' : 's'} delivered so far</div>
              </section>
            </div>
          </>}

          {tab === 'clients' && <>
            <div className="td-section-title"><div><p className="td-kicker">CLIENT RELATIONSHIPS</p><h2>Clients</h2></div><span className="td-subtext">{visibleClients.length} of {clients.length} accounts</span></div>
            <section className="td-panel td-directory">
              <div className="td-directory-tools">
                <label className="td-search-label">Search clients
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, email, or phone" />
                </label>
                <label className="td-filter-label">Filter
                  <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
                    <option value="all">All accounts</option>
                    <option value="active">Eligible for uploads</option>
                    <option value="inactive">Not eligible</option>
                    <option value="unconverted">No purchases</option>
                  </select>
                </label>
              </div>
              <div className="td-client-columns" aria-hidden="true"><span>CLIENT</span><span>PHONE</span><span>PROGRAM</span><span>STATUS</span><span /></div>
              {visibleClients.length ? visibleClients.map(c => {
                const purchases = c.Purchases || [];
                return <details className="td-client-item" key={c.id}>
                  <summary className="td-client-summary">
                    <span className="td-client-identity"><span className="td-avatar" aria-hidden="true">{initials(c)}</span><span className="td-name-stack"><strong>{c.firstName} {c.lastName}</strong><small>{c.email}</small></span></span>
                    <span className="td-client-phone">{c.phone || 'Not provided'}</span>
                    <span className="td-client-program">{c.deliveryPrograms?.[0]?.name || purchases[0]?.Product?.name || 'No program'}</span>
                    <Status client={c} />
                    <span className="td-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="td-client-details">
                    <div className="td-detail-grid">
                      <div><span className="td-detail-label">CONTACT</span>
                        <a href={'mailto:' + c.email}>{c.email}</a>
                        {c.phone ? <a href={'tel:' + String(c.phone).replace(/[^0-9+]/g, '')}>{c.phone}</a> : <span className="td-subtext">No phone recorded</span>}
                      </div>
                      <div><span className="td-detail-label">SERVICE</span>
                        <span>{c.deliveryPrograms?.length ? c.deliveryPrograms.map(p => p.name).join(' · ') : 'Not eligible for new uploads'}</span>
                        {c.deliveryEndsAt && <small>Delivery window ends {shortDate(c.deliveryEndsAt)}</small>}
                      </div>
                      <div><span className="td-detail-label">ACCOUNT CREATED</span><span>{shortDate(c.createdAt)}</span></div>
                    </div>
                    <div className="td-client-subsection"><h4>Purchase history</h4>
                      {purchases.length ? <ul className="td-purchase-list">{purchases.map(p => <li key={p.id}><span>{p.Product?.name || 'Program'}</span><span>{p.status}</span></li>)}</ul> : <p className="td-empty-small">No purchases yet.</p>}
                    </div>
                    <div className="td-client-subsection"><h4>Delivered files</h4>
                      {c.ClientFiles?.length ? c.ClientFiles.map(f =>
                        <div className="td-file-row" key={f.id}>
                          <div><strong>{f.title}</strong><small>{f.Product?.name ? f.Product.name + ' · ' : ''}{f.originalName} · {formatBytes(f.sizeBytes)}</small></div>
                          <button type="button" onClick={() => removeFile(f.id)}>Remove</button>
                        </div>
                      ) : <p className="td-empty-small">No files delivered.</p>}
                    </div>
                    {c.canReceiveNewContent && <button type="button" className="td-outline-btn td-small-btn"
                      onClick={() => { setForm(prev => ({ ...prev, userId: String(c.id), productId: '' })); changeTab('content'); }}>
                      Upload content for this client →
                    </button>}
                  </div>
                </details>;
              }) : <p className="td-empty td-directory-empty">No clients match your filters.</p>}
            </section>
          </>}

          {tab === 'content' && <>
            <div className="td-section-title"><div><p className="td-kicker">CONTENT DELIVERY</p><h2>Content management</h2></div><span className="td-subtext">{eligibleCount} eligible client{eligibleCount === 1 ? '' : 's'}</span></div>
            <section className="td-panel td-content-panel">
              <div className="td-panel-heading"><div><h3>Upload client material</h3><p>Choose the client and the program this file belongs to. Previously delivered material remains accessible after cancellation.</p></div></div>
              <form className="td-upload-form" onSubmit={upload}>
                <div className="td-form-grid">
                  <label>Client<select value={form.userId} onChange={chooseClient} required>
                    <option value="">Select eligible client</option>
                    {paidClients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>)}
                  </select></label>
                  <label>Program<select value={form.productId} onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))} disabled={!selectedClient} required>
                    <option value="">{selectedClient ? 'Select program' : 'Select client first'}</option>
                    {eligiblePrograms.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}
                  </select></label>
                </div>
                <label>Content title<input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Week 1 workout / Squat form review" required /></label>
                <label>Description <span className="td-optional">(optional)</span><textarea rows="3" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="A short note for your client" /></label>
                <label>File<input id="trainer-file" type="file" accept="video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*" onChange={e => setForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))} required /></label>
                <div className="td-form-footer"><p>Files are delivered privately to the selected client account.</p><button className="app-btn" type="submit" disabled={busy || !paidClients.length}>{busy ? 'Uploading…' : 'Upload to client'}</button></div>
              </form>
              {!paidClients.length && <p className="td-empty-small">No clients currently qualify for new uploads.</p>}
            </section>
          </>}

          {tab === 'consultations' && <>
            <div className="td-section-title"><div><p className="td-kicker">SALES & FOLLOW-UPS</p><h2>Consultations</h2></div><span className="td-subtext">{newContacts.length} new request{newContacts.length === 1 ? '' : 's'}</span></div>
            <section className="td-lead-list">
              {contacts.length ? contacts.map(c => <article className="td-panel td-lead-card" key={c.id}>
                <div className="td-lead-top"><div><span className="td-detail-label">REQUEST / {shortDate(c.createdAt)}</span><h3>{c.name}</h3><p>{c.contact}</p></div>
                  <label>Follow-up status<select value={c.status} onChange={e => updateLead(c.id, e.target.value)}>
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
                  </select></label>
                </div>
                <div className="td-lead-info"><div><span className="td-detail-label">GOAL</span><strong>{c.goal || 'Not specified'}</strong></div><div><span className="td-detail-label">INTERESTED IN</span><strong>{c.interestedIn || 'Not specified'}</strong></div></div>
                {c.message && <p className="td-lead-message">{c.message}</p>}
                <p className="td-lead-meta">Submitted {formatDate(c.createdAt)} · Email notification {c.notificationSent ? 'sent' : 'not sent'}</p>
                {c.notificationError && <p className="mail-warning">{c.notificationError}</p>}
              </article>) : <div className="td-panel td-empty">No consultation requests yet.</div>}
            </section>
          </>}
        </div>
      </div>
    </main>
  </div>;
}
