import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import '../styles/ConditionSetting.css';

// Register required components
ChartJS.register(ArcElement, Tooltip, Legend);

const ConditionSetting = () => {
  const navigate = useNavigate();
  const handleStartClick = () => {
    // Save substrate and other conditions to localStorage
    localStorage.setItem('substrate', JSON.stringify(substrate));
    localStorage.setItem('temperature', temperature);
    localStorage.setItem('ph', ph);
    navigate('/growth-simulation'); // Navigate to the Growth Simulation page
  };

  const handleBackClick = () => {
    navigate('/'); // Navigate back to the Landing Page
  };

  const [temperature, setTemperature] = useState(25);
  const [ph, setPh] = useState(7);
  const [substrate, setSubstrate] = useState({
    riceBran: 25,
    corn: 25,
    sugarcane: 25,
    sawdust: 25,
  });

  const handleSubstrateChange = (key, value) => {
    const numericValue = parseInt(value, 10) || 0; // Ensure the value is a number
    setSubstrate((prev) => ({
      ...prev,
      [key]: numericValue,
    }));
  };

  const pieOptions = {
    plugins: {
      legend: {
        labels: {
          color: '#FFF6F6', // Change this to your desired label color
          font: {
            size: 14, // Optional: Adjust the font size
          },
        },
      },
    },
  };

  const pieData = {
    labels: ['Rice Bran', 'Corn', 'Sugarcane', 'Sawdust'], // Updated labels
    datasets: [
      {
        data: Object.values(substrate),
        backgroundColor: ['#FFF6F6', '#7E9777', '#FF914D', '#8B4513'],
      },
    ],
  };

  return (
    <div className="condition-setting">
      <header className="condition-header">
        <button className="back-button" onClick={handleBackClick}>
          ←
        </button>
        <h1>Make Your Mushroom Grow</h1>
      </header>
      <main className="condition-content">
        <div className="sliders">
          <h3>Conditions:</h3>
          <div>
            <div>
              <label>Temperature: {temperature}°C</label>
              <input
                type="range"
                min="20"
                max="30"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
            <div>
              <label>pH: {ph}</label>
              <input
                type="range"
                min="6"
                max="7"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="bottom">
          <div className="substrate-sliders">
            <h3>Substrate Composition:</h3>
            <div className="substrate-labels">
              {Object.keys(substrate).map((key) => (
                <div key={key}>
                  <label>
                    {key.charAt(0).toUpperCase() + key.slice(1)} (g):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={substrate[key]}
                    onChange={(e) =>
                      handleSubstrateChange(key, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="pie-chart">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <button className="start-button" onClick={handleStartClick}>
            Start Growing
          </button>
        </div>
      </main>
    </div>
  );
};

export default ConditionSetting;