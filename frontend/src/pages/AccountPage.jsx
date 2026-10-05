import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppNav from '../components/AppNav';

function formatBytes(bytes){
  const n=Number(bytes||0); if(!n)return '';
  const units=['B','KB','MB','GB']; let value=n,i=0;
  while(value>=1024&&i<units.length-1){value/=1024;i++;}
  return `${value.toFixed(i?1:0)} ${units[i]}`;
}

export default function AccountPage(){
 const {user,loading}=useSelector(s=>s.session);
 const [data,setData]=useState(null),[error,setError]=useState(''),[params]=useSearchParams();
 useEffect(()=>{if(user)fetch('/api/account',{credentials:'include'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.message||'Could not load account');return d}).then(setData).catch(e=>setError(e.message))},[user]);
 if(loading)return null;if(!user)return <Navigate to="/login" replace/>;
 if(user.isTrainer)return <Navigate to="/trainer" replace/>;
 const openFile=async(id)=>{setError('');try{const r=await fetch(`/api/files/${id}/access`,{credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.message||'Could not open file');window.open(d.url,'_blank','noopener,noreferrer')}catch(e){setError(e.message)}};
 return <div className="app-page"><AppNav/><main className="app-main">
  {params.get('checkout')==='success'&&<div className="notice">Payment received. Stripe will confirm access through the webhook; refresh if your plan does not appear immediately.</div>}
  <p className="eyebrow">CLIENT DASHBOARD</p><h1>Hey, {user.firstName}.</h1>
  <p className="muted">Your coaching history and personalized videos/documents live here. Anything Cody has already delivered stays in your account even if monthly coaching ends.</p>
  {error&&<p className="error">{error}</p>}
  <h2>Your programs & coaching</h2>
  {data?.purchases?.length?<div className="owned-list">{data.purchases.map(p=><article className="owned-item" key={p.id}><h3>{p.Product?.name}</h3><p>{p.Product?.description}</p><p className="muted">Status: {p.status}{p.Product?.billingType==='one_time'?' · 16-week personalized program with lifetime access to delivered materials':p.status==='canceled'?' · coaching ended; your delivered materials remain available':' · new materials are added while coaching remains active'}</p></article>)}</div>:<div className="empty-state"><h3>No purchases yet.</h3><p className="muted">Choose a program or coaching option to get started.</p><Link className="app-btn" to="/programs">Browse programs</Link></div>}
  <h2 className="section-heading">Your personalized files</h2>
  {data?.files?.length?<div className="file-list">{data.files.map(f=><article className="file-card" key={f.id}><div><span className="file-type">{f.mimeType?.startsWith('video/')?'VIDEO':'DOCUMENT'}</span>{f.Product?.name&&<p className="muted">Program: {f.Product.name}</p>}<h3>{f.title}</h3>{f.description&&<p>{f.description}</p>}<p className="muted">{f.originalName} · {formatBytes(f.sizeBytes)}</p></div><button className="app-btn" onClick={()=>openFile(f.id)}>Open</button></article>)}</div>:<div className="empty-state"><h3>No personalized files yet.</h3><p className="muted">Once Cody builds your plan, videos and documents he assigns to you will show up here and remain available to you permanently.</p></div>}
 </main></div>
}
