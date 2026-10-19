import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import TrainingPage from '../pages/TrainingPage';
import PricingPage from '../pages/PricingPage';
import ContactPage from '../pages/ContactPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ProgramsPage from '../pages/ProgramsPage';
import AccountPage from '../pages/AccountPage';
import NotFoundPage from '../pages/NotFoundPage';
import TrainerPage from '../pages/TrainerPage';
export default createBrowserRouter([
  { path:'/', element:<HomePage/> },
  { path:'/about', element:<AboutPage/> },
  { path:'/training', element:<TrainingPage/> },
  { path:'/pricing', element:<PricingPage/> },
  { path:'/contact', element:<ContactPage/> },
  { path:'/login', element:<LoginPage/> },
  { path:'/signup', element:<SignupPage/> },
  { path:'/programs', element:<ProgramsPage/> },
  { path:'/account', element:<AccountPage/> },
  { path:'/trainer', element:<TrainerPage/> },
  { path:'*', element:<NotFoundPage/> }
]);
