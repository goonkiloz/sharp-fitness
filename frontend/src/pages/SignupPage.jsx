import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '../redux/session';
import AppNav from '../components/AppNav';
export default function SignupPage(){
 const dispatch=useDispatch(),navigate=useNavigate();const {user,error}=useSelector(s=>s.session);const [form,setForm]=useState({firstName:'',lastName:'',email:'',password:''});
 if(user) return <Navigate to="/programs" replace/>;
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 return <div className="app-page"><AppNav/><main className="app-main"><div className="auth-card"><p className="eyebrow">SHARP FITNESS</p><h1>Create your account.</h1><form onSubmit={async e=>{e.preventDefault();const r=await dispatch(signup(form));if(!r.error)navigate('/programs')}}><div className="form-row"><label>First name<input value={form.firstName} onChange={e=>set('firstName',e.target.value)} required/></label><label>Last name<input value={form.lastName} onChange={e=>set('lastName',e.target.value)} required/></label></div><label>Email<input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required/></label><label>Password<input type="password" minLength="8" value={form.password} onChange={e=>set('password',e.target.value)} required/></label>{error&&<p className="error">{error}</p>}<button className="app-btn">Create account</button></form><p className="muted">Already have an account? <Link to="/login">Log in.</Link></p></div></main></div>
}
