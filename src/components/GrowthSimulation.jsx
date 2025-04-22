import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    Title,
    Interaction
} from 'chart.js';
import { getElementAtEvent } from 'react-chartjs-2';
import odeRK4 from 'ode-rk4';

// --- CSS and Asset Imports ---
// Adjust these paths according to your project structure
import '../styles/GrowthSimulation.css';
import logoSrc from '../assets/images/cslogo.png';
import asset1Src from '../assets/images/my100.jpg'; // Image for Day 0-2 click
import day1Src from '../assets/images/Day1.jpg';   // Image for Day 8-15 click
import day5Src from '../assets/images/Day5.jpg';   // Image for Day 35-40 click

// --- Simulation Logic & ChartJS Registration ---
ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale, Title);

// *** Default Parameters & Simulation Functions ***
// (Assume defaultParamsMushroom, defaultParamsMycelium, FIXED_CN_RATIO,
// linearInterpolate, derivatives, getInitialState, runSimulation are unchanged)
// *** Default Parameters for MUSHROOM Growth ***
const defaultParamsMushroom = {
    timeStart: 0, timeLength: 100, timeStep: 0.2, 'C BD Rate': 1.11, 'C Coeff': 0.7, 'C Cons. Rate': 76.39, 'CO2 Coeff': 0.8, 'CO2 Production Rate': 410000, 'CO2 Removal Rate': 12.6, 'External CO2': 428.23, 'External Temp': 24, 'Growth Coeff': 5.1, 'Initial Complex:Simple Ratio': 0.8054, 'Initial Dry Substrate Weight': 410.2, 'IsMush': 1, 'Mushroom Multiplier': 5.17, 'N Coeff': 68.4, 'N Rate': 13.03, 'pH': 6.91, 'pH Coeff': 1.4, 'Temp Coeff': 1.3, 'Temp Production Rate': 405, 'Temp Transfer Rate': 1.5, 'Effect of CO2 on Mush Growth Data': [[500, 0.9], [800, 1], [1000, 0.8], [1200, 0.25], [1400, 0]], 'Effect of CO2 on Myc Growth Data': [[15000, 1], [20000, 0.9], [25000, 0.25], [30000, 0]], 'Effect of pH on Mush Growth Data': [[5.5, 0], [6, 0.25], [6.7, 1], [7, 0.6], [7.5, 0]], 'Effect of pH on Myc Growth Data': [[5.8, 0], [6, 0.25], [6.7, 1], [7, 0.6], [7.5, 0]], 'Effect of Temp on Mush Growth Data': [[10, 0], [15, 5.37], [20, 6.36], [25, 8.63], [30, 6.37], [40, 0]], 'Effect of Temp on Myc Growth Data': [[10, 0], [15, 5.37], [20, 6.36], [25, 8.63], [30, 6.37], [35, 5.36], [45, 0]], 'Initial Mycelium': 0.9,
};
// *** Default Parameters for MYCELIUM Growth ***
const defaultParamsMycelium = {
    timeStart: 0, timeLength: 100, timeStep: 0.2, 'C BD Rate': 1.11, 'C Coeff': 0.7, 'C Cons. Rate': 76.39, 'CO2 Coeff': 0.8, 'CO2 Production Rate': 410000, 'CO2 Removal Rate': 1, 'External CO2': 428.23, 'External Temp': 28, 'Growth Coeff': 5.4, 'Initial Complex:Simple Ratio': 0.867, 'Initial Dry Substrate Weight': 200, 'IsMush': 0, 'Mushroom Multiplier': 26, 'N Coeff': 68.4, 'N Rate': 1.53, 'pH': 6.91, 'pH Coeff': 1.4, 'Temp Coeff': 1.7, 'Temp Production Rate': 255, 'Temp Transfer Rate': 1.5, 'Effect of CO2 on Mush Growth Data': [[500, 0.9], [800, 1], [1000, 0.8], [1200, 0.25], [1400, 0]], 'Effect of CO2 on Myc Growth Data': [[15000, 1], [20000, 0.9], [25000, 0.25], [30000, 0]], 'Effect of pH on Mush Growth Data': [[5.5, 0], [6, 0.25], [6.7, 1], [7, 0.6], [7.5, 0]], 'Effect of pH on Myc Growth Data': [[5.8, 0], [6, 0.25], [6.7, 1], [7, 0.6], [7.5, 0]], 'Effect of Temp on Mush Growth Data': [[10, 0], [15, 5.37], [20, 6.36], [25, 8.63], [30, 6.37], [40, 0]], 'Effect of Temp on Myc Growth Data': [[10, 0], [15, 5.37], [20, 6.36], [25, 8.63], [30, 6.37], [35, 5.36], [45, 0]], 'Initial Mycelium': 0.004,
};
// FIXED C:N Ratio
const FIXED_CN_RATIO = 0.96;
// --- Simulation Functions ---
function linearInterpolate(data, x) { if (!data || data.length === 0) return 0; if (x <= data[0][0]) return data[0][1]; if (x >= data[data.length - 1][0]) return data[data.length - 1][1]; let i = 0; while (i < data.length - 1 && x > data[i + 1][0]) i++; const x0 = data[i][0], y0 = data[i][1]; const x1 = data[i + 1][0], y1 = data[i + 1][1]; const divisor = (x1 - x0); if (divisor === 0) return y0; const t = (x - x0) / divisor; return y0 + t * (y1 - y0); }
function derivatives(dydt, y, t, currentParams) { const [ currentCO2, currentComplexC, currentMushroomYield, currentMycelium, currentN, currentSimpleC, currentSpace, currentTemp ] = y; const initialDrySubstrateWeight = currentParams['Initial Dry Substrate Weight'] || 1; const cnRatio = currentParams['Initial C:N Ratio']; const cnRatioPlusOne = cnRatio + 1; const InitC = initialDrySubstrateWeight - (initialDrySubstrateWeight / cnRatioPlusOne); const AvailableN = initialDrySubstrateWeight > 0 ? currentN / initialDrySubstrateWeight : 0; const AvailableC = initialDrySubstrateWeight > 0 ? currentSimpleC / initialDrySubstrateWeight : 0; const VolumeNormalisation = initialDrySubstrateWeight > 0 ? Math.sqrt(100 / initialDrySubstrateWeight) : Math.sqrt(100); const Effect_of_CO2_on_Mush_Growth = linearInterpolate(currentParams['Effect of CO2 on Mush Growth Data'], currentCO2); const Effect_of_CO2_on_Myc_Growth = linearInterpolate(currentParams['Effect of CO2 on Myc Growth Data'], currentCO2); const Effect_of_pH_on_Mush_Growth = linearInterpolate(currentParams['Effect of pH on Mush Growth Data'], currentParams['pH']); const Effect_of_pH_on_Myc_Growth = linearInterpolate(currentParams['Effect of pH on Myc Growth Data'], currentParams['pH']); const Effect_of_Temp_on_Mush_Growth = linearInterpolate(currentParams['Effect of Temp on Mush Growth Data'], currentTemp); const Effect_of_Temp_on_Myc_Growth = linearInterpolate(currentParams['Effect of Temp on Myc Growth Data'], currentTemp); const isMushPhase = currentParams['IsMush'] === 1; const TempEff_ = isMushPhase ? Effect_of_Temp_on_Mush_Growth : Effect_of_Temp_on_Myc_Growth; const TempEffect = (currentParams['Temp Coeff'] * TempEff_) / 10; const pHEff_ = isMushPhase ? Effect_of_pH_on_Mush_Growth : Effect_of_pH_on_Myc_Growth; const pHEffect = pHEff_ * currentParams['pH Coeff']; const CO2Eff_ = isMushPhase ? Effect_of_CO2_on_Mush_Growth : Effect_of_CO2_on_Myc_Growth; const CO2Effect = currentParams['CO2 Coeff'] * CO2Eff_; const NEffect = currentParams['N Coeff'] * AvailableN; const CEffect = Math.sqrt(Math.max(0, currentParams['C Coeff'] * AvailableC)); const safeTempEffect = Math.max(0, TempEffect); const safePhEffect = Math.max(0, pHEffect); const safeNEffect = Math.max(0, NEffect); const safeCEffect = Math.max(0, CEffect); const safeCO2Effect = Math.max(0, CO2Effect); const RawGrowthRate = safeTempEffect * safePhEffect * safeNEffect * safeCEffect * safeCO2Effect; const GrowthOpp = currentSpace * currentMycelium; let GrowthRate = isMushPhase ? (RawGrowthRate * currentParams['Growth Coeff']) : (RawGrowthRate * GrowthOpp * currentParams['Growth Coeff']); GrowthRate = Math.max(0, GrowthRate); let NormGrowthRate = isMushPhase ? (GrowthRate / 100) : GrowthRate; NormGrowthRate = Math.max(0, NormGrowthRate); const flow_Breakdown = Math.max(0, currentMycelium * currentParams['C BD Rate'] * currentComplexC * RawGrowthRate * VolumeNormalisation); const flow_CCons = Math.max(0, NormGrowthRate * currentParams['C Cons. Rate']); const flow_CO2Prod = Math.max(0, NormGrowthRate * currentParams['CO2 Production Rate']); const flow_CO2Vent = Math.max(0, currentParams['CO2 Removal Rate'] * (currentCO2 - currentParams['External CO2']) * VolumeNormalisation); const flow_Colonisation = isMushPhase ? 0 : GrowthRate; const flow_MushroomGrowth = isMushPhase ? Math.max(0, GrowthRate * currentParams['Mushroom Multiplier']) : 0; const flow_NCons = Math.max(0, NormGrowthRate * currentParams['N Rate']); const flow_TempProd = Math.max(0, NormGrowthRate * currentParams['Temp Production Rate']); const flow_TempVent = Math.max(0, (currentTemp - currentParams['External Temp']) * currentParams['Temp Transfer Rate'] * VolumeNormalisation); dydt[0] = flow_CO2Prod - flow_CO2Vent; dydt[1] = -flow_Breakdown; dydt[2] = flow_MushroomGrowth; dydt[3] = flow_Colonisation; dydt[4] = -flow_NCons; dydt[5] = flow_Breakdown - flow_CCons; dydt[6] = -flow_Colonisation; dydt[7] = flow_TempProd - flow_TempVent; const epsilon = 1e-9; if (y[0] <= epsilon && dydt[0] < 0) dydt[0] = 0; if (y[1] <= epsilon && dydt[1] < 0) dydt[1] = 0; if (y[2] <= epsilon && dydt[2] < 0) dydt[2] = 0; if (y[3] <= epsilon && dydt[3] < 0) dydt[3] = 0; if (y[4] <= epsilon && dydt[4] < 0) dydt[4] = 0; if (y[5] <= epsilon && dydt[5] < 0) dydt[5] = 0; if (y[6] <= epsilon && dydt[6] < 0) dydt[6] = 0; }
function getInitialState(p, initialMyceliumValue) { const initialDrySubstrateWeight = Number(p['Initial Dry Substrate Weight']); const cnRatio = Number(p['Initial C:N Ratio']); const complexSimpleRatio = Number(p['Initial Complex:Simple Ratio']); if (isNaN(initialDrySubstrateWeight) || initialDrySubstrateWeight <= 0 || isNaN(cnRatio) || cnRatio <= 0 || isNaN(complexSimpleRatio) || complexSimpleRatio < 0 || complexSimpleRatio > 1) { console.error("Invalid parameters for getInitialState:", p); return [400, 200, 0, 0.01, 10, 50, 0.99, 25]; } const cnRatioPlusOne = cnRatio + 1; const Init_N = initialDrySubstrateWeight / cnRatioPlusOne; const Init_C = initialDrySubstrateWeight - Init_N; const initialSpace = Math.max(0, 1 - initialMyceliumValue); return [ Number(p['External CO2']), Init_C * complexSimpleRatio, 0, initialMyceliumValue, Init_N, Init_C * (1 - complexSimpleRatio), initialSpace, Number(p['External Temp']) ]; }
function runSimulation(inputParams, defaultParamSet) { if (!defaultParamSet) { console.error("runSimulation called without defaultParamSet!"); return []; } const currentParams = { ...defaultParamSet, ...inputParams, 'Initial C:N Ratio': FIXED_CN_RATIO, }; const finalInitialWeight = Number(currentParams['Initial Dry Substrate Weight']); const finalCNRatio = Number(currentParams['Initial C:N Ratio']); const finalComplexSimpleRatio = Number(currentParams['Initial Complex:Simple Ratio']); const finalExternalCO2 = Number(currentParams['External CO2']); const finalExternalTemp = Number(currentParams['External Temp']); const initialMyceliumValue = currentParams['IsMush'] === 0 ? (currentParams['Initial Mycelium'] ?? defaultParamsMycelium['Initial Mycelium']) : (currentParams['Initial Mycelium'] ?? defaultParamsMushroom['Initial Mycelium']); const initialStateParams = { 'Initial Dry Substrate Weight': finalInitialWeight, 'Initial C:N Ratio': finalCNRatio, 'Initial Complex:Simple Ratio': finalComplexSimpleRatio, 'External CO2': finalExternalCO2, 'External Temp': finalExternalTemp, }; const y0 = getInitialState(initialStateParams, initialMyceliumValue); const t0 = currentParams.timeStart; const dt = currentParams.timeStep; const timeLength = Math.max(0, Number(currentParams.timeLength)); const positiveDt = Math.max(dt, 1e-6); const numSteps = timeLength > 0 && positiveDt > 0 ? Math.floor(timeLength / positiveDt) : 0; const derivativeFuncForSolver = (dydt, y, t) => { try { derivatives(dydt, y, t, currentParams); } catch (e) { console.error("Error inside derivatives function:", e); dydt.fill(0); } }; const integrator = odeRK4(y0, derivativeFuncForSolver, t0, positiveDt); const results = [{ time: integrator.t, state: [...integrator.y] }]; const simType = currentParams['IsMush'] === 0 ? 'Mycelium' : 'Mushroom'; if (numSteps <= 0) { console.warn(`${simType} Sim: 0 steps. Simulation not run.`); return []; } for (let i = 0; i < numSteps; i++) { try { integrator.step(); if (integrator.y.some(val => !Number.isFinite(val))) { console.error(`${simType} Sim: Non-finite value at t=${integrator.t.toFixed(2)}. State:`, integrator.y); } results.push({ time: integrator.t, state: [...integrator.y] }); } catch (solverError) { console.error(`${simType} Sim: Solver error at t=${integrator.t.toFixed(2)}:`, solverError); break; } } return results.map(p => ({ time: p.time, CO2: p.state[0], ComplexC: p.state[1], MushroomYield: p.state[2], Mycelium: p.state[3], N: p.state[4], SimpleC: p.state[5], Space: p.state[6], Temp: p.state[7] })); }
// --- (End of Simulation Functions) ---


