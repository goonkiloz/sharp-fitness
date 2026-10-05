import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppNav from '../components/AppNav';

function formatBytes(bytes){
  const n=Number(bytes||0); 
  
  if(!n)
    return '';

  const units=['B','KB','MB','GB'];
  
  let value=n,i=0;

  while(value>=1024&&i<units.length-1)
    {value/=1024;i++;}
  return `${value.toFixed(i?1:0)} ${units[i]}`;
}

function formatBillingDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
}

export default function AccountPage(){
  const {user,loading}=useSelector(s=>s.session);
  const [data,setData]=useState(null),
        [products,setProducts]=useState([]),
        [error,setError]=useState(''),
        [devBusy, setDevBusy]=useState(null),
        [portalBusy,setPortalBusy]=useState(false),
        [params]=useSearchParams();

  const loadAccount = async () => {
    try {
      setError('');

      const accountRes = await fetch('/api/account', {
        credentials: 'include'
      });

      const accountData = await accountRes.json();

      if (!accountRes.ok) {
        throw new Error(accountData.message || 'Could not load account');
      }

      setData(accountData);

      if (import.meta.env.DEV) {
        const productRes = await fetch('/api/products', {
          credentials: 'include',
          cache: 'no-store'
        });

        const productData = await productRes.json();

        if (!productRes.ok) {
          throw new Error(
            productData.message || 'Could not load products'
          )
        };

        setProducts(productData.products || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user) loadAccount();
  }, [user]);
 
  if(loading)
    return null;
  
  if(!user)
    return <Navigate to="/login" replace/>;
 
  if(user.isTrainer)
    return <Navigate to="/trainer" replace/>;
 
  const openFile=async(id)=>{
    setError('');
    try{
      const r=await fetch(`/api/files/${id}/access`,{
        credentials:'include'
      });
      
      const d=await r.json();
      
      if(!r.ok)
        throw new Error(d.message||'Could not open file');
      
      window.open(
        d.url,'_blank',
        'noopener,noreferrer'
      );
    }catch(e){
      setError(e.message);
    }
  };
 
  const simulateProgram = async (productId, action) => {
    setError('');
    setDevBusy(`${productId}-${action}`);

    try {
      const res = await fetch(
        `/api/dev/programs/${productId}/${action}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || 'Development simulation failed'
        );
      }

      await loadAccount();
    } catch (err) {
      setError(err.message);
    } finally {
      setDevBusy(null);
    }
  };

  const openBillingPortal = async () => {
    setError('');
    setPortalBusy(true);

    try {
      const res = await fetch('/api/account/portal', {
        method: 'POST',
        credentials: 'include'
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || 'Could not open billing portal'
        );
      }

      window.location.assign(result.url);
    } catch (err) {
      setError(err.message);
      setPortalBusy(false);
    }
  };

return (
  <div className="app-page">
    <AppNav />

    <main className="app-main">
      {params.get('checkout') === 'success' && (
        <div className="notice">
          Payment received. Stripe will confirm access through the webhook;
          refresh if your plan does not appear immediately.
        </div>
      )}

      <p className="eyebrow">CLIENT DASHBOARD</p>

      <h1>Hey, {user.firstName}.</h1>

      <p className="muted">
        Your coaching history and personalized videos/documents live here.
        Anything Cody has already delivered stays in your account even if
        monthly coaching ends.
      </p>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <h2>Your programs & coaching</h2>

      {data?.canManageBilling && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            className="app-btn"
            onClick={openBillingPortal}
            disabled={portalBusy}
          >
            {portalBusy
              ? 'Opening billing...'
              : 'Manage billing'}
          </button>
        </div>
      )}

      {import.meta.env.DEV && (
        <section
          style={{
            border: '1px dashed #888',
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px'
          }}
        >
          <p className="eyebrow">
            DEVELOPMENT TESTING
          </p>

          <h3>
            Simulate program purchases
          </h3>

          <p className="muted">
            These controls only appear locally. They do not charge Stripe.
          </p>

          {products.map(product => {
            const purchase = data?.purchases?.find(
              p => Number(p.productId) === Number(product.id)
            );

            const active = purchase?.status === 'active';

            return (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '.75rem'
                }}
              >
                <div>
                  <strong>
                    {product.name}
                  </strong>

                  <div className="muted">
                    {active
                      ? 'Active'
                      : purchase?.status || 'Not purchased'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '.5rem'
                  }}
                >
                  <button
                    className="app-btn"
                    disabled={
                      active ||
                      devBusy === `${product.id}-activate`
                    }
                    onClick={() =>
                      simulateProgram(
                        product.id,
                        'activate'
                      )
                    }
                  >
                    {devBusy === `${product.id}-activate`
                      ? 'Activating...'
                      : 'Activate'}
                  </button>

                  <button
                    disabled={
                      !active ||
                      devBusy === `${product.id}-cancel`
                    }
                    onClick={() =>
                      simulateProgram(
                        product.id,
                        'cancel'
                      )
                    }
                  >
                    {devBusy === `${product.id}-cancel`
                      ? 'Canceling...'
                      : 'Cancel'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {data?.purchases?.length ? (
        <div className="owned-list">
          {data.purchases.map(p => (
            <article
              className="owned-item"
              key={p.id}
            >
              <h3>
                {p.Product?.name}
              </h3>

              <p>
                {p.Product?.description}
              </p>

              <p className="muted">
                Status: {p.status}

                {p.Product?.billingType === 'one_time'
                  ? ' · 16-week personalized program with lifetime access to delivered materials'
                  : p.status === 'canceled'
                    ? ' · coaching ended; your delivered materials remain available'
                    : p.cancelAtPeriodEnd || p.cancelAt
                      ? ' · cancellation scheduled'
                      : ' · new materials are added while coaching remains active'
                }
              </p>

              {p.Product?.billingType === 'monthly' &&
                p.status === 'active' && (
                  <p className="muted">
                    {p.cancelAtPeriodEnd || p.cancelAt
                      ? `Access ends ${formatBillingDate(
                          p.cancelAt ||
                          p.currentPeriodEnd
                        )}`
                      : p.currentPeriodEnd
                        ? `Next billing date: ${formatBillingDate(
                            p.currentPeriodEnd
                          )}`
                        : null
                    }
                  </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>
            No purchases yet.
          </h3>

          <p className="muted">
            Choose a program or coaching option to get started.
          </p>

          <Link
            className="app-btn"
            to="/programs"
          >
            Browse programs
          </Link>
        </div>
      )}

      <h2 className="section-heading">
        Your personalized files
      </h2>

      {data?.files?.length ? (
        <div className="file-list">
          {data.files.map(f => (
            <article
              className="file-card"
              key={f.id}
            >
              <div>
                <span className="file-type">
                  {f.mimeType?.startsWith('video/')
                    ? 'VIDEO'
                    : 'DOCUMENT'}
                </span>

                {f.Product?.name && (
                  <p className="muted">
                    Program: {f.Product.name}
                  </p>
                )}

                <h3>
                  {f.title}
                </h3>

                {f.description && (
                  <p>
                    {f.description}
                  </p>
                )}

                <p className="muted">
                  {f.originalName} · {formatBytes(f.sizeBytes)}
                </p>
              </div>

              <button
                className="app-btn"
                onClick={() => openFile(f.id)}
              >
                Open
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>
            No personalized files yet.
          </h3>

          <p className="muted">
            Once Cody builds your plan, videos and documents he assigns to you
            will show up here and remain available to you permanently.
          </p>
        </div>
      )}
    </main>
  </div>
);
}
