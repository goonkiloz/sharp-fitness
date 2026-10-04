import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ProgramsPage from '../pages/ProgramsPage';
import AccountPage from '../pages/AccountPage';
import NotFoundPage from '../pages/NotFoundPage';
import TrainerPage from '../pages/TrainerPage';
export default createBrowserRouter([
  { path:'/', element:<HomePage/> },
  { path:'/login', element:<LoginPage/> },
  { path:'/signup', element:<SignupPage/> },
  { path:'/programs', element:<ProgramsPage/> },
  { path:'/account', element:<AccountPage/> },
  { path:'/trainer', element:<TrainerPage/> },
  { path:'*', element:<NotFoundPage/> }
]);
