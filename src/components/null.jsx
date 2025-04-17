import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale, Title } from 'chart.js';
import odeRK4 from 'ode-rk4';
import '../styles/GrowthSimulation.css'; // Import the updated CSS file
import logoSrc from '../assets/images/cslogo.png';

// --- Simulation Logic & ChartJS Registration (NO CHANGES) ---
// ... (Keep simulation functions and ChartJS.register as before) ...
// Default Model Parameters
const defaultParams = {
    timeStart: 0, timeLength: 100, timeStep: 0.2,
    'C BD Rate': 1.11, 'C Coeff': 0.7, 'C Cons. Rate': 76.39, 'CO2 Coeff': 0.8,
    'CO2 Production Rate': 410000, 'CO2 Removal Rate': 12.6, 'External CO2': 428.23,
    'External Temp': 24, 'Growth Coeff': 5.1, 'Initial C:N Ratio': 43.58,
    'Initial Complex:Simple Ratio': 0.8054, 'Initial Dry Substrate Weight': 410.2,
    'IsMush': 1, 'Mushroom Multiplier': 5.17, 'N Coeff': 68.4, 'N Rate': 13.03,
    'pH': 6.91, 'pH Coeff': 1.4, 'Temp Coeff': 1.3, 'Temp Production Rate': 405,
    'Temp Transfer Rate': 1.5,
    'Effect of CO2 on Mush Growth Data': [[500, 0.9], [800, 1], [1000, 0.8], [1200, 0.25], [1400, 0]],
    'Effect of CO2 on Myc Growth Data': [[15000, 1], [20000, 0.9], [25000, 0.25], [30000, 0]],
    'Effect of pH on Mush Growth Data': [[5.5, 0], [6, 0.25], [6.7, 1], [7, 0.6], [7.5, 0]],
    'Effect of pH on Myc Growth Data': [[5.8, 0], [6, 0.25], [6.7, 1], [7, 0.6], [7.5, 0]],
    'Effect of Temp on Mush Growth Data': [[10, 0], [15, 5.37], [20, 6.36], [25, 8.63], [30, 6.37], [40, 0]],
    'Effect of Temp on Myc Growth Data': [[10, 0], [15, 5.37], [20, 6.36], [25, 8.63], [30, 6.37], [35, 5.36], [45, 0]],
};
function linearInterpolate(data, x) { /* ... */ }
function derivatives(dydt, y, t, currentParams) {
    const [ currentCO2, currentComplexC, currentMushroomYield, currentMycelium, currentN, currentSimpleC, currentSpace, currentTemp ] = y;
    const initialDrySubstrateWeight = currentParams['Initial Dry Substrate Weight'] || 1;
    const cnRatioPlusOne = (currentParams['Initial C:N Ratio'] + 1) || 1;
    const InitC = initialDrySubstrateWeight - (initialDrySubstrateWeight / cnRatioPlusOne);
    const AvailableN = currentN / initialDrySubstrateWeight;
    const AvailableC = currentSimpleC / initialDrySubstrateWeight;
    const NEffect = currentParams['N Coeff'] * AvailableN;
    const CEffect = Math.sqrt(Math.max(0, currentParams['C Coeff'] * AvailableC));
    const VolumeNormalisation = Math.sqrt(100 / initialDrySubstrateWeight);
    const Effect_of_CO2_on_Mush_Growth = linearInterpolate(currentParams['Effect of CO2 on Mush Growth Data'], currentCO2);
    const Effect_of_CO2_on_Myc_Growth = linearInterpolate(currentParams['Effect of CO2 on Myc Growth Data'], currentCO2);
    const Effect_of_pH_on_Mush_Growth = linearInterpolate(currentParams['Effect of pH on Mush Growth Data'], currentParams['pH']);
    const Effect_of_pH_on_Myc_Growth = linearInterpolate(currentParams['Effect of pH on Myc Growth Data'], currentParams['pH']);
    const Effect_of_Temp_on_Mush_Growth = linearInterpolate(currentParams['Effect of Temp on Mush Growth Data'], currentTemp);
    const Effect_of_Temp_on_Myc_Growth = linearInterpolate(currentParams['Effect of Temp on Myc Growth Data'], currentTemp);
    const TempEff_ = currentParams['IsMush'] === 0 ? Effect_of_Temp_on_Myc_Growth : Effect_of_Temp_on_Mush_Growth;
    const TempEffect = (currentParams['Temp Coeff'] * TempEff_) / 10;
    const pHEff_ = currentParams['IsMush'] === 0 ? Effect_of_pH_on_Myc_Growth : Effect_of_pH_on_Mush_Growth;
    const pHEffect = pHEff_ * currentParams['pH Coeff'];
    const CO2Eff_ = currentParams['IsMush'] === 0 ? Effect_of_CO2_on_Myc_Growth : Effect_of_CO2_on_Mush_Growth;
    const CO2Effect = currentParams['CO2 Coeff'] * CO2Eff_;
    const RawGrowthRate = TempEffect * pHEffect * NEffect * CEffect * CO2Effect;
    const GrowthOpp = currentSpace * currentMycelium;
    let GrowthRate = currentParams['IsMush'] === 1 ? (RawGrowthRate * currentParams['Growth Coeff']) : (RawGrowthRate * GrowthOpp * currentParams['Growth Coeff']);
    let NormGrowthRate = currentParams['IsMush'] === 1 ? (GrowthRate / 100) : GrowthRate;
    // *** ADD ALL OTHER VARIABLE EQUATIONS FROM YOUR MODEL HERE ***
    const flow_Breakdown = currentMycelium * currentParams['C BD Rate'] * currentComplexC * RawGrowthRate * VolumeNormalisation;
    const flow_CCons = NormGrowthRate * currentParams['C Cons. Rate'];
    const flow_CO2Prod = NormGrowthRate * currentParams['CO2 Production Rate'];
    const flow_CO2Vent = currentParams['CO2 Removal Rate'] * (currentCO2 - currentParams['External CO2']) * VolumeNormalisation;
    const flow_Colonisation = currentParams['IsMush'] === 0 ? GrowthRate : 0;
    const flow_MushroomGrowth = currentParams['IsMush'] === 1 ? (GrowthRate * currentParams['Mushroom Multiplier']) : 0;
    const flow_NCons = NormGrowthRate * currentParams['N Rate'];
    const flow_TempProd = NormGrowthRate * currentParams['Temp Production Rate'];
    const flow_TempVent = (currentTemp - currentParams['External Temp']) * currentParams['Temp Transfer Rate'] * VolumeNormalisation;
    dydt[0] = flow_CO2Prod - flow_CO2Vent; dydt[1] = -flow_Breakdown; dydt[2] = flow_MushroomGrowth; dydt[3] = flow_Colonisation;
    dydt[4] = -flow_NCons; dydt[5] = flow_Breakdown - flow_CCons; dydt[6] = -flow_Colonisation; dydt[7] = flow_TempProd - flow_TempVent;
    if (currentCO2 <= 0 && dydt[0] < 0) dydt[0] = 0; if (currentComplexC <= 0 && dydt[1] < 0) dydt[1] = 0; if (currentN <= 0 && dydt[4] < 0) dydt[4] = 0;
    if (currentSimpleC <= 0 && dydt[5] < 0) dydt[5] = 0; if (currentTemp <= 0 && dydt[7] < 0) dydt[7] = 0;
}

