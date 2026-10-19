import { Link } from 'react-router-dom';
import MarketingShell from '../site/MarketingShell';
import { Copy, Photo } from '../site/Editable';

export default function HomePage() {
  return <MarketingShell>
    <section className="site-home-hero">
      <div className="site-container site-hero-grid">
        <div className="site-hero-content">
          <span className="site-eyebrow">BUILT STRONGER. TRAIN SHARP.</span>
          <Copy field="home.heroTitle" as="h1" />
          <Copy field="home.heroDescription" as="p" />
          <div className="site-hero-buttons">
            <Link className="site-button" to="/contact">Book a free consultation <span>↗</span></Link>
            <Link className="site-button site-button-outline" to="/training">Explore training</Link>
          </div>
          <div className="site-hero-caption"><span /> INDIVIDUAL COACHING. REAL PROGRESS.</div>
        </div>
        <div className="site-hero-art">
          <Photo field="home.heroImage" alt="Cody training at the gym" />
          <div className="site-image-caption">01 / TRAIN WITH PURPOSE</div>
        </div>
      </div>
    </section>

    <section className="site-section site-intro-section">
      <div className="site-container site-intro-grid">
        <div><span className="site-eyebrow">THE SHARP APPROACH</span><Copy field="home.introTitle" as="h2" /></div>
        <div><Copy field="home.introDescription" as="p" /><Link className="site-text-link" to="/about">Meet your coach →</Link></div>
      </div>
    </section>
    <section className="site-section site-services-section">
      <div className="site-container">
        <div className="site-section-heading"><div><span className="site-eyebrow">YOUR GOALS. YOUR PROGRAM.</span><h2>One standard: progress.</h2></div><Link className="site-text-link" to="/training">See all training options →</Link></div>
        <div className="site-service-grid">
          <Link to="/training" className="site-service-card"><span>01</span><h3>Strength & physique</h3><Copy field="home.strengthDescription" as="p" /><strong>Discover training ↗</strong></Link>
          <Link to="/training" className="site-service-card"><span>02</span><h3>Online coaching</h3><Copy field="home.onlineDescription" as="p" /><strong>Learn about online coaching ↗</strong></Link>
          <Link to="/training" className="site-service-card"><span>03</span><h3>Fitness for life</h3><Copy field="home.lifelongDescription" as="p" /><strong>Find your path ↗</strong></Link>
        </div>
      </div>
    </section>
    <section className="site-home-cta site-section">
      <div className="site-container site-cta-content">
        <span className="site-eyebrow">THE NEXT STEP IS YOURS</span>
        <Copy field="home.ctaTitle" as="h2" />
        <Link className="site-button" to="/contact">Let's talk about your goals ↗</Link>
      </div>
    </section>
  </MarketingShell>;
}
