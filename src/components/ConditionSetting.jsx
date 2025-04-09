import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import '../styles/ConditionSetting.css';

// Register required components
ChartJS.register(ArcElement, Tooltip, Legend);

const ConditionSetting = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    // Save substrate, conditions, and yield to localStorage
    localStorage.setItem('substrate', JSON.stringify(substrate)); // Save as JSON
    localStorage.setItem('temperature', temperature);
    localStorage.setItem('ph', ph);
    localStorage.setItem('yield', totalYield);
  
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

  const [totalYield, setTotalYield] = useState(0);

  const substrateLabels = {
    riceBran: 'Rice Bran',
    corn: 'Corn Cob', // Updated label
    sugarcane: 'Sugarcane',
    sawdust: 'Sawdust',
  };

  const handleSubstrateChange = (key, value) => {
    const numericValue = parseInt(value, 10) || 0; // Ensure the value is a number
    setSubstrate((prev) => ({
      ...prev,
      [key]: numericValue,
    }));
  };

  useEffect(() => {
    // Calculate the total yield whenever substrate values change
    const total = Object.values(substrate).reduce((sum, weight) => sum + weight, 0);
    setTotalYield(total);
  }, [substrate]);

  const pieOptions = {
    plugins: {
      legend: {
        labels: {
          color: '#FFF6F6',
          font: {
            size: 14,
          },
        },
      },
    },
  };

  const pieData = {
    labels: Object.values(substrateLabels),
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
                    {substrateLabels[key]} (g):
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
          <div className="yield-display">
            <h3>Total Yield: {totalYield}g</h3> {/* Display the total yield */}
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