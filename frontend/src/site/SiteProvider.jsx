import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { siteDefaults, photoDefaults, textKeys } from './defaults';

const Context = createContext(null);

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.message || 'Request failed.');
  return result;
}

export function SiteProvider({ children }) {
  const { user, loading } = useSelector(s => s.session);
  const trainer = Boolean(user?.isTrainer);
  const [published, setPublished] = useState({});
  const [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);

  const loadPublic = async () => {
    const result = await request('/api/site-content');
    setPublished(result.published || {});
  };
  const loadEditor = async () => {
    const result = await request('/api/site-content/editor');
    setPublished(result.published || {});
    setDraft(result.draft || {});
    setCanRestore(Boolean(result.canRestore));
    setPhotoVersion(v => v + 1);
  };

  useEffect(() => { loadPublic().catch(err => setError(err.message)); }, []);
  useEffect(() => {
    if (loading) return;
    if (trainer) loadEditor().catch(err => setError(err.message));
    else { setEditing(false); setDraft({}); }
  }, [trainer, loading]);

  const values = editing && trainer ? draft : published;
  const get = key => values[key] ?? published[key] ?? siteDefaults[key] ?? '';
  const imageSrc = key => {
    const useDraft = editing && trainer;
    const value = useDraft ? (draft[key] ?? published[key]) : published[key];
    if (!value) return photoDefaults[key];
    return '/api/site-content/images/' + encodeURIComponent(key) +
      (useDraft ? '?draft=1&v=' + photoVersion : '');
  };
  const setText = (key, value) => {
    if (!trainer || !editing || !textKeys.includes(key)) return;
    setDraft(prev => ({ ...prev, [key]: value }));
    setNote('');
  };
  const saveDraftInternal = async () => {
    const changes = {};
    for (const key of textKeys) {
      if (Object.hasOwn(draft, key)) changes[key] = draft[key];
    }
    const result = await request('/api/site-content/draft', {
      method: 'PUT', body: JSON.stringify({ changes })
    });
    setDraft(result.draft || {});
  };
  const withBusy = async (task, success) => {
    setBusy(true); setError(''); setNote('');
    try { await task(); if (success) setNote(success); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const saveDraft = () => withBusy(saveDraftInternal, 'Draft saved. Visitors cannot see it yet.');
  const publish = () => withBusy(async () => {
    await saveDraftInternal();
    const result = await request('/api/site-content/publish', { method: 'POST' });
    setPublished(result.published || {});
    setDraft(result.published || {});
    setCanRestore(Boolean(result.canRestore));
    setPhotoVersion(v => v + 1);
  }, 'Changes published.');
  const restore = () => withBusy(async () => {
    const result = await request('/api/site-content/restore', { method: 'POST' });
    setPublished(result.published || {});
    setDraft(result.draft || {});
    setCanRestore(Boolean(result.canRestore));
    setPhotoVersion(v => v + 1);
  }, 'Previous published version restored.');

  const uploadPhoto = async (slot, file) => {
    if (!trainer || !editing || !file) return;
    setBusy(true); setError(''); setNote('');
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size < 1 || file.size > 8 * 1024 * 1024) throw new Error('Choose a JPEG, PNG, or WebP under 8 MB.');
      const signed = await request('/api/site-content/images/presign', {
        method: 'POST', body: JSON.stringify({ slot, mimeType: file.type, sizeBytes: file.size })
      });
      const result = await fetch(signed.uploadUrl, {
        method: 'PUT', headers: { 'Content-Type': file.type }, body: file
      });
      if (!result.ok) throw new Error('Photo upload failed. Check S3 CORS settings.');
      const completed = await request('/api/site-content/images/complete', {
        method: 'POST', body: JSON.stringify({ slot, key: signed.key })
      });
      setDraft(completed.draft || {});
      setPhotoVersion(v => v + 1);
      setNote('Photo added to the draft. Publish to make it public.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const context = useMemo(() => ({
    trainer, editing, setEditing, get, imageSrc, setText,
    saveDraft, publish, restore, uploadPhoto, canRestore, busy, error, note
  }), [trainer, editing, values, published, photoVersion, canRestore, busy, error, note]);
  return <Context.Provider value={context}>{children}</Context.Provider>;
}

export function useSite() {
  const value = useContext(Context);
  if (!value) throw new Error('SiteProvider is missing.');
  return value;
}
