import { Link } from 'react-router-dom';
import MarketingShell from '../site/MarketingShell';
import { Copy, Photo } from '../site/Editable';

export default function TrainingPage() {
  return <MarketingShell>
    <section className="site-inner-hero site-section">
      <div className="site-container site-two-column">
        <div><span className="site-eyebrow">PERSONAL TRAINING</span><Copy field="training.title" as="h1" /><Copy field="training.intro" as="p" /><Link className="site-button" to="/contact">Book a consultation ↗</Link></div>
        <Photo field="training.photo" alt="Fitness training at the gym" className="site-page-image" />
      </div>
    </section>
    <section className="site-section site-dark-panel">
      <div className="site-container">
        <div className="site-section-heading"><div><span className="site-eyebrow">CHOOSE YOUR FOCUS</span><h2>Ways we can work together.</h2></div></div>
        <div className="site-training-grid">
          <div><span>01 / BUILD</span><Copy field="training.strengthTitle" as="h3" /><Copy field="training.strengthDescription" as="p" /></div>
          <div><span>02 / CONNECT</span><Copy field="training.onlineTitle" as="h3" /><Copy field="training.onlineDescription" as="p" /></div>
          <div><span>03 / MOVE</span><Copy field="training.lifelongTitle" as="h3" /><Copy field="training.lifelongDescription" as="p" /></div>
        </div>
      </div>
    </section>
    <section className="site-section"><div className="site-container site-bottom-cta"><h2>Build your training plan.</h2><p>Not sure which option fits? Start with a conversation about your goals.</p><Link className="site-button" to="/pricing">View programs & pricing ↗</Link></div></section>
  </MarketingShell>;
}
