import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// ⭐ CRITICAL FIX: IMPORT YOUR STYLESHEET HERE
import './index.css'; 
// If your styles are in a separate 'styles' folder, adjust the path:
// import './styles/index.css'; 


const container = document.getElementById('root');
const root = createRoot(container!); 

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);