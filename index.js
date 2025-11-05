import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <div className="container">
      <h1>Amar Shikkha — Madrasa ERP</h1>
      <p>This is a production scaffold. Use the README for setup and Render deployment.</p>
      <p>Available quick links:</p>
      <ul>
        <li>Login (API)</li>
        <li>Students management</li>
        <li>Teachers management</li>
        <li>Fees, Attendance, Results</li>
      </ul>
      <p>UI is minimal on purpose; expand as needed or ask me to build a full UI.</p>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
