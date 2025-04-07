import React, { useEffect, useState } from 'react';
import '../styles/GrowthSimulation.css';
import animationGif from '../assets/vids/animation.gif'; // Import the GIF file
import { useNavigate } from 'react-router-dom';

const GrowthSimulation = () => {
  const navigate = useNavigate();
  const [substrate, setSubstrate] = useState({});
  const [temperature, setTemperature] = useState(0); // Add state for temperature
  const [ph, setPh] = useState(0); // Add state for pH

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

  const handleViewReportClick = () => {
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const newEntry = {
      days: 10, // Replace with actual value
      yield: '50g', // Replace with actual value
      substrate: Object.entries(substrate)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}g`)
        .join(', '), // Dynamically display substrate values
      conditions: `Temperature: ${temperature}°C, pH: ${ph}`, // Use retrieved values
      date: formatDate(new Date()), // Format the date as "dd/mm/yyyy"
    };

    const existingHistory = JSON.parse(localStorage.getItem('growthHistory')) || [];
    localStorage.setItem('growthHistory', JSON.stringify([...existingHistory, newEntry]));

    navigate('/growth-report'); // Navigate to the Growth Report page
  };

  const handleBackClick = () => {
    navigate('/condition-setting'); // Navigate back to the Condition Setting page
  };

  return (
    <div className="growth-simulation">
      <header className="simulation-header">
        <button className="back-button" onClick={handleBackClick}>
          ←
        </button>
        <h1>Growth Simulation</h1>
      </header>
      <main className="simulation-content">
        <div className="simulation-info">
          <div className="chosen-conditions">
            <h3>Chosen Conditions:</h3>
            <ul>
              {Object.keys(substrate).map((key) => (
                <li key={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {substrate[key]}g
                </li>
              ))}
              <li>Temperature: {temperature}°C</li>
              <li>pH: {ph}</li>
            </ul>
          </div>
          <div className="simulation-results">
            <p>Yield:</p>
            <p># of Days:</p>
            <p>C:N:</p>
          </div>
        </div>
        <div className="growth-animation">
          <img src={animationGif} alt="Growth Animation" />
        </div>
        <button className="view-report-button" onClick={handleViewReportClick}>
          View Report
        </button>
      </main>
    </div>
  );
};

export default GrowthSimulation;