import React, { useEffect, useState } from 'react';
import '../styles/GrowthSimulation.css';
import animationGif from '../assets/vids/animation.gif'; // Import the GIF file
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';

// Import images for growth stages
import day0Image from '../assets/images/my0.jpg';
import day10Image from '../assets/images/my100.jpg';
import day25Image from '../assets/images/Day0.jpg';
import day30Image from '../assets/images/Day2.jpg';
import day35Image from '../assets/images/Day4.jpg';
import day40Image from '../assets/images/Day5.jpg';

// Register required components for Chart.js
ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale);

const GrowthSimulation = () => {
  const navigate = useNavigate();
  const [substrate, setSubstrate] = useState({});
  const [temperature, setTemperature] = useState(0);
  const [ph, setPh] = useState(0);
  const [yieldValue, setYieldValue] = useState(0);
  const [days, setDays] = useState(40);
  const [selectedImage, setSelectedImage] = useState(null); // State for the selected image

  // Images for each stage
  const stageImages = {
    0: day0Image, // Use imported image
    20: day10Image, // Use imported image
    25: day25Image, // Use imported image
    30: day30Image, // Use imported image
    35: day35Image, // Use imported image
    40: day40Image, // Use imported image
  };

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

  const handleViewReportClick = () => {
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const newEntry = {
      days,
      yield: `${yieldValue}g`,
      substrate: Object.entries(substrate)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}g`)
        .join(', '),
      conditions: `Temperature: ${temperature}°C, pH: ${ph}`,
      date: formatDate(new Date()),
    };

    const existingHistory = JSON.parse(localStorage.getItem('growthHistory')) || [];
    localStorage.setItem('growthHistory', JSON.stringify([...existingHistory, newEntry]));

    navigate('/'); // Navigate to the Growth Report page
  };

  const handleBackClick = () => {
    navigate('/condition-setting'); // Navigate back to the Condition Setting page
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
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Number of Days', // Label for the X-axis
        color: '#FFF', // Set label color to white
        font: {
          size: 16, // Font size for the label
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
        color: '#FFF', // Set label color to white
        font: {
          size: 16, // Font size for the label
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
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index; // Get the index of the clicked point
      const day = lineData.labels[index].replace('Day ', ''); // Extract the day from the label
      setSelectedImage(stageImages[day]); // Set the selected image based on the day
    }
  },
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
        <div className='graph'>
        {/* Line Chart */}
        <div className="line-chart">
          <h3>Yield vs Time Chart</h3>
          <Line data={lineData} options={lineOptions} />
        </div>

        {/* Display Selected Image */}
        {selectedImage && (
          <div className="selected-image">
                      <h3>Your Mushroom</h3>
            <img src={selectedImage} alt="Growth Stage" />
          </div>
        )}
        </div>

        <div className="chosen-conditions">
  <h3>Growth Conditions:</h3>
  <ul>
    {Object.keys(substrate).map((key) => {
      // Map keys to display names
      const displayNames = {
        riceBran: 'Rice Bran',
        corn: 'Corn Cob',
        sugarcane: 'Sugarcane',
        sawdust: 'Sawdust',
      };

      return (
        <li key={key}>
          {displayNames[key] || key.charAt(0).toUpperCase() + key.slice(1)}: {substrate[key]}g
        </li>
      );
    })}
    <li>Temperature: {temperature}°C</li>
    <li>pH: {ph}</li>
    <li>Yield: {yieldValue}g</li>
    <li># of Days: {days}</li>
  </ul>
</div>
        <button className="view-report-button" onClick={handleViewReportClick}>
          Done
        </button>
      </main>
    </div>
  );
};

export default GrowthSimulation;