import { useRef } from 'react';
import { useSite } from './SiteProvider';
import { photoDefaults } from './defaults';
import { maxTextLengths } from './limits';

export function Copy({ field, as: Tag = 'p', className = '' }) {
  const { get, editing, trainer, setText } = useSite();
  const value = get(field);
  const editable = trainer && editing;
  return <div className={editable ? 'site-edit-field' : 'site-copy-field'}>
    <Tag className={className}>{value}</Tag>
    {editable && <label className="site-editor-label">
      Edit {field.split('.').slice(1).join(' ')}
      <textarea rows={Math.min(5, Math.max(2, Math.ceil(value.length / 65)))}
        maxLength={maxTextLengths[field] || 500}
        value={value} onChange={e => setText(field, e.target.value)}
        aria-label={'Edit ' + field} />
      <small>{value.length} characters</small>
    </label>}
  </div>;
}

export function Photo({ field, alt, className = '' }) {
  const input = useRef(null);
  const { imageSrc, editing, trainer, busy, uploadPhoto } = useSite();
  return <div className={'site-photo-wrap ' + className}>
    <img src={imageSrc(field) || photoDefaults[field]} alt={alt} />
    {editing && trainer && <div className="site-photo-edit">
      <button type="button" disabled={busy} onClick={() => input.current?.click()}>Replace photo</button>
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp"
        onChange={e => { const file = e.target.files?.[0]; if (file) uploadPhoto(field, file); e.target.value = ''; }} />
    </div>}
  </div>;
}

export function EditorBar() {
  const { trainer, editing, setEditing, busy, error, note, saveDraft, publish, restore, canRestore } = useSite();
  if (!trainer) return null;
  return <div className="site-editor-bar">
    <span><strong>Trainer controls</strong><small>{editing ? 'Editing draft — not live' : 'Viewing published site'}</small></span>
    {!editing ? <button type="button" onClick={() => setEditing(true)}>✎ Edit website</button> :
      <div className="site-editor-actions">
        <button type="button" className="site-editor-secondary" disabled={busy} onClick={saveDraft}>Save draft</button>
        <button type="button" disabled={busy} onClick={publish}>{busy ? 'Working…' : 'Publish changes'}</button>
        <button type="button" className="site-editor-secondary" disabled={busy || !canRestore}
          onClick={() => { if (window.confirm('Restore the previous published website?')) restore(); }}>Restore previous</button>
        <button type="button" className="site-editor-secondary" disabled={busy} onClick={() => setEditing(false)}>Exit editor</button>
      </div>}
    {(error || note) && <p className={error ? 'site-editor-error' : 'site-editor-note'} role="status">{error || note}</p>}
  </div>;
}
