import { useState } from 'react';
import MarketingShell from '../site/MarketingShell';
import { Copy } from '../site/Editable';

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true); setMessage(''); setError(false);
    const form = e.currentTarget;
    const values = new FormData(form);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.get('name'), contact: values.get('contact'),
          goal: values.get('goal'), interestedIn: values.get('interestedIn'),
          message: values.get('message')
        })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Could not send your request.');
      setMessage(result.message || 'Thank you! Cody received your request.');
      form.reset();
    } catch (err) {
      setMessage(err.message + ' You can also call or text 619-642-1150.');
      setError(true);
    } finally { setBusy(false); }
  };

  return <MarketingShell>
    <section className="site-section site-contact-intro"><div className="site-container">
      <span className="site-eyebrow">GET IN TOUCH</span><Copy field="contact.title" as="h1" /><Copy field="contact.intro" as="p" />
    </div></section>
    <section className="site-section site-contact-section"><div className="site-container site-contact-grid">
      <form onSubmit={submit} className="site-contact-form">
        <h2>Free consultation request</h2>
        <label>Your name<input name="name" autoComplete="name" required /></label>
        <label>Phone or email<input name="contact" autoComplete="email" required /></label>
        <label>Your main goal<select name="goal">
          <option>Build muscle</option><option>Lose fat</option><option>Bodybuilding prep</option>
          <option>Training for my child or teen</option><option>Senior fitness</option><option>Something else</option>
        </select></label>
        <label>Interested in<select name="interestedIn">
          <option>Not sure yet</option><option>Workout and nutrition program</option>
          <option>Online coaching with nutrition plan</option><option>1-on-1 coaching</option>
        </select></label>
        <label>Anything else Cody should know?<textarea name="message" rows="4" /></label>
        <button type="submit" className="site-button" disabled={busy}>{busy ? 'Sending…' : 'Send my request ↗'}</button>
        {message && <p className={error ? 'site-form-error' : 'site-form-success'} role="status">{message}</p>}
      </form>
      <aside className="site-contact-aside">
        <span className="site-eyebrow">SHARP FITNESS</span><h2>Prefer to reach out directly?</h2>
        <p>Personal training in San Diego and online.</p>
        <div><span>CALL OR TEXT</span><a href="tel:+16196421150">619-642-1150</a></div>
        <div><span>EMAIL</span><a href="mailto:codysharp011@outlook.com">codysharp011@outlook.com</a></div>
        <div><span>INSTAGRAM</span><a href="https://instagram.com/c0dyylifts" target="_blank" rel="noopener noreferrer">@c0dyylifts</a></div>
        <div><span>TIKTOK</span><a href="https://www.tiktok.com/@codyylifts" target="_blank" rel="noopener noreferrer">@codyylifts</a></div>
      </aside>
    </div></section>
  </MarketingShell>;
}
