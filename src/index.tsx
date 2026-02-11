import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CloudService } from './services/cloud.service';

// Initialize CloudService before mounting app
const cloudService = new CloudService();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Initialize cloud service, then render app
cloudService.initialize().then(() => {
  root.render(
    <React.StrictMode>
      <App cloudService={cloudService} />
    </React.StrictMode>
  );
});
