import React, { useEffect, useState } from 'react';
import '../styles/GrowthReport.css';
import { useNavigate } from 'react-router-dom';

const GrowthReport = () => {
  const navigate = useNavigate();
  const [substrate, setSubstrate] = useState({});
  const [temperature, setTemperature] = useState(0);
  const [ph, setPh] = useState(0);

  useEffect(() => {
    // Retrieve substrate values and other conditions from localStorage
    const savedSubstrate = JSON.parse(localStorage.getItem('substrate'));
    const savedTemperature = localStorage.getItem('temperature');
    const savedPh = localStorage.getItem('ph');

    if (savedSubstrate) {
      setSubstrate(savedSubstrate);
    }
    if (savedTemperature) {
      setTemperature(savedTemperature);
    }
    if (savedPh) {
      setPh(savedPh);
    }
  }, []);

  const handleBackClick = () => {
    navigate('/growth-simulation'); // Navigate back to the Growth Simulation page
  };

  const handleHomeClick = () => {
    navigate('/'); // Navigate to the Landing Page
  };

  return (
    <div className="growth-report">
      <header className="report-header">
        <button className="back-button" onClick={handleBackClick}>
          ←
        </button>
        <h1>Growth Report</h1>
      </header>
      <main className="report-content">
        <div className="yield-chart">
          <h3>Yield Chart</h3>
          <div className="chart-placeholder">
            <p>Yield vs Time Chart</p>
          </div>
        </div>
        <div className="chosen-conditions">
          <h3>Chosen Conditions:</h3>
          <table>
            <tbody>
              <tr>
                <td>Temperature</td>
                <td>{temperature}°C</td>
              </tr>
              <tr>
                <td>pH</td>
                <td>{ph}</td>
              </tr>
              {Object.keys(substrate).map((key) => (
                <tr key={key}>
                  <td>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                  <td>{substrate[key]}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="home-button" onClick={handleHomeClick}>
          Home
        </button>
      </main>
    </div>
  );
};

export default GrowthReport;