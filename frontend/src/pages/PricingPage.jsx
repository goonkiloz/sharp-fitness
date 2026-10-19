import { Link } from 'react-router-dom';
import MarketingShell from '../site/MarketingShell';
import { Copy } from '../site/Editable';

const programs = [
  {
    name: 'Workout & nutrition program', price: '$20', unit: 'starting at · one time',
    summary: 'A personalized 16-week plan. Keep access to everything Cody delivers.',
    href: '/programs?plan=workout-nutrition-program'
  },
  {
    name: 'Online coaching & nutrition', price: '$100', unit: 'starting at · per month',
    summary: 'Remote training, nutrition guidance, and support built around your goals.',
    href: '/programs?plan=online-coaching'
  },
  {
    name: '1-on-1 coaching', price: '$200', unit: 'per month',
    summary: 'Personalized training and regular check-ins, in person or online.',
    href: '/programs?plan=one-on-one-coaching'
  }
];

export default function PricingPage() {
  return <MarketingShell>
    <section className="site-inner-hero site-section site-pricing-hero"><div className="site-container">
      <span className="site-eyebrow">PROGRAMS & PRICING</span>
      <Copy field="pricing.title" as="h1" />
      <Copy field="pricing.intro" as="p" />
    </div></section>
    <section className="site-section site-pricing-section"><div className="site-container site-price-grid">
      {programs.map((p, i) => <article key={p.name} className="site-price-card">
        <span className="site-eyebrow">PROGRAM 0{i + 1}</span>
        <h2>{p.name}</h2><p>{p.summary}</p>
        <strong>{p.price}</strong><small>{p.unit}</small>
        <Link className="site-button" to={p.href}>See program details ↗</Link>
      </article>)}
    </div></section>
    <section className="site-section site-dark-panel"><div className="site-container site-bottom-cta"><h2>Need help choosing?</h2><p>Talk through your goals before committing to a program.</p><Link className="site-button" to="/contact">Book a free consultation ↗</Link></div></section>
  </MarketingShell>;
}
