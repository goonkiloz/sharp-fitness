import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/session';
import { EditorBar } from './Editable';
import '../styles/site.css';

const navItems = [
  ['/', 'Home'], ['/about', 'About'], ['/training', 'Training'],
  ['/pricing', 'Pricing'], ['/contact', 'Contact']
];

export default function MarketingShell({ children }) {
  const { user } = useSelector(s => s.session);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isTrainer = Boolean(user?.isTrainer);
  useEffect(() => {
    const titles = {
      '/': 'Personal Training in San Diego',
      '/about': 'Meet Cody Sharp',
      '/training': 'Personal Training and Online Coaching',
      '/pricing': 'Programs and Pricing',
      '/contact': 'Book a Free Consultation'
    };
    document.title = (titles[pathname] || 'Sharp Fitness') + ' | Sharp Fitness';
    window.scrollTo(0, 0);
  }, [pathname]);
  const signOut = async () => {
    try { await dispatch(logout()).unwrap(); navigate('/'); }
    catch (err) { console.error('Sign-out failed:', err); }
  };
  return <div className="site-marketing">
    <div className="site-announcement">Personal training in San Diego and online. <Link to="/contact">Book a free consultation →</Link></div>
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link to="/" className="site-logo">
          <img src="/images/sharp-fitness-logo-a24843b318e0.png" alt="" />
          <span>SHARP FITNESS</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => isActive ? 'site-nav-active' : ''}>{label}</NavLink>)}
        </nav>
        <div className="site-account-actions">
          {user ? <>
            <Link className="site-account-link" to={isTrainer ? '/trainer' : '/account'}>{isTrainer ? 'Trainer dashboard' : 'My account'}</Link>
            <button type="button" className="site-sign-out" onClick={signOut}>Log out</button>
          </> : <>
            <Link className="site-account-link" to="/login">Client login</Link>
            <Link className="site-header-cta" to="/contact">Book now</Link>
          </>}
        </div>
      </div>
    </header>
    <EditorBar />
    <main>{children}</main>
    <footer className="site-footer">
      <div className="site-container site-footer-inner">
        <div><strong>SHARP FITNESS</strong><small>Personal training • San Diego & online</small></div>
        <div><Link to="/about">About</Link><Link to="/training">Training</Link><Link to="/pricing">Pricing</Link><Link to="/contact">Contact</Link></div>
        <small>© {new Date().getFullYear()} Sharp Fitness</small>
      </div>
    </footer>
  </div>;
}
