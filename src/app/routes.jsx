import { lazy } from 'react';
import Home from '@/pages/Home';

/**
 * Route table.
 *
 * Everything except the home page is code split, so a visitor who only reads
 * the front page never downloads the studio's 3D bundle.
 */
const Studio = lazy(() => import('@/pages/Studio'));
const Work = lazy(() => import('@/pages/Work'));
const Capabilities = lazy(() => import('@/pages/Capabilities'));
const Contact = lazy(() => import('@/pages/Contact'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const routes = [
  { path: '/', element: <Home />, label: 'Home' },
  { path: '/studio', element: <Studio />, label: 'Studio' },
  { path: '/work', element: <Work />, label: 'Work' },
  { path: '/capabilities', element: <Capabilities />, label: 'Capabilities' },
  { path: '/contact', element: <Contact />, label: 'Contact' },
  { path: '*', element: <NotFound />, label: 'Not found' },
];

export default routes;
