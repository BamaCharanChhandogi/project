import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import Hoodie from './components/HoodieExperience';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <Hoodie />
  </StrictMode>
);
