import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoSrc from '../assets/images/cslogo.png'; // Ensure this path is correct
import { Pie } from 'react-chartjs-2'; // Import Pie chart
import {
    Chart as ChartJS,
    ArcElement, // Needed for Pie chart
    Tooltip,
    Legend,
    Title,
    // Line chart elements are no longer needed unless you keep the illustrative one
    // LineElement, PointElement, CategoryScale, LinearScale,
} from 'chart.js';

// Adjust the path to your CSS file as needed
import '../styles/GrowthReport.css';

// Register required components for Chart.js
// Note: Removed Line chart elements, added ArcElement
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// --- Helper Function ---
/**
 * Formats a date string (YYYY-MM-DD) to DD-MM-YYYY.
 * @param {string} dateString - Input date string in format.
 * @returns {string} Formatted date string or 'N/A'.
 */
function formatDate_DDMMYYYY(dateString) {
    if (!dateString || dateString === 'N/A' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return 'N/A';
    }
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'N/A';
    }
}

/**
 * GrowthReport Component
 * Displays a detailed report for a single growth simulation entry.
 */
const GrowthReport = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State for the report data and derived values
    const [entryData, setEntryData] = useState(null);
    const [parsedSubstrate, setParsedSubstrate] = useState({});
    const [temperature, setTemperature] = useState('N/A');
    const [ph, setPh] = useState('N/A');
    const [yieldValue, setYieldValue] = useState(0);
    const [days, setDays] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalSubstrateWeight, setTotalSubstrateWeight] = useState(0); // State for total weight

    // Map internal keys to user-friendly display names for substrate
    const substrateDisplayNames = {
        riceBran: 'Rice Bran',
        corn: 'Corn Cob',
        sugarcane: 'Sugarcane',
        sawdust: 'Sawdust',
    };

    // Effect hook to process the entry data received from navigation state
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        if (location.state && location.state.entryData) {
            const data = location.state.entryData;
            setEntryData(data);

            // --- Parse Substrate ---
            let substrateDetails = {};
            let currentTotalWeight = 0;
            if (data.substrate) {
                if (typeof data.substrate === 'object') {
                    substrateDetails = data.substrate;
                } else if (typeof data.substrate === 'string') {
                    try {
                        substrateDetails = JSON.parse(data.substrate);
                        if (typeof substrateDetails !== 'object' || substrateDetails === null) {
                            substrateDetails = {};
                        }
                    } catch (e) {
                        console.error("Failed to parse substrate JSON string:", e);
                        setError("Failed to parse substrate data.");
                        substrateDetails = {};
                    }
                }
                 // Calculate total weight after parsing
                 currentTotalWeight = Object.values(substrateDetails).reduce((sum, weight) => sum + (Number(weight) || 0), 0);
            }
            setParsedSubstrate(substrateDetails);
            setTotalSubstrateWeight(currentTotalWeight); // Set total weight


            // --- Parse Conditions (Temp & pH) ---
            let tempVal = 'N/A';
            let phVal = 'N/A';
            if (data.conditions && typeof data.conditions === 'string') {
                const tempMatch = data.conditions.match(/Temp:\s*([\d.]+)/);
                const phMatch = data.conditions.match(/pH:\s*([\d.]+)/);
                if (tempMatch && tempMatch[1]) tempVal = tempMatch[1];
                if (phMatch && phMatch[1]) phVal = phMatch[1];
            }
            setTemperature(tempVal);
            setPh(phVal);

            // --- Set Yield and Days ---
            setYieldValue(Number(data.yield) || 0);
            setDays(Number(data.days) || 0);

            setIsLoading(false);
        } else {
            console.error("No entry data found in navigation state.");
            setError("Could not load report data. Please go back to history and select an entry.");
            setIsLoading(false);
        }
    }, [location.state]);

    const handleBackClick = () => navigate('/growth-history');
    const handleHomeClick = () => navigate('/');
    const handleSaveReport = () => alert("Save report functionality not implemented.");
    const handleDeleteReport = () => alert("Delete report functionality not implemented.");

    // --- Pie Chart Configuration ---
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'var(--brown)', // White labels for legend
                    font: { size: 12, family: "'Lexend', sans-serif" },
                    boxWidth: 15,
                    padding: 15
                }
            },
            tooltip: { // Optional: Customize tooltips
                bodyFont: { family: "'Lexend', sans-serif" },
                titleFont: { family: "'Lexend', sans-serif" },
                 callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            // Calculate percentage
                            const percentage = ((context.parsed / totalSubstrateWeight) * 100).toFixed(1);
                            label += `${context.raw}g (${percentage}%)`;
                        }
                        return label;
                    }
                }
            },
             title: { // Optional: Add title to pie chart section if needed
                 display: false, // Title displayed by section H3 instead
             }
        },
    };

    const pieData = {
        // Use display names for labels
        labels: Object.keys(parsedSubstrate).map(key => substrateDisplayNames[key] || key),
        datasets: [
            {
                // Ensure data values are numbers, use 0 if empty or invalid
                data: totalSubstrateWeight > 0
                    ? Object.values(parsedSubstrate).map(v => Number(v) || 0)
                    : [1], // Show a placeholder slice if total is 0
                backgroundColor: totalSubstrateWeight > 0
                    ? ['#f3f2a4', '#c5e99b', '#a56a2a', '#f0a008'] // Example theme colors (adjust order/add more if needed)
                    : ['#666'], // Grey placeholder color
                borderColor: 'var(--lightgreen)', // Match background for separation
                borderWidth: totalSubstrateWeight > 0 ? 2 : 0,
            },
        ],
    };
    // --- End Pie Chart Configuration ---


    // --- Render Logic ---
    if (isLoading) { return <div className="growth-report loading"><p>Loading report...</p></div>; }
    if (error || !entryData) {
        return (
            <div className="growth-report error-page">
                 <header className="report-header"> <button className="back-button" onClick={handleBackClick}> &larr; </button> <h1>Error</h1> </header>
                 <main className="report-content"> <p className="error-message">{error || "Report data not found."}</p> <button className="home-button" onClick={handleHomeClick}> Home </button> </main>
            </div>
        );
    }

    // --- Main component render with updated structure ---
    return (
        <div className="growth-report">
            {/* Header */}
            <header className="report-header">
            <div className="logobox">
                    <div className="logo"> <img src={logoSrc} alt="City Sprouts Logo" /> </div>
                </div>
                <h1>Growth Report</h1>
            </header>

            {/* Main Content Area */}
            <main className="report-content-grid">

                {/* Left Column/Area */}
                <div className="report-left-column">
                     {/* Substrate Pie Chart Section */}
                     <div className="report-section substrate-pie-chart">
                        <h3>Substrate Composition (%)</h3>
                        <div className="pie-chart-container"> {/* Added container for sizing */}
                           {totalSubstrateWeight > 0 ? (
                                <Pie data={pieData} options={pieOptions} />
                           ) : (
                                <p className="pie-chart-placeholder">
                                    No substrate data to display chart.
                                </p>
                           )}
                        </div>
                    </div>

                    {/* Environmental Conditions Section */}
                    <div className="report-section environmental-conditions">
                        <h3>Environmental Conditions</h3>
                        <div className="condition-item"> <span>Temperature:</span> <span>{temperature}°C</span> </div>
                        <div className="condition-item"> <span>pH:</span> <span>{ph}</span> </div>
                        <div className="condition-item"> <span>Duration:</span> <span>{days} days</span> </div>
                    </div>

                </div>

                {/* Right Column/Area */}
                <div className="report-right-column">
                              {entryData.batchName && entryData.batchName !== 'N/A' && (
                    <span className="batch-name-display">{entryData.batchName}</span>
                )}
                    {/* Substrate Composition Details Section */}
                    <div className="report-section substrate-composition-details">
                        <h3>Substrate Composition (g)</h3>
                        {Object.entries(parsedSubstrate).length > 0 ? (
                            Object.entries(parsedSubstrate).map(([key, value]) => {
                                const displayName = substrateDisplayNames[key] || key.charAt(0).toUpperCase() + key.slice(1);
                                const amount = Number(value);
                                return (
                                    <div key={key} className="substrate-item">
                                        <span>{displayName}:</span>
                                        <span>{isNaN(amount) ? value : amount + 'g'}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p>No substrate details available.</p>
                        )}
                         <div className="substrate-item total-weight">
                            <span><b>Total Weight:</b></span>
                            <span><b>{totalSubstrateWeight}g</b></span>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="report-section results-summary">
                        <h3>Results</h3>
                         <div className="result-item"> <span>Projected Yield:</span> <span>{yieldValue}g</span> </div>
                         <div className="result-item"> <span>Start Date:</span> <span>{formatDate_DDMMYYYY(entryData.startDate) ?? 'N/A'}</span> </div>
                         <div className="result-item"> <span>End Date:</span> <span>{entryData.endDate ?? 'N/A'}</span> </div>
                         {/* C:N Ratio could be added here if it were saved in entryData */}
                         {/* <div className="result-item"> <span>C:N Ratio:</span> <span>{entryData.cnRatio ?? 'N/A'}</span> </div> */}
                    </div>

                     {/* Removed illustrative line chart section */}
                     {/* You could add notes or other summary info here instead */}

                </div>

            </main>

             {/* Footer Buttons Area */}
            <footer className="report-footer">
            <button className="home-button" onClick={handleHomeClick}>Home</button>
            <button className="save-report-button" onClick={handleBackClick}>Back</button>
            </footer>
        </div>
    );
};

export default GrowthReport;