// --- Helper Functions ---
function formatDate_DDMMYYYY(dateString) { if (!dateString || dateString === 'N/A' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { return 'N/A'; } try { const [year, month, day] = dateString.split('-'); return `${day}-${month}-${year}`; } catch (e) { console.error("Error formatting date:", e); return 'N/A'; } }
function calculateAndFormatEndDate(startDateStr, durationDays) { if (!startDateStr || startDateStr === 'N/A' || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || isNaN(durationDays) || durationDays < 0) { return 'N/A'; } try { const startDateObj = new Date(startDateStr); const endDateObj = new Date(startDateObj.getTime()); endDateObj.setDate(endDateObj.getDate() + durationDays); const endYear = endDateObj.getFullYear(); const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0'); const endDay = String(endDateObj.getDate()).padStart(2, '0'); const endDateStrYYYYMMDD = `${endYear}-${endMonth}-${endDay}`; return formatDate_DDMMYYYY(endDateStrYYYYMMDD); } catch (dateError) { console.error("Error calculating end date:", dateError); return 'N/A'; } }


// --- React Component Definition ---
const GrowthSimulation = () => {
    const navigate = useNavigate();
    const chartRef = useRef(null);

    // --- State Variables ---
    // Simulation results and UI state
    const [simulationResultsMushroom, setSimulationResultsMushroom] = useState(null);
    const [simulationResultsMycelium, setSimulationResultsMycelium] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchName, setBatchName] = useState('');
    const [startDate, setStartDate] = useState(''); // Raw YYYY-MM-DD start date from localStorage
    const [endDate, setEndDate] = useState('N/A'); // Formatted DD-MM-YYYY end date
    const [finalSimulatedYield, setFinalSimulatedYield] = useState(null);
    const [activeChartTab, setActiveChartTab] = useState('yield');
    const [animationImageSrc, setAnimationImageSrc] = useState(null);

    // State to store the specific parameters used for *this* simulation run (for saving)
    const [simTemperature, setSimTemperature] = useState(null);
    const [simPh, setSimPh] = useState(null);
    const [simSubstrateJson, setSimSubstrateJson] = useState(null); // Store the raw JSON string
    const [simDuration, setSimDuration] = useState(null);

    // --- Local Storage Keys ---
    // ***** UPDATED KEYS TO MATCH ConditionSetting *****
    const LOCAL_STORAGE_KEYS = {
        TEMPERATURE: 'conditionSetting_temperature', // Use key from ConditionSetting
        PH: 'conditionSetting_ph',                 // Use key from ConditionSetting
        SUBSTRATE: 'conditionSetting_substrate',     // Use key from ConditionSetting
        SIMULATION_DAYS: 'conditionSetting_simulationDays', // Use key from ConditionSetting
        BATCH_NAME: 'sim_batch_name',             // This key matches ConditionSetting
        START_DATE: 'sim_start_date',             // This key matches ConditionSetting
        HISTORY: 'growthHistory'                  // Key for saving the history array (specific to this component)
    };
    // ************************************************

    // --- Effect Hook to Run Simulations ---
    useEffect(() => {
        let isMounted = true;
        // Reset states
        setIsLoading(true); setError(null); setFinalSimulatedYield(null);
        setSimulationResultsMushroom(null); setSimulationResultsMycelium(null);
        setEndDate('N/A'); setAnimationImageSrc(null);
        setSimTemperature(null); setSimPh(null); setSimSubstrateJson(null); setSimDuration(null);

        const runSimulationsAsync = async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted) return;

            let savedTempStr, savedPhStr, savedSubstrateJsonStr, savedDaysStr, savedBatchNameStr, savedStartDateStr;
            try {
                // Load parameters from localStorage using the UPDATED keys
                savedTempStr = localStorage.getItem(LOCAL_STORAGE_KEYS.TEMPERATURE);
                savedPhStr = localStorage.getItem(LOCAL_STORAGE_KEYS.PH);
                savedSubstrateJsonStr = localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSTRATE);
                savedDaysStr = localStorage.getItem(LOCAL_STORAGE_KEYS.SIMULATION_DAYS);
                savedBatchNameStr = localStorage.getItem(LOCAL_STORAGE_KEYS.BATCH_NAME) || 'N/A';
                savedStartDateStr = localStorage.getItem(LOCAL_STORAGE_KEYS.START_DATE) || 'N/A';

                if (isMounted) {
                    setBatchName(savedBatchNameStr);
                    setStartDate(savedStartDateStr);
                }

                // Validate required parameters
                const missingParams = [];
                if (savedTempStr === null) missingParams.push('Temperature');
                if (savedPhStr === null) missingParams.push('pH');
                if (savedSubstrateJsonStr === null) missingParams.push('Substrate');
                if (savedDaysStr === null) missingParams.push('Duration');
                // If any required param is null, throw error (ConditionSetting should ensure defaults exist)
                if (missingParams.length > 0) {
                     throw new Error(`Missing required parameters from ConditionSetting: ${missingParams.join(', ')}. Please set them first.`);
                }

                // Parse and validate numerical parameters
                const temp = parseFloat(savedTempStr);
                const phValue = parseFloat(savedPhStr);
                const days = parseInt(savedDaysStr, 10);
                let initialWeight = 0;
                try {
                    const substrateData = JSON.parse(savedSubstrateJsonStr);
                    if (typeof substrateData !== 'object' || substrateData === null) throw new Error("Invalid substrate JSON.");
                    initialWeight = Object.values(substrateData).reduce((sum, val) => sum + (Number(val) || 0), 0);
                    if (initialWeight <= 0) console.warn("Initial weight is zero/negative.");
                } catch (parseError) { throw new Error(`Invalid substrate data: ${parseError.message}`); }

                // Final check on parsed numbers
                if (isNaN(temp) || isNaN(phValue) || isNaN(initialWeight) || isNaN(days) || days < 0) {
                    // This error might indicate corrupted localStorage data if ConditionSetting worked correctly
                     throw new Error("Invalid numerical parameters found in localStorage.");
                }

                const simulationDuration = days;

                // --- Store parameters used for this run in state ---
                if (isMounted) {
                    setSimTemperature(temp);
                    setSimPh(phValue);
                    setSimSubstrateJson(savedSubstrateJsonStr);
                    setSimDuration(simulationDuration);
                }

                // Calculate End Date
                const calculatedEndDate = calculateAndFormatEndDate(savedStartDateStr, simulationDuration);
                if (isMounted) { setEndDate(calculatedEndDate); }

                // Prepare inputs for simulation function
                const simulationInputs = { 'External Temp': temp, 'pH': phValue, 'Initial Dry Substrate Weight': initialWeight, 'timeLength': simulationDuration, };

                // Run Simulations
                const resultsMushroom = runSimulation(simulationInputs, defaultParamsMushroom);
                const resultsMycelium = runSimulation(simulationInputs, defaultParamsMycelium);

                // Update State with results
                if (isMounted) {
                    setSimulationResultsMushroom(resultsMushroom);
                    setSimulationResultsMycelium(resultsMycelium);
                    if (resultsMushroom && resultsMushroom.length > 0) {
                        const lastMushroomResult = resultsMushroom[resultsMushroom.length - 1];
                        if (lastMushroomResult && Number.isFinite(lastMushroomResult.MushroomYield)) {
                            setFinalSimulatedYield(lastMushroomResult.MushroomYield);
                        } else { setFinalSimulatedYield(null); }
                    } else { setFinalSimulatedYield(null); }
                }
            } catch (err) {
                console.error("Sim setup/run error:", err);
                if (isMounted) setError(err.message || "Error occurred during simulation setup.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        runSimulationsAsync();
        return () => { isMounted = false; };
    }, []); // Empty dependency array ensures this runs only once on mount

    /**
     * Saves the current simulation results to localStorage and navigates to the landing page.
     */
    const handleDoneClick = () => {
        console.log("Attempting to save simulation to history...");
        // Ensure necessary data is available before saving
        if (simDuration === null || finalSimulatedYield === null || simSubstrateJson === null || simTemperature === null || simPh === null || startDate === null || endDate === null) {
            console.error("Cannot save history: Simulation data is incomplete.");
            alert("Could not save simulation results. Data is missing.");
            return;
        }
        // 1. Format Conditions String
        const conditionsString = `Temp: ${simTemperature}°C, pH: ${simPh.toFixed(1)}`;
        // 2. Create New History Entry Object
        const newHistoryEntry = {
            id: Date.now(), date: new Date().toLocaleDateString(), startDate: startDate, endDate: endDate,
            days: simDuration, yield: finalSimulatedYield.toFixed(1), substrate: simSubstrateJson,
            conditions: conditionsString, batchName: batchName || 'N/A',
            // NOTE: Saving full simulation data is omitted due to localStorage limits
            // simulationDataMushroom: simulationResultsMushroom,
            // simulationDataMycelium: simulationResultsMycelium,
        };
        try {
            // 3. Read Existing History
            const existingHistoryString = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORY);
            let history = [];
            if (existingHistoryString) {
                try { history = JSON.parse(existingHistoryString); if (!Array.isArray(history)) { history = []; } }
                catch (parseError) { console.error("Failed to parse history, starting fresh.", parseError); history = []; }
            }
            // 4. Append New Entry
            history.push(newHistoryEntry);
            // 5. Write Updated History Back to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(history));
            console.log("Simulation saved to history:", newHistoryEntry);
            // 6. Navigate after successful save
            navigate('/'); // Adjust route if needed
        } catch (storageError) {
            console.error("Error saving history:", storageError);
            alert("Failed to save simulation history.");
        }
    };

    /**
     * Handles clicks on chart points, displaying images based on time ranges.
     */
/**
 * Handles clicks on chart points, displaying images based on time ranges.
 */
const handleChartClick = (event) => {
    const chart = chartRef.current; if (!chart) return;
    const elements = getElementAtEvent(chart, event);

    if (elements.length > 0) {
        const { datasetIndex, index } = elements[0];
        const dataset = chart.config.data.datasets[datasetIndex];
        const dataPoint = dataset?.data[index];

        // Only proceed if we have a data point and the 'yield' tab is active
        if (dataPoint && activeChartTab === 'yield') {
            const clickedTime = dataPoint.x;

            // --- Calculate the dynamic start time for the last image range ---
            // Ensure simDuration is a valid number before calculating
            const isDurationValid = simDuration !== null && Number.isFinite(simDuration);
            // Calculate the start time (simDuration - 5). Default to an impossible value if duration isn't valid.
            const lastImageStartTime = isDurationValid ? simDuration - 5 : -1;

            // --- Check time ranges ---
            if (clickedTime >= 0 && clickedTime < 2) {
                setAnimationImageSrc(asset1Src); // First range (Day 0-1)
            } else if (clickedTime >= 8 && clickedTime < 15) {
                setAnimationImageSrc(day1Src);   // Second range (Day 8-14)
            // --- *** UPDATED Condition for the last image *** ---
            } else if (
                isDurationValid &&                 // Check if duration is valid
                clickedTime >= lastImageStartTime && // Check if click time is >= (duration - 5)
                clickedTime <= simDuration           // Check if click time is <= duration (inclusive)
            ) {
                setAnimationImageSrc(day5Src);   // Last range (Duration-5 to Duration)
            } else {
                // If clicked time doesn't fall into any specific range
                setAnimationImageSrc(null);
            }
        } else {
             // If not on the 'yield' tab or no data point clicked
            setAnimationImageSrc(null);
        }
    } else {
        // If click was not on a chart element
         setAnimationImageSrc(null);
    }
};

// --- Chart Configuration Function ---
const getChartConfig = () => {
    // (Chart config logic - colors, fonts, etc. remain the same)
    const currentResultsSource = activeChartTab === 'mycelium' ? simulationResultsMycelium : simulationResultsMushroom;
    const yieldColor = '#2E7D32'; const tempColor = '#C62828'; const myceliumColor = '#1976D2';
    const textColor = '#333'; const gridColor = 'rgba(0, 0, 0, 0.08)';
    const font = { family: 'Lexend', weight: '300' };

    // *** REMOVED central xAxisMax calculation ***

    const options = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: textColor, font: font } }, tooltip: { enabled: true, bodyFont: font, titleFont: font }, title: { display: true, text: '', color: textColor, font: { ...font, size: 16, weight: '500'} } },
        scales: {
            x: {
                type: 'linear',
                title: { display: true, text: 'Time (Days)', color: textColor, font: font },
                ticks: { color: textColor, font: font, precision: 0 },
                grid: { color: gridColor },
                min: 0,
                // *** max will be set conditionally below within the switch statement ***
                max: undefined // Initialize as undefined
            },
            // --- Y-Axis definitions (unchanged) ---
            yYield: { type: 'linear', position: 'left', title: { display: true, text: 'Mushroom Yield (g)', color: yieldColor, font: font }, ticks: { color: yieldColor, font: font }, grid: { drawOnChartArea: true, color: gridColor }, beginAtZero: true, display: false },
            yTemp: { type: 'linear', position: 'left', title: { display: true, text: 'Temperature (°C)', color: tempColor, font: font }, ticks: { color: tempColor, font: font }, grid: { drawOnChartArea: false }, display: false },
            yMycelium: { type: 'linear', position: 'left', title: { display: true, text: 'Mycelium Density', color: myceliumColor, font: font }, ticks: { color: myceliumColor, font: font, callback: (value) => value.toFixed(2) }, grid: { drawOnChartArea: true, color: gridColor }, beginAtZero: true, suggestedMax: 1, display: false }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    // --- Toggle Y-Axis visibility (unchanged) ---
    options.scales.yYield.display = false; options.scales.yTemp.display = false; options.scales.yMycelium.display = false;

    // --- Handle case where simulation data isn't ready (unchanged) ---
    if (!currentResultsSource || currentResultsSource.length === 0) {
        return { data: { datasets: [] }, options: options };
    }

    let datasets = [];
    let chartData = [...currentResultsSource]; // Use a copy
    let dataSourceName = '';

    // --- Prepare datasets and set X-axis max based on active tab ---
    switch (activeChartTab) {
        case 'yield':
            dataSourceName = 'Mushroom Sim';
            options.plugins.title.text = `Yield Over Time (${dataSourceName})`;
            options.scales.yYield.display = true; // Show correct Y-axis
            datasets = [{ /* ... yield dataset definition ... */
                label: 'Mushroom Yield (g)',
                data: chartData.map(p => ({ x: p.time, y: Number.isFinite(p.MushroomYield) ? p.MushroomYield : null })),
                borderColor: yieldColor, backgroundColor: 'rgba(46, 125, 50, 0.1)', yAxisID: 'yYield',
            }];
            // *** Set X-axis max for Yield tab ***
            options.scales.x.max = (simDuration !== null && Number.isFinite(simDuration)) ? simDuration + 10 : undefined;
            break;

        case 'temp':
            dataSourceName = 'Mushroom Sim';
            options.plugins.title.text = `Temperature Over Time (${dataSourceName})`;
            options.scales.yTemp.display = true; // Show correct Y-axis
            datasets = [{ /* ... temp dataset definition ... */
                label: 'Temperature (°C)',
                data: chartData.map(p => ({ x: p.time, y: Number.isFinite(p.Temp) ? p.Temp : null })),
                borderColor: tempColor, backgroundColor: 'rgba(198, 40, 40, 0.1)', yAxisID: 'yTemp',
            }];
            // *** Set X-axis max for Temp tab ***
            options.scales.x.max = (simDuration !== null && Number.isFinite(simDuration)) ? simDuration + 10 : undefined;
            break;

        case 'mycelium':
            dataSourceName = 'Mycelium Sim';
            options.plugins.title.text = `Mycelium Growth (${dataSourceName})`;
            options.scales.yMycelium.display = true; // Show correct Y-axis

            // --- Mycelium Cutoff Logic for DATA (remains the same) ---
            let cutoffIndex = chartData.findIndex(p => p.Mycelium >= 0.9);
            let cutoffReason = "Simulation End";
            if (cutoffIndex !== -1) {
                chartData = chartData.slice(0, cutoffIndex + 1); // Cut data for display
                cutoffReason = "Mycelium >= 0.9";
            } else {
                const day30Index = chartData.findIndex(p => p.time >= 30);
                if (day30Index !== -1) {
                    chartData = chartData.slice(0, day30Index + 1); // Cut data for display
                    cutoffReason = "Day 30 Limit";
                }
            }
             if (cutoffReason !== "Simulation End") {
                 options.plugins.title.text += ` (Stopped at ${cutoffReason})`;
             }
            // *** Dataset uses potentially shortened 'chartData' ***
            datasets = [{ /* ... mycelium dataset definition ... */
                label: 'Mycelium Density',
                data: chartData.map(p => ({ x: p.time, y: Number.isFinite(p.Mycelium) ? p.Mycelium : null })),
                borderColor: myceliumColor, backgroundColor: 'rgba(25, 118, 210, 0.1)', yAxisID: 'yMycelium',
            }];

            // *** Set specific X-axis max for Mycelium tab ***
            options.scales.x.max = 30;
            break;

        default:
            datasets = [];
            // Set a default max if needed, or leave as undefined
            options.scales.x.max = (simDuration !== null && Number.isFinite(simDuration)) ? simDuration + 10 : undefined;
    }

    // --- Final dataset styling (unchanged) ---
    const finalDatasets = datasets && datasets.length > 0
        ? datasets.map(ds => ({ /* ... styling ... */
            ...ds,
            tension: 0.1,
            pointRadius: ds.data?.length > 150 ? 0.5 : (ds.data?.length > 50 ? 1 : 2),
            pointHoverRadius: 4,
            borderWidth: 1.5,
            spanGaps: true
        })).filter(ds => ds.data && ds.data.length > 0)
        : [];

    return { data: { datasets: finalDatasets }, options: options };
};
// --- End getChartConfig function ---


    // --- Render Logic ---
    const chartConfig = getChartConfig();
    const simulationDataReady = simulationResultsMushroom || simulationResultsMycelium;

    return (
        <div className="growth-simulation">
            {/* Header */}
            <header className="simulation-header">
                <div className="logobox">
                     <div className="logo"> <img src={logoSrc} alt="City Sprouts Logo" /> </div>
                </div>
                <div className="batch-info"> <span className="batch-name">Batch: {batchName}</span> <span className="start-date">Start: {formatDate_DDMMYYYY(startDate)}</span> </div>
            </header>

            {/* Main Content */}
            <main className="main-content-grid">
                {/* Animation Area */}
                <div className="animation-area content-card">
                    {animationImageSrc ? ( <img src={animationImageSrc} alt="Simulation state representation" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', margin: 'auto' }} /> ) : ( <span>Animation / Visualization Area</span> )}
                </div>

                {/* Chart/Results Column */}
                <div className="chart-results-column">
                    {/* Tabs */}
                    <div className="tabs-container">
                         <button onClick={() => { setActiveChartTab('yield'); setAnimationImageSrc(null); }} className={`tab-button ${activeChartTab === 'yield' ? 'tab-button-active' : ''}`}> Yield </button>
                         <button onClick={() => { setActiveChartTab('temp'); setAnimationImageSrc(null); }} className={`tab-button ${activeChartTab === 'temp' ? 'tab-button-active' : ''}`}> Temperature </button>
                         <button onClick={() => { setActiveChartTab('mycelium'); setAnimationImageSrc(null); }} className={`tab-button ${activeChartTab === 'mycelium' ? 'tab-button-active' : ''}`}> Mycelium </button>
                    </div>

                    {/* Chart Area */}
                    <div className="chart-area content-card">
                        {isLoading && <p className="loading-message">Running simulations...</p>}
                        {error && <p className="error-message">Error: {error}</p>}
                        {!isLoading && !error && simulationDataReady && ( chartConfig.data.datasets.length > 0 ? ( <div className="chart-container"> <Line ref={chartRef} options={chartConfig.options} data={chartConfig.data} onClick={handleChartClick} /> </div> ) : ( <p className="no-data-message">No simulation data to display for the '{activeChartTab}' chart.</p> ) )}
                        {!isLoading && !error && !simulationDataReady && <p className="no-data-message">Simulation results not available.</p>}
                    </div>

                    {/* Results Section */}
                    <div className="results-section content-card">
                        <h3 className="results-heading"> Simulation Results <span className="info-icon" title="Projected yield is based on the Mushroom phase simulation. End date calculated from start date and duration.">(i)</span> </h3>
                        <div className="results-items">
                            <div className="result-item"> <span className="result-label">Projected Yield:</span> <span className="result-value"> {isLoading ? '...' : error ? 'Error' : (finalSimulatedYield !== null && Number.isFinite(finalSimulatedYield)) ? `${finalSimulatedYield.toFixed(1)}g` : 'N/A'} </span> </div>
                            <div className="result-item"> <span className="result-label">Projected End Date:</span> <span className="result-value"> {isLoading ? '...' : error ? 'Error' : endDate} </span> </div>
                        </div>
                    </div>
                </div>
            </main>
             {/* Footer Buttons Area */}
             <footer className="report-footer">
                 <button onClick={handleDoneClick} className="done-button" title="Save and Go to Landing Page">Done</button>
             </footer>
        </div>
    );
};

export default GrowthSimulation;
