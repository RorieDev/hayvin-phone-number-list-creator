import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { socketService } from './lib/socket';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Scraper from './pages/Scraper';
import Campaigns from './pages/Campaigns';
import CallLogs from './pages/CallLogs';
import './index.css';

function App() {
  useEffect(() => {
    // Connect to socket on mount
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/scraper" element={<Scraper />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/call-logs" element={<CallLogs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
