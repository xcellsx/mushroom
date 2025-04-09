import React, { useEffect, useState } from 'react';
import '../styles/GrowthReport.css';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';

// Register required components for Chart.js
ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale);

const GrowthReport = () => {
  const navigate = useNavigate();
  const [substrate, setSubstrate] = useState({});
  const [temperature, setTemperature] = useState(0);
  const [ph, setPh] = useState(0);
  const [yieldValue, setYieldValue] = useState(0);
  const [days, setDays] = useState(40);

  useEffect(() => {
    // Retrieve substrate values and other conditions from localStorage
    const savedSubstrate = JSON.parse(localStorage.getItem('substrate'));
    const savedTemperature = localStorage.getItem('temperature');
    const savedPh = localStorage.getItem('ph');
    const savedYield = localStorage.getItem('yield');

    if (savedSubstrate) {
      setSubstrate(savedSubstrate);
    }
    if (savedTemperature) {
      setTemperature(savedTemperature);
    }
    if (savedPh) {
      setPh(savedPh);
    }
    if (savedYield) {
      setYieldValue(savedYield);
    }
  }, []);

  const handleBackClick = () => {
    navigate('/growth-history'); // Navigate back to the Growth Simulation page
  };

  const handleHomeClick = () => {
    navigate('/'); // Navigate to the Landing Page
  };

  // Line chart data
  const lineData = {
    labels: ['Day 0', 'Day 20', 'Day 25', 'Day 30', 'Day 35', 'Day 40'], // X-axis labels
    datasets: [
      {
        label: 'Growth Stages',
        data: [0, 0, yieldValue * 0.625, yieldValue * 0.825, yieldValue * 0.925, yieldValue], // Dynamically calculate yield values
        borderColor: 'lightgreen',
        backgroundColor: 'lightgreen',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  // Line chart options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
      tooltip: {
        callbacks: {
          label: (context) => `Day ${context.raw}`, // Customize tooltip text
        },
      },
      title: {
        display: true,
        text: 'Yield Graph', // Title for the chart
        color: '#FFF',
        font: {
          size: 20,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Number of Days', // Label for the X-axis
          color: '#FFF',
          font: {
            size: 16,
          },
        },
        ticks: {
          color: '#FFF', // Set X-axis tick labels to white
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Set X-axis grid lines to a translucent white
        },
      },
      y: {
        title: {
          display: true,
          text: 'Yield', // Label for the Y-axis
          color: '#FFF',
          font: {
            size: 16,
          },
        },
        ticks: {
          color: '#FFF', // Set Y-axis tick labels to white
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Set Y-axis grid lines to a translucent white
        },
      },
    },
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
          <Line data={lineData} options={lineOptions} />        </div>
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
      {Object.keys(substrate).map((key) => {
        // Map keys to display names
        const displayNames = {
          riceBran: 'Rice Bran',
          corn: 'Corn Cob',
          sugarcane: 'Sugarcane',
          sawdust: 'Sawdust',
        };

        return (
          <tr key={key}>
            <td>{displayNames[key] || key.charAt(0).toUpperCase() + key.slice(1)}</td>
            <td>{substrate[key]}g</td>
          </tr>
        );
      })}
      <tr>
        <td>Yield</td>
        <td>{yieldValue}g</td>
      </tr>
      <tr>
        <td># of Days</td>
        <td>{days}</td>
      </tr>
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