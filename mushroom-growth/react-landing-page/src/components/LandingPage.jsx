import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Check if there is local data stored
    const savedSubstrate = localStorage.getItem('substrate');
    const savedTemperature = localStorage.getItem('temperature');
    const savedPh = localStorage.getItem('ph');

    if (savedSubstrate || savedTemperature || savedPh) {
      setHasHistory(true); // Enable the "View History" button if data exists
    }
  }, []);

  const handleStartClick = () => {
    navigate('/condition-setting');
  };

  const handleViewHistoryClick = () => {
    navigate('/growth-history'); // Navigate to the GrowthHistory page
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Mushroom Growth</h1>
      </header>
      <main className="landing-content">
        <button className="start-button" onClick={handleStartClick}>
          Start Growing
        </button>
        {hasHistory && (
          <button className="view-history-button" onClick={handleViewHistoryClick}>
            View History
          </button>
        )}
      </main>
    </div>
  );
};

export default LandingPage;