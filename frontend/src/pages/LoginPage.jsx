import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../redux/session';
import AppNav from '../components/AppNav';
export default function LoginPage(){
 const dispatch=useDispatch(), navigate=useNavigate(); const {user,error}=useSelector(s=>s.session); const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 if(user) return <Navigate to="/account" replace/>;
 return <div className="app-page"><AppNav/><main className="app-main"><div className="auth-card"><p className="eyebrow">CLIENT ACCOUNT</p><h1>Welcome back.</h1><form onSubmit={async e=>{e.preventDefault();const r=await dispatch(login({email,password}));if(!r.error)navigate('/account')}}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p className="error">{error}</p>}<button className="app-btn">Log in</button></form><p className="muted">New client? <Link to="/signup">Create an account.</Link></p></div></main></div>
}
