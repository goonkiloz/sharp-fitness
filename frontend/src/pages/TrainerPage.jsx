import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppNav from '../components/AppNav';

async function api(url, options={}){
  const res=await fetch(url,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.message||'Request failed');
  return data;
}
function formatDate(value){return value?new Date(value).toLocaleString():''}
function formatBytes(bytes){const n=Number(bytes||0);if(!n)return '';const u=['B','KB','MB','GB'];let v=n,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++}return `${v.toFixed(i?1:0)} ${u[i]}`}

export default function TrainerPage(){
  const {user,loading}=useSelector(s=>s.session);
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [form,setForm]=useState({userId:'',title:'',description:'',file:null});
  const load=()=>api('/api/trainer/dashboard').then(setData).catch(e=>setError(e.message));
  useEffect(()=>{if(user?.isTrainer)load()},[user]);
  const paidClients=useMemo(()=>data?.clients?.filter(c=>c.canReceiveNewContent)||[],[data]);
  if(loading)return null;if(!user)return <Navigate to="/login" replace/>;if(!user.isTrainer)return <Navigate to="/account" replace/>;

  const upload=async(e)=>{
    e.preventDefault();setError('');
    if(!form.file||!form.userId||!form.title.trim()){setError('Choose an eligible client, title, and file.');return}
    setBusy(true);
    try{
      const presign=await api('/api/trainer/uploads/presign',{method:'POST',body:JSON.stringify({userId:Number(form.userId),originalName:form.file.name,mimeType:form.file.type||'application/octet-stream',sizeBytes:form.file.size})});
      const put=await fetch(presign.uploadUrl,{method:'PUT',headers:{'Content-Type':form.file.type||'application/octet-stream'},body:form.file});
      if(!put.ok)throw new Error('The file upload to storage failed. Check the S3 bucket CORS/settings.');
      await api('/api/trainer/uploads/complete',{method:'POST',body:JSON.stringify({userId:Number(form.userId),title:form.title,description:form.description,storageKey:presign.key,originalName:form.file.name,mimeType:form.file.type||'application/octet-stream',sizeBytes:form.file.size})});
      setForm({userId:'',title:'',description:'',file:null});
      const input=document.getElementById('trainer-file');if(input)input.value='';
      await load();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  };
  const remove=async(id)=>{if(!confirm('Remove this file from the client account?'))return;try{await api(`/api/trainer/files/${id}`,{method:'DELETE'});await load()}catch(e){setError(e.message)}};
  const updateLead=async(id,status)=>{try{await api(`/api/trainer/contacts/${id}`,{method:'PATCH',body:JSON.stringify({status})});await load()}catch(e){setError(e.message)}};

  return <div className="app-page"><AppNav/><main className="app-main trainer-main">
    <p className="eyebrow">TRAINER DASHBOARD</p><h1>Cody's dashboard.</h1><p className="muted">Upload private client plans, videos, and documents, and manage consultation requests.</p>{error&&<p className="error">{error}</p>}
    <section className="trainer-section"><h2>Upload client material</h2><p className="muted">Clients can receive new material while monthly coaching is active or during the 16-week one-time program. Anything already delivered stays in their account permanently.</p>
      <form className="trainer-upload" onSubmit={upload}>
        <label>Client<select value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})} required><option value="">Choose an eligible client</option>{paidClients.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>)}</select></label>
        <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Week 1 workout / Squat form review" required/></label>
        <label>Description<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional note for this client"/></label>
        <label>Video or document<input id="trainer-file" type="file" accept="video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*" onChange={e=>setForm({...form,file:e.target.files?.[0]||null})} required/></label>
        <button className="app-btn" disabled={busy}>{busy?'Uploading...':'Upload to client'}</button>
      </form>
    </section>

    <section className="trainer-section"><h2>Clients</h2>{data?.clients?.length?<div className="trainer-clients">{data.clients.map(c=>{const purchases=c.Purchases||[];return <article className="trainer-client" key={c.id}><div className="client-head"><div><h3>{c.firstName} {c.lastName}</h3><p className="muted">{c.email}</p></div><span className={c.canReceiveNewContent?'status-pill active':'status-pill'}>{c.canReceiveNewContent?'CAN RECEIVE NEW CONTENT':'PAST / INACTIVE'}</span></div>{c.deliveryEndsAt&&<p className="muted">16-week delivery window ends {new Date(c.deliveryEndsAt).toLocaleDateString()}.</p>}{purchases.length>0&&<ul className="compact-list">{purchases.map(p=><li key={p.id}>{p.Product?.name} — {p.status}{p.Product?.billingType==='monthly'&&p.status==='canceled'?' (previously delivered files remain accessible)':''}</li>)}</ul>}<div className="client-files">{c.ClientFiles?.length?c.ClientFiles.map(f=><div className="trainer-file-row" key={f.id}><div><strong>{f.title}</strong><span>{f.originalName} · {formatBytes(f.sizeBytes)}</span></div><button onClick={()=>remove(f.id)}>Remove</button></div>):<p className="muted">No private files uploaded.</p>}</div></article>})}</div>:<p className="muted">No client accounts yet.</p>}</section>

    <section className="trainer-section"><h2>Consultation requests</h2>{data?.contacts?.length?<div className="lead-list">{data.contacts.map(c=><article className="lead-card" key={c.id}><div className="client-head"><div><h3>{c.name}</h3><p><strong>{c.contact}</strong></p></div><select value={c.status} onChange={e=>updateLead(c.id,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></div><p><strong>Goal:</strong> {c.goal||'—'}<br/><strong>Interested in:</strong> {c.interestedIn||'—'}</p>{c.message&&<p>{c.message}</p>}<p className="muted">Submitted {formatDate(c.createdAt)} · Email notification: {c.notificationSent?'sent':'not sent'}</p>{c.notificationError&&<p className="mail-warning">{c.notificationError}</p>}</article>)}</div>:<p className="muted">No consultation requests yet.</p>}</section>
  </main></div>
}
