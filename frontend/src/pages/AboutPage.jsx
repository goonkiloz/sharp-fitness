import { Link } from 'react-router-dom';
import MarketingShell from '../site/MarketingShell';
import { Copy, Photo } from '../site/Editable';

export default function AboutPage() {
  return <MarketingShell>
    <section className="site-inner-hero site-section">
      <div className="site-container site-two-column">
        <div><span className="site-eyebrow">THE COACH BEHIND SHARP FITNESS</span><Copy field="about.title" as="h1" /><Copy field="about.intro" as="p" /><Link className="site-button" to="/contact">Work with Cody ↗</Link></div>
        <Photo field="about.portrait" alt="Sharp Fitness coach training in the gym" className="site-page-image" />
      </div>
    </section>
    <section className="site-section site-dark-panel">
      <div className="site-container site-story-grid">
        <div><span className="site-eyebrow">MY APPROACH</span><Copy field="about.storyTitle" as="h2" /></div>
        <div><Copy field="about.story" as="p" /><Link className="site-text-link" to="/training">Explore my training approach →</Link></div>
      </div>
    </section>
    <section className="site-section"><div className="site-container">
      <div className="site-section-heading"><div><span className="site-eyebrow">EDUCATION & EXPERIENCE</span><h2>Credentials that count.</h2></div></div>
      <div className="site-credential-list">
        <div><strong>Master's degree in Kinesiology</strong><span>Washburn University</span></div>
        <div><strong>Master Coach certification</strong><span>National Academy of Sports Medicine (NASM)</span></div>
        <div><strong>Master Coach certification</strong><span>International Sports Sciences Association (ISSA)</span></div>
        <div><strong>6+ years of bodybuilding training</strong><span>Strength and physique development</span></div>
      </div>
    </div></section>
  </MarketingShell>;
}
