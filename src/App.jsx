import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ConditionSetting from './components/ConditionSetting';
import GrowthSimulation from './components/GrowthSimulation';
import GrowthReport from './components/GrowthReport'; // Import the new page
import GrowthHistory from './components/GrowthHistory';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/condition-setting" element={<ConditionSetting />} />
        <Route path="/growth-simulation" element={<GrowthSimulation />} />
        <Route path="/growth-report" element={<GrowthReport />} /> {/* New Route */}
        <Route path="/growth-history" element={<GrowthHistory />} />
      </Routes>
    </Router>
  );
}

export default App;