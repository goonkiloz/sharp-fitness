import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
async function api(url, options={}) {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type':'application/json', ...(options.headers||{}) }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const restoreSession = createAsyncThunk('session/restore', async () => (await api('/api/session')).user);
export const login = createAsyncThunk('session/login', async payload => (await api('/api/session',{method:'POST',body:JSON.stringify(payload)})).user);
export const signup = createAsyncThunk('session/signup', async payload => (await api('/api/users',{method:'POST',body:JSON.stringify(payload)})).user);
export const logout = createAsyncThunk('session/logout', async () => { await api('/api/session',{method:'DELETE'}); return null; });
const slice = createSlice({ name:'session', initialState:{user:null,loading:true,error:null}, reducers:{}, extraReducers:b=>{
  b.addCase(restoreSession.fulfilled,(s,a)=>{s.user=a.payload;s.loading=false}).addCase(restoreSession.rejected,s=>{s.loading=false});
  for (const t of [login,signup]) { b.addCase(t.pending,s=>{s.error=null}).addCase(t.fulfilled,(s,a)=>{s.user=a.payload;s.error=null}).addCase(t.rejected,(s,a)=>{s.error=a.error.message}); }
  b.addCase(logout.fulfilled,s=>{s.user=null});
}});
export default slice.reducer;
