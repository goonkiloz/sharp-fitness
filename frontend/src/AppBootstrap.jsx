import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { restoreSession } from './redux/session';
export default function AppBootstrap({children}){const dispatch=useDispatch();useEffect(()=>{dispatch(restoreSession())},[dispatch]);return children;}
