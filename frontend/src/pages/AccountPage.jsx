import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppNav from '../components/AppNav';
import '../styles/account-v2.css';

function formatBytes(bytes) {
  let n = Number(bytes || 0), i = 0;
  const units = ['B', 'KB', 'MB', 'GB'];
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n ? n.toFixed(i ? 1 : 0) + ' ' + units[i] : '';
}

function dateLabel(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function planStatus(purchase) {
  if (purchase.status === 'canceled') return { label: 'Ended', tone: 'ended' };
  if (purchase.status === 'pending') return { label: 'Pending', tone: 'pending' };
  if (purchase.status !== 'active') return { label: purchase.status || 'Unknown', tone: 'pending' };
  if (purchase.Product?.billingType === 'one_time') return { label: 'Purchased', tone: 'active' };
  if (purchase.cancelAtPeriodEnd || purchase.cancelAt) return { label: 'Canceling', tone: 'pending' };
  return { label: 'Active', tone: 'active' };
}

function Status({ purchase }) {
  const status = planStatus(purchase);
  return <span className={'cv-status cv-status-' + status.tone}>
    <span aria-hidden="true" className="cv-status-dot" />{status.label}
  </span>;
}

function PlanCard({ purchase }) {
  const monthly = purchase.Product?.billingType === 'monthly';
  const active = purchase.status === 'active';
  const ending = purchase.cancelAtPeriodEnd || purchase.cancelAt;
  const when = dateLabel(purchase.cancelAt || purchase.currentPeriodEnd);
  return <article className="cv-plan-row">
    <div className="cv-plan-top">
      <div><span className="cv-mini-label">{monthly ? 'COACHING SUBSCRIPTION' : 'ONE-TIME PROGRAM'}</span>
        <h3>{purchase.Product?.name || 'Your program'}</h3></div>
      <Status purchase={purchase} />
    </div>
    {purchase.Product?.description && <p>{purchase.Product.description}</p>}
    <div className="cv-plan-foot">
      <span>{monthly
        ? active
          ? ending
            ? (when ? 'Scheduled to end ' + when : 'Cancellation scheduled')
            : (when ? 'Next billing ' + when : 'Monthly coaching')
          : 'Previously delivered files remain available'
        : active
          ? 'Keep access to delivered files'
          : 'Review your account for details'
      }</span>
      {purchase.purchasedAt && <small>Added {dateLabel(purchase.purchasedAt)}</small>}
    </div>
  </article>;
}

function FileRow({ file, onOpen }) {
  const type = file.mimeType?.startsWith('video/')
    ? 'VIDEO'
    : file.mimeType?.startsWith('image/')
      ? 'IMAGE'
      : 'DOCUMENT';
  return <article className="cv-file-row">
    <div className="cv-file-symbol" aria-hidden="true">{type === 'VIDEO' ? '▶' : type === 'IMAGE' ? '▧' : '▤'}</div>
    <div className="cv-file-description">
      <div className="cv-file-top"><span className="cv-mini-label">{type}</span><small>{formatBytes(file.sizeBytes)}</small></div>
      <h3>{file.title}</h3>
      <p>{file.Product?.name || 'Personalized content'}{file.description ? ' · ' + file.description : ''}</p>
      <small>{file.originalName}</small>
    </div>
    <button type="button" className="cv-action cv-action-small" onClick={() => onOpen(file.id)}>Open ↗</button>
  </article>;
}

export default function AccountPage() {
  const { user, loading } = useSelector(s => s.session);
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [portalBusy, setPortalBusy] = useState(false);
  const [devBusy, setDevBusy] = useState(null);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [fileSearch, setFileSearch] = useState('');
  const [params] = useSearchParams();

  const loadAccount = async () => {
    try {
      const res = await fetch('/api/account', { credentials: 'include' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Could not load account');
      setData(result);
      setError('');
      if (import.meta.env.DEV) {
        const productsRes = await fetch('/api/products', { credentials: 'include', cache: 'no-store' });
        const productsResult = await productsRes.json().catch(() => ({}));
        if (!productsRes.ok) throw new Error(productsResult.message || 'Could not load products');
        setProducts(productsResult.products || []);
      }
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { if (user && !user.isTrainer) loadAccount(); }, [user?.id, user?.isTrainer]);

  const purchases = data?.purchases || [];
  const files = data?.files || [];
  const activePlans = purchases.filter(p => p.status === 'active').length;
  const activeCoaching = purchases.filter(p => p.status === 'active' && p.Product?.billingType === 'monthly').length;
  const filteredFiles = useMemo(() => files.filter(file => {
    const term = fileSearch.trim().toLowerCase();
    return !term || [file.title, file.originalName, file.Product?.name, file.description]
      .some(value => String(value || '').toLowerCase().includes(term));
  }), [data, fileSearch]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.isTrainer) return <Navigate to="/trainer" replace />;

  const refresh = async () => {
    setRefreshBusy(true); await loadAccount(); setRefreshBusy(false);
  };

  const openFile = async id => {
    setError('');
    try {
      const res = await fetch('/api/files/' + id + '/access', { credentials: 'include' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Could not open your file');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err) { setError(err.message); }
  };

  const openBillingPortal = async () => {
    setError(''); setPortalBusy(true);
    try {
      const res = await fetch('/api/account/portal', {
        method: 'POST', credentials: 'include'
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Could not open billing');
      window.location.assign(result.url);
    } catch (err) { setError(err.message); setPortalBusy(false); }
  };

  const simulateProgram = async (productId, action) => {
    setError(''); setDevBusy(productId + '-' + action);
    try {
      const res = await fetch('/api/dev/programs/' + productId + '/' + action, {
        method: 'POST', credentials: 'include'
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Development simulation failed');
      await loadAccount();
    } catch (err) { setError(err.message); }
    finally { setDevBusy(null); }
  };

  return <div className="app-page account-v2">
    <AppNav />
    <main className="app-main cv-main">
      <div className="cv-topline"><span>SHARP FITNESS / CLIENT PORTAL</span><span>YOUR TRAINING SPACE</span></div>
      <div className="cv-hero">
        <div>
          <span className="cv-eyebrow">YOUR PERSONAL DASHBOARD</span>
          <h1>Welcome back, {user.firstName}<span>.</span></h1>
          <p>Your programs, coaching, and personalized resources in one place.</p>
        </div>
        <button className="cv-action cv-action-ghost" type="button" onClick={refresh} disabled={refreshBusy}>
          {refreshBusy ? 'Refreshing…' : '↻ Refresh data'}
        </button>
      </div>

      {params.get('checkout') === 'success' && <div className="cv-alert cv-alert-success">
        Payment received. Stripe will confirm access shortly; refresh if your program does not appear yet.
      </div>}
      {error && <div className="cv-alert cv-alert-error" role="alert">{error}</div>}

      <div className="cv-summary" aria-label="Your account summary">
        <button type="button" onClick={() => setTab('programs')} className="cv-stat">
          <span>YOUR PROGRAMS</span><strong>{purchases.length}</strong><small>{activePlans} currently active or purchased ↗</small>
        </button>
        <button type="button" onClick={() => setTab('programs')} className="cv-stat">
          <span>MONTHLY COACHING</span><strong>{activeCoaching}</strong><small>Active subscriptions ↗</small>
        </button>
        <button type="button" onClick={() => setTab('library')} className="cv-stat">
          <span>YOUR RESOURCE LIBRARY</span><strong>{files.length}</strong><small>Delivered files available ↗</small>
        </button>
      </div>

      <div className="cv-tabs" role="group" aria-label="Dashboard sections">
        <button type="button" className={tab === 'overview' ? 'is-selected' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button type="button" className={tab === 'programs' ? 'is-selected' : ''} onClick={() => setTab('programs')}>My programs</button>
        <button type="button" className={tab === 'library' ? 'is-selected' : ''} onClick={() => setTab('library')}>My files</button>
      </div>

      {!data && !error && <div className="cv-panel cv-loading">Loading your account…</div>}

      {tab === 'overview' && <>
        <div className="cv-grid">
          <section className="cv-panel cv-overview-plans">
            <div className="cv-section-head">
              <div><span className="cv-mini-label">01 / YOUR TRAINING</span><h2>Programs & coaching</h2></div>
              <button type="button" className="cv-text-button" onClick={() => setTab('programs')}>View all →</button>
            </div>
            {purchases.length ? purchases.slice(0, 3).map(p =>
              <PlanCard key={p.id} purchase={p} />
            ) : <div className="cv-empty"><h3>Your journey starts here.</h3>
              <p>Choose a program or talk with Cody about your goals.</p>
              <Link className="cv-action" to="/pricing">Explore programs ↗</Link>
            </div>}
          </section>
          <section className="cv-panel cv-overview-files">
            <div className="cv-section-head">
              <div><span className="cv-mini-label">02 / YOUR RESOURCES</span><h2>Latest deliveries</h2></div>
              <button type="button" className="cv-text-button" onClick={() => setTab('library')}>Open library →</button>
            </div>
            {files.length ? files.slice(0, 4).map(f =>
              <FileRow key={f.id} file={f} onOpen={openFile} />
            ) : <div className="cv-empty"><h3>Nothing delivered yet.</h3>
              <p>Any programs, files, or videos Cody uploads will appear here.</p>
            </div>}
          </section>
        </div>
        <div className="cv-secondary-grid">
          <section className="cv-panel cv-next-step">
            <span className="cv-mini-label">NEED SOMETHING?</span>
            <h2>Your next step, made simple.</h2>
            <p>Reach out to Cody for a consultation, a program question, or help getting started.</p>
            <Link to="/contact" className="cv-action">Contact Cody ↗</Link>
          </section>
          <section className="cv-panel cv-billing-panel">
            <span className="cv-mini-label">ACCOUNT & BILLING</span>
            <h2>You're in control.</h2>
            <p>Previously delivered material stays in your library, even when monthly coaching ends.</p>
            {data?.canManageBilling
              ? <button type="button" className="cv-action cv-action-ghost" disabled={portalBusy} onClick={openBillingPortal}>
                  {portalBusy ? 'Opening billing…' : 'Manage billing →'}
                </button>
              : <Link className="cv-action cv-action-ghost" to="/pricing">Browse available programs →</Link>}
          </section>
        </div>
      </>}

      {tab === 'programs' && <section className="cv-panel cv-full-panel">
        <div className="cv-section-head">
          <div><span className="cv-mini-label">YOUR PURCHASE HISTORY</span><h2>My programs</h2></div>
          {data?.canManageBilling && <button type="button" className="cv-action cv-action-small" disabled={portalBusy} onClick={openBillingPortal}>
            {portalBusy ? 'Opening…' : 'Manage billing →'}
          </button>}
        </div>
        {purchases.length ? <div className="cv-all-plans">{purchases.map(p =>
          <PlanCard key={p.id} purchase={p} />
        )}</div> : <div className="cv-empty"><h3>No programs yet.</h3>
          <p>Explore Sharp Fitness coaching options or book a free consultation.</p>
          <Link to="/pricing" className="cv-action">Browse programs ↗</Link>
        </div>}
        <p className="cv-persistence">Your previously delivered documents and videos remain available after a monthly subscription ends.</p>
      </section>}

      {tab === 'library' && <section className="cv-panel cv-full-panel">
        <div className="cv-section-head">
          <div><span className="cv-mini-label">YOUR PERSONALIZED CONTENT</span><h2>My resource library</h2></div>
          <span className="cv-count">{files.length} file{files.length === 1 ? '' : 's'}</span>
        </div>
        <label className="cv-file-search">Search library
          <input type="search" value={fileSearch} onChange={e => setFileSearch(e.target.value)}
            placeholder="Search file names, programs, or notes" />
        </label>
        {filteredFiles.length ? filteredFiles.map(f => <FileRow key={f.id} file={f} onOpen={openFile} />) :
          <div className="cv-empty"><h3>{files.length ? 'No matching files.' : 'Your library is ready.'}</h3>
            <p>{files.length ? 'Try a different search.' : 'Your personalized training files and videos will appear here when Cody delivers them.'}</p>
          </div>}
      </section>}

      {import.meta.env.DEV && <details className="cv-dev-panel">
        <summary>Development tools — simulate purchases (local only)</summary>
        <p>These test controls do not charge Stripe and are never displayed in production.</p>
        {products.map(product => {
          const purchase = purchases.find(p => Number(p.productId) === Number(product.id));
          const active = purchase?.status === 'active';
          return <div className="cv-dev-row" key={product.id}>
            <div><strong>{product.name}</strong><small>{active ? 'Active' : purchase?.status || 'Not purchased'}</small></div>
            <div>
              <button type="button" disabled={active || devBusy === product.id + '-activate'}
                onClick={() => simulateProgram(product.id, 'activate')}>Activate</button>
              <button type="button" disabled={!active || devBusy === product.id + '-cancel'}
                onClick={() => simulateProgram(product.id, 'cancel')}>Cancel</button>
            </div>
          </div>;
        })}
      </details>}
    </main>
  </div>;
}