// Initial State Calculation
function getInitialState(p) {
    const initialDrySubstrateWeight = Number(p['Initial Dry Substrate Weight']) || 1;
    const cnRatioPlusOne = (Number(p['Initial C:N Ratio']) || 0) + 1;
    const complexSimpleRatio = Number(p['Initial Complex:Simple Ratio']) || 0;
    const Init_C = initialDrySubstrateWeight - (initialDrySubstrateWeight / cnRatioPlusOne);
    return [ Number(p['External CO2']) || 0, Init_C * complexSimpleRatio, 0, 0.9, initialDrySubstrateWeight / cnRatioPlusOne, Init_C * (1 - complexSimpleRatio), 0.98, Number(p['External Temp']) || 0 ];
}

// Run Simulation Function
function runSimulation(inputParams) {
    const currentParams = { ...defaultParams, ...inputParams };
    const y0 = getInitialState(currentParams);
    const t0 = currentParams.timeStart; const dt = currentParams.timeStep; const timeLength = Math.max(0, currentParams.timeLength);
    const positiveDt = Math.max(dt, 1e-6); const numSteps = Math.floor(timeLength / positiveDt);
    const derivativeFuncForSolver = (dydt, y, t) => { try { derivatives(dydt, y, t, currentParams); } catch (e) { console.error("Error in derivatives:", e); dydt.fill(0); } };
    const integrator = odeRK4(y0, derivativeFuncForSolver, t0, positiveDt);
    const results = [{ time: integrator.t, state: [...integrator.y] }];
    console.log(`Starting JS simulation for ${timeLength} days...`);
    if (numSteps <= 0) { console.warn("Simulation length/step results in zero steps."); return []; }
    for (let i = 0; i < numSteps; i++) {
        try {
            integrator.step();
            if (integrator.y.some(val => !Number.isFinite(val))) { console.error("Simulation unstable at t=", integrator.t); }
            results.push({ time: integrator.t, state: [...integrator.y] });
        } catch (solverError) { console.error("Error during RK4 step:", solverError); break; }
    }
    console.log("JS simulation finished.");
    return results.map(p => ({ time: p.time, CO2: p.state[0], ComplexC: p.state[1], MushroomYield: p.state[2], Mycelium: p.state[3], N: p.state[4], SimpleC: p.state[5], Space: p.state[6], Temp: p.state[7] }));
}

ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale, Title);
// --- React Component ---
const GrowthSimulation = () => {
    const navigate = useNavigate();
    const [simulationResults, setSimulationResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchName, setBatchName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [initialCNRatio, setInitialCNRatio] = useState(defaultParams['Initial C:N Ratio']);
    const [finalSimulatedYield, setFinalSimulatedYield] = useState(null);
    const [activeChartTab, setActiveChartTab] = useState('yield');

    // --- useEffect Hook (NO CHANGES NEEDED HERE) ---
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setError(null);
        setFinalSimulatedYield(null);

        setTimeout(() => {
            if (!isMounted) return;
            try {
                const savedTemperature = localStorage.getItem('temperature');
                const savedPh = localStorage.getItem('ph');
                const savedSubstrateJson = localStorage.getItem('substrate');
                const savedDays = localStorage.getItem('simulationDays');
                const savedBatchName = localStorage.getItem('batchName') || 'N/A';
                const savedStartDate = localStorage.getItem('startDate') || 'N/A';
                const savedCNRatio = localStorage.getItem('initialCNRatio') || defaultParams['Initial C:N Ratio'];

                setBatchName(savedBatchName);
                setStartDate(savedStartDate);
                // Set state based on loaded value or default
                const initialRatioValue = localStorage.getItem('initialCNRatio');
                setInitialCNRatio(initialRatioValue !== null ? parseFloat(initialRatioValue) : defaultParams['Initial C:N Ratio']);

                if (!savedTemperature || !savedPh || !savedSubstrateJson || !savedDays) {
                    throw new Error("Required simulation parameters not found in localStorage.");
                }

                const substrateData = JSON.parse(savedSubstrateJson);
                if (typeof substrateData !== 'object' || substrateData === null) {
                    throw new Error("Invalid substrate data found in localStorage.");
                }

                const temp = parseFloat(savedTemperature);
                const phValue = parseFloat(savedPh);
                const days = parseInt(savedDays, 10);
                const initialWeight = Object.values(substrateData).reduce((sum, val) => sum + (Number(val) || 0), 0);

                const simulationDuration = (Number.isInteger(days) && days > 0) ? days : defaultParams.timeLength;

                if (isNaN(temp) || isNaN(phValue) || isNaN(initialWeight)) {
                    throw new Error("Invalid numerical parameters loaded from localStorage.");
                }

                const simulationInputs = {
                    'External Temp': temp,
                    'pH': phValue,
                    'Initial Dry Substrate Weight': initialWeight > 0 ? initialWeight : defaultParams['Initial Dry Substrate Weight'],
                    'timeLength': simulationDuration,
                    'Initial C:N Ratio': parseFloat(savedCNRatio) || defaultParams['Initial C:N Ratio']
                };

                const results = runSimulation(simulationInputs);
                if (isMounted) {
                    setSimulationResults(results);
                    if (results && results.length > 0) {
                        const lastYield = results[results.length - 1]?.MushroomYield;
                        if (Number.isFinite(lastYield)) {
                            setFinalSimulatedYield(lastYield);
                        }
                    }
                }

            } catch (err) {
                console.error("Error during simulation setup or run:", err);
                if (isMounted) setError(err.message || "Failed to run simulation.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }, 50);

        return () => { isMounted = false; };
    }, []);

    const handleBackClick = () => { navigate('/condition-setting'); };

    // --- Chart Data & Options ---
    // Adjust colors to potentially use CSS variables or match the theme
    const getChartConfig = () => {
        if (!simulationResults || simulationResults.length === 0) {
            return { data: { datasets: [] }, options: {} };
        }

        const yieldColor = 'green'; // Keep specific colors for chart lines
        const tempColor = 'red';
        const textColor = '#333'; // Use CSS variable equivalent: var(--text-color-dark)
        const gridColor = 'rgba(0, 0, 0, 0.05)'; // Lighter grid

        let datasets = [];
        const options = {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: textColor, font: { family: 'Lexend'} } },
                tooltip: { enabled: true, bodyFont: { family: 'Lexend'}, titleFont: { family: 'Lexend' } },
                title: { display: true, text: '', color: textColor, font: { size: 16, family: 'Lexend' } }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (Days)', color: textColor, font: { family: 'Lexend'} },
                    ticks: { color: textColor, font: { family: 'Lexend'} }, // Removed stepSize for auto ticks
                    grid: { color: gridColor },
                    min: 0,
                },
                yYield: { type: 'linear', position: 'left', title: { display: true, text: 'Yield (g)', color: yieldColor, font: { family: 'Lexend'} }, ticks: { color: yieldColor, font: { family: 'Lexend'} }, grid: { drawOnChartArea: false }, beginAtZero: true, display: false },
                yTemp: { type: 'linear', position: 'left', title: { display: true, text: 'Temperature (°C)', color: tempColor, font: { family: 'Lexend'} }, ticks: { color: tempColor, font: { family: 'Lexend'} }, grid: { drawOnChartArea: false }, beginAtZero: false, display: false }
            }
        };

        switch (activeChartTab) {
             case 'yield':
                 options.plugins.title.text = 'Yield Over Time';
                 options.scales.yYield.display = true;
                 datasets = [{
                     label: 'Mushroom Yield (g)',
                     data: simulationResults.map(p => ({ x: p.time, y: Number.isFinite(p.MushroomYield) ? p.MushroomYield : null })),
                     borderColor: yieldColor, backgroundColor: 'rgba(0, 128, 0, 0.1)',
                     yAxisID: 'yYield',
                 }];
                 break;
             case 'temp':
                  options.plugins.title.text = 'Temperature Over Time';
                  options.scales.yTemp.display = true;
                  datasets = [{
                      label: 'Temperature (°C)',
                      data: simulationResults.map(p => ({ x: p.time, y: Number.isFinite(p.Temp) ? p.Temp : null })),
                      borderColor: tempColor, backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      yAxisID: 'yTemp',
                  }];
                  break;
             default:
                 datasets = [];
         }

        return {
             data: { datasets: datasets.map(ds => ({ ...ds, tension: 0.1, pointRadius: 2, spanGaps: true })) },
             options: options
        };
    };

    const chartConfig = getChartConfig();

    return (
        <div className="growth-simulation">
            <header className="simulation-header"> {/* Group header elements */}
                <div className="logobox">
                    <div className="logo">
                        <img src={logoSrc} alt="City Sprouts Logo" />
                    </div>
                </div>
                <div className="batch-info">
                    <span className="batch-name">Batch: #{batchName}</span>
                    <span className="start-date">Start Date: {startDate}</span>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="main-content-grid">
                {/* Left Column: Animation Placeholder */}
                <div className="animation-area content-card">
                    <span>Animation</span> {/* Simpler text */}
                </div>

                {/* Right Column: Tabs, Chart, Results */}
                <div className="chart-results-column">
                    <div className="tabs-container">
                        <button
                            onClick={() => setActiveChartTab('yield')}
                            className={`tab-button ${activeChartTab === 'yield' ? 'tab-button-active' : ''}`}
                        >
                            Yield over Time
                        </button>
                        <button
                            onClick={() => setActiveChartTab('temp')}
                             className={`tab-button ${activeChartTab === 'temp' ? 'tab-button-active' : ''}`}
                        >
                            Temperature
                        </button>
                        {/* <button className="tab-button">pH</button>  Example if pH tab added back */}
                    </div>

                    {/* Chart Area Card */}
                    <div className="chart-area content-card">
                        {isLoading && <p className="loading-message">Loading simulation data...</p>}
                        {error && <p className="error-message">Error: {error}</p>}
                        {!isLoading && !error && simulationResults && (
                             chartConfig.data.datasets.length > 0 ? (
                                 <div className="chart-container">
                                     <Line options={chartConfig.options} data={chartConfig.data} />
                                 </div>
                             ) : (
                                  <p className="no-data-message">No data available for this chart.</p>
                             )
                        )}
                        {!isLoading && !error && !simulationResults && <p className="no-data-message">No simulation results available.</p>}
                        {/* Warning Removed for cleaner look, can be added back if needed
                        <p className="warning-message">
                            Warning: Simulation logic is based on a scaffold...
                        </p>
                         */}
                    </div>

                    {/* Results Section Card */}
                    <div className="results-section content-card">
                        <h3 className="results-heading">
                            Results
                            <span className="info-icon" title="Key simulation outputs based on initial conditions">i</span>
                        </h3>
                        <div className="results-items">
                            <div className="result-item">
                                <span className="result-label">Projected Yield:</span>
                                <span className="result-value">
                                    {isLoading ? '...' : error ? 'Error' : Number.isFinite(finalSimulatedYield) ? `${finalSimulatedYield.toFixed(1)}g` : 'N/A'} {/* Adjusted precision */}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">C:N Ratio:</span> {/* Shortened label */}
                                <span className="result-value">
                                    {isLoading ? '...' : error ? 'Error' : Number.isFinite(initialCNRatio) ? initialCNRatio.toFixed(1) : 'N/A'} {/* Check if number */}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GrowthSimulation;