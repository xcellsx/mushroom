import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import '../styles/ConditionSetting.css'; // Import the CSS file
import logoSrc from '../assets/images/cslogo.png'; // Ensure path is correct

// Register required chart components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define keys for localStorage for better management
const LOCAL_STORAGE_KEYS = {
    TEMPERATURE: 'conditionSetting_temperature',
    PH: 'conditionSetting_ph',
    SUBSTRATE: 'conditionSetting_substrate',
    SIMULATION_DAYS: 'conditionSetting_simulationDays',
    BATCH_NAME: 'sim_batch_name',
    START_DATE: 'sim_start_date',
};

// Default values
const DEFAULTS = {
    TEMPERATURE: 25,
    PH: 7.0,
    SUBSTRATE: { riceBran: 50, corn: 50, sugarcane: 50, sawdust: 50 },
    SIMULATION_DAYS: 40,
    BATCH_NAME: '',
    START_DATE: '',
};


const ConditionSetting = () => {
    const navigate = useNavigate();

    // --- State Variables ---
    // Initialize state using a function that checks localStorage first
    const [temperature, setTemperature] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TEMPERATURE);
        // Ensure saved value is treated as a number, fallback to default
        return saved !== null ? parseInt(saved, 10) : DEFAULTS.TEMPERATURE;
    });

    const [ph, setPh] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PH);
        // Ensure saved value is treated as a float, fallback to default
        return saved !== null ? parseFloat(saved) : DEFAULTS.PH;
    });

    const [substrate, setSubstrate] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSTRATE);
        if (saved) {
            try {
                // Attempt to parse the saved JSON string
                const parsed = JSON.parse(saved);
                // Basic check if it looks like our substrate object
                if (typeof parsed === 'object' && parsed !== null && 'riceBran' in parsed) {
                    return parsed;
                }
            } catch (e) {
                console.error("Failed to parse substrate from localStorage", e);
            }
        }
        // Fallback to default if nothing valid is found
        return DEFAULTS.SUBSTRATE;
    });

    const [simulationDays, setSimulationDays] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SIMULATION_DAYS);
        return saved !== null ? parseInt(saved, 10) : DEFAULTS.SIMULATION_DAYS;
    });

    const [batchName, setBatchName] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.BATCH_NAME);
        return saved !== null ? saved : DEFAULTS.BATCH_NAME;
    });

    const [startDate, setStartDate] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.START_DATE);
        return saved !== null ? saved : DEFAULTS.START_DATE;
    });

    // Derived state (total substrate) - no need to store this separately in localStorage
    const [totalSubstrate, setTotalSubstrate] = useState(0); // Initialized at 0, will be calculated

    // --- Labels ---
    const substrateLabels = {
        riceBran: 'Rice Bran',
        corn: 'Corn Cob',
        sugarcane: 'Sugarcane',
        sawdust: 'Sawdust',
    };

    // --- Effects ---
    // Effect to calculate total substrate whenever substrate state changes
    useEffect(() => {
        const total = Object.values(substrate).reduce((sum, weight) => sum + (Number(weight) || 0), 0);
        setTotalSubstrate(total);
    }, [substrate]);

    // --- Effects to save state to localStorage ---
    useEffect(() => {
        // Save temperature (only if it's a valid number, not empty string)
        if (temperature !== '' && !isNaN(temperature)) {
           localStorage.setItem(LOCAL_STORAGE_KEYS.TEMPERATURE, temperature.toString());
        }
    }, [temperature]);

    useEffect(() => {
        // Save pH (only if it's a valid number, not empty string)
         if (ph !== '' && !isNaN(ph)) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.PH, ph.toString());
         }
    }, [ph]);

    useEffect(() => {
        // Save substrate object
        localStorage.setItem(LOCAL_STORAGE_KEYS.SUBSTRATE, JSON.stringify(substrate));
    }, [substrate]);

    useEffect(() => {
         // Save simulation days (only if it's a valid number, not empty string)
        if (simulationDays !== '' && !isNaN(simulationDays)) {
             localStorage.setItem(LOCAL_STORAGE_KEYS.SIMULATION_DAYS, simulationDays.toString());
        }
    }, [simulationDays]);

    useEffect(() => {
        // Save batch name
        localStorage.setItem(LOCAL_STORAGE_KEYS.BATCH_NAME, batchName);
    }, [batchName]);

    useEffect(() => {
        // Save start date
        localStorage.setItem(LOCAL_STORAGE_KEYS.START_DATE, startDate);
    }, [startDate]);


    // --- Event Handlers ---
    const handleStartClick = () => {
        // Note: localStorage is already up-to-date due to useEffect hooks.
        // This function now primarily handles navigation.
        // We *could* still explicitly save here if we wanted different keys
        // for the next page vs. remembering inputs on this page, but using
        // the same keys simplifies things for now.
        console.log('Starting simulation with:', { substrate, temperature, ph, totalSubstrate, simulationDays, batchName, startDate });
        navigate('/growth-simulation');
    };


    // Generic handler for number inputs (like Temp, pH)
    const handleNumberChange = (setter, min, max, value, allowFloat = false) => {
        const numericValue = allowFloat ? parseFloat(value) : parseInt(value, 10);
        // Allow temporary empty input
        if (value === '') {
             setter('');
             return;
        }
        // If not a number after trying to parse, do nothing (keep previous state)
        if (isNaN(numericValue)) {
             return;
        }
        // Clamp the value within the specified min/max range
        const clampedValue = Math.max(min, Math.min(max, numericValue));
        setter(clampedValue);
    };

    const handleSubstrateChange = (key, value) => {
        const numericValue = parseInt(value, 10);
         // Allow temporary empty input
        if (value === '') {
            setSubstrate((prev) => ({ ...prev, [key]: '' })); // Set to empty string temporarily
        } else if (isNaN(numericValue) || numericValue < 0) {
            // If invalid number or negative, revert to 0 if it was empty, else keep previous valid number
            setSubstrate((prev) => ({ ...prev, [key]: prev[key] === '' ? 0 : (prev[key] || 0) }));
        } else {
             // Set valid positive number
            setSubstrate((prev) => ({ ...prev, [key]: numericValue }));
        }
    };

    const handleDaysChange = (e) => {
        const value = e.target.value;
        const min = 1;
        const max = 365;

        if (value === '') {
             setSimulationDays(''); // Allow empty input temporarily
             return;
         }

        const numericValue = parseInt(value, 10);

        if (isNaN(numericValue)) {
             return; // Ignore non-numeric input
        }

        // Clamp value between min and max
        if (numericValue < min) {
            setSimulationDays(min);
        } else if (numericValue > max) {
            setSimulationDays(max);
        } else {
            setSimulationDays(numericValue);
        }
    };

    // --- Chart Configuration --- (remains the same as before)
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#6b4f4b',
                    font: { size: 12, family: "'Lexend', sans-serif" },
                    boxWidth: 15,
                    padding: 15
                }
            },
            tooltip: { // Optional: Customize tooltips if needed
                bodyFont: { family: "'Lexend', sans-serif" },
                titleFont: { family: "'Lexend', sans-serif" }
            }
        },
    };

    const pieData = {
        labels: Object.keys(substrate).map(key => substrateLabels[key]),
        datasets: [
            {
                // Ensure data values are numbers, use 0 if empty or invalid
                data: totalSubstrate > 0
                    ? Object.values(substrate).map(v => Number(v) || 0)
                    : [1], // Show a placeholder slice if total is 0
                backgroundColor: totalSubstrate > 0
                    ? ['#f3f2a4', '#c5e99b', '#452c0e', '#f0a008'] // Your theme colors
                    : ['#d3d3d3'], // Grey placeholder color
                borderColor: '#f5f2e9', // Match card background or desired border
                borderWidth: totalSubstrate > 0 ? 2 : 0, // No border for placeholder
            },
        ],
    };

    // --- JSX ---
    return (
        <div className="condition-setting">
            <div className="logobox"> {/* Consider adding a back button here or near logo */}
                <div className="logo">
                    <img src={logoSrc} alt="Logo" /> {/* Adjusted class usage */}
                </div>
            </div>

            <header className="condition-header">
                <h1>Set Your Growing Conditions!</h1>
            </header>

            <main className="condition-main-content">
                {/* Left Column: Inputs */}
                <div className="left-column">
                    {/* optimal conditions */}
                    <div className="input-card">
                    <h3>
                    Allowable Range of Values
                    <span className="info-icon" title="Values you can set for the sections below">(i)</span>
                    </h3>
                    <p>Temperature (°C) : 20 - 40</p>
                    <p>pH : 6 - 7</p>
                    <p>Substrate Weight : Any weight more than 200g</p>
</div>
                    {/* Environmental Conditions */}
                    <div className="input-card">
                         <h3>
                            Environmental Conditions
                            <span className="info-icon" title="Set temperature (20-40°C) and pH (6.0-7.0) for growth">(i)</span>
                        </h3>
                        <div className="input-group">
    <label htmlFor="temperature">Temperature (°C):</label>
    <input
        id="temperature" type="number" min="20" max="40" step="1" // <-- Changed max from 30 to 40
        value={temperature} // Controlled component
        // The handler already correctly uses 20 and 40 as min/max
        onChange={(e) => handleNumberChange(setTemperature, 20, 40, e.target.value)}
    />
</div>
                        <div className="input-group">
                            <label htmlFor="ph">pH:</label>
                            <input
                                id="ph" type="number" min="6.0" max="7.0" step="0.1"
                                value={ph} // Controlled component
                                // Use the updated handler, allow float
                                onChange={(e) => handleNumberChange(setPh, 6.0, 7.0, e.target.value, true)}
                            />
                        </div>
                    </div>

                     {/* Substrate Composition */}
                     <div className="input-card">
                         <h3>
                            Substrate Composition
                            <span className="info-icon" title="Enter weight in grams for each component. Make sure the total is more than 200g.">(i)</span>
                        </h3>
                        {Object.keys(substrate).map((key) => (
                            <div key={key} className="input-group">
                                <label htmlFor={`substrate-${key}`}>{substrateLabels[key]} (g):</label>
                                <input
                                    id={`substrate-${key}`} type="number" min="0"
                                    value={substrate[key]} // Controlled component
                                    // Use the updated handler
                                    onChange={(e) => handleSubstrateChange(key, e.target.value)}
                                />
                            </div>
                        ))}
                        <div className="total-substrate">
                            Total: {totalSubstrate}g
                        </div>
                    </div>
                </div>

                 {/* Right Column: Chart & Other Details */}
                 <div className="right-column">
                    <div className="chart-card">
                        <h3>Your Substrate Composition</h3>
                        <div className="pie-chart-container">
                            <div className="pie-chart">
                                {totalSubstrate > 0 ? (
                                    <Pie data={pieData} options={pieOptions} />
                                ) : (
                                    <p className="pie-chart-placeholder">
                                        Enter substrate values to see chart.
                                    </p>
                                )}
                            </div>
                        </div>

                         {/* Additional Inputs */}
                        <div className="additional-inputs">
                             <div className="input-group">
                                 <label htmlFor="batchName">Batch Name:</label>
                                <input
                                    id="batchName" type="text" value={batchName} // Controlled
                                    onChange={(e) => setBatchName(e.target.value)} // Direct setter is fine
                                    placeholder="e.g., Spring Batch 1"
                                />
                            </div>
                             <div className="input-group">
                                <label htmlFor="startDate">Start Date:</label>
                                <input
                                    id="startDate" type="date" value={startDate} // Controlled
                                    onChange={(e) => setStartDate(e.target.value)} // Direct setter
                                />
                            </div>
                             {/* Assuming span-cols-2 class is setup in CSS for grid layout */}
                             <div className="input-group span-cols-2">
                                 <label htmlFor="simulationDays">Cultivation Duration (Days):</label>
                                <input
                                    id="simulationDays" type="number" min="1" max="365" step="1"
                                    value={simulationDays} // Controlled
                                    onChange={handleDaysChange} // Use specific handler
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer / Actions */}
             <footer className="footer-container">
                 {/* Removed Back button from here as added near logo */}
                 <button className="start1-button" onClick={handleStartClick}>
                    Start Growing
                </button>
            </footer>
        </div>
    );
};

export default ConditionSetting;