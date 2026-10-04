import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/session';
export default function AppNav(){
  const user=useSelector(s=>s.session.user); const dispatch=useDispatch(); const navigate=useNavigate();
  return <nav className="app-nav"><Link className="brand-text" to="/">Sharp Fitness</Link><Link to="/programs">Programs</Link>{user?<><Link to={user.isTrainer?'/trainer':'/account'}>{user.isTrainer?'Trainer dashboard':'My account'}</Link><button onClick={async()=>{await dispatch(logout());navigate('/')}}>Log out</button></>:<><Link to="/login">Log in</Link><Link className="app-btn" to="/signup">Create account</Link></>}</nav>
}
