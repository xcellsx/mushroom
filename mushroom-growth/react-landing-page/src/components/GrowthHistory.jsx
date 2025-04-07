import React, { useEffect, useState } from 'react';
import '../styles/GrowthHistory.css';
import { useNavigate } from 'react-router-dom';

const GrowthHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Retrieve growth history from localStorage
    const savedHistory = JSON.parse(localStorage.getItem('growthHistory')) || [];
    setHistory(savedHistory);
  }, []);

  const handleBackClick = () => {
    navigate('/'); // Navigate back to the Landing Page
  };

  return (
    <div className="growth-history">
      <header className="history-header">
        <button className="back-button" onClick={handleBackClick}>
          ←
        </button>
        <h1>Growth History</h1>
      </header>
      <main className="history-content">
        <h3>April</h3>
        <div className="history-list">
          {history.length > 0 ? (
            history.map((entry, index) => (
              <div className="history-item" key={index}>
                <div className="history-details">
                  <p><strong># of Days:</strong> {entry.days}</p>
                  <p><strong>Yield:</strong> {entry.yield}</p>
                  <p>{entry.substrate} | {entry.conditions}</p>
                </div>
                <div className="history-date">
                  <p><strong>Date:</strong> {entry.date}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No history available.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default GrowthHistory;