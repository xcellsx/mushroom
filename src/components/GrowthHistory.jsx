import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/images/cslogo.png'; // Ensure this path is correct
import '../styles/GrowthHistory.css';

/**
 * Formats a date string (YYYY-MM-DD) to DD-MM-YYYY.
 * Replicated here for standalone use, or import from a shared utils file.
 * @param {string} dateString - Input date string in YYYY-MM-DD format.
 * @returns {string} Formatted date string or 'N/A'.
 */
function formatDate_DDMMYYYY(dateString) {
    if (!dateString || dateString === 'N/A' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return 'N/A';
    }
    try {
        const [year, month, day] = dateString.split('-');
        // Basic validation for month/day ranges if needed
        // if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31) return 'Invalid Date';
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'N/A';
    }
}


/**
 * GrowthHistory Component
 * Displays a list of past growth simulation entries stored in localStorage.
 */
const GrowthHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]); // State to hold the history array
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Effect hook to load history from localStorage when the component mounts
  useEffect(() => {
    try {
      const savedHistoryString = localStorage.getItem('growthHistory');
      const savedHistory = savedHistoryString ? JSON.parse(savedHistoryString) : [];
      if (Array.isArray(savedHistory)) {
        setHistory(savedHistory);
      } else {
        console.warn("Stored growthHistory is not an array. Resetting.");
        setHistory([]);
      }
    } catch (parseError) {
      console.error("Error parsing growth history:", parseError);
      setError("Failed to load growth history.");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBackClick = () => {
    navigate('/'); // Adjust route if needed
  };

  /**
   * Formats the substrate data into a readable string.
   * @param {string | object} substrate - The substrate data.
   * @returns {string} A formatted string representation.
   */
  const formatSubstrate = (substrate) => {
    const displayNames = { riceBran: 'Rice Bran', corn: 'Corn Cob', sugarcane: 'Sugarcane', sawdust: 'Sawdust' };
    let parsedSubstrate;
    if (typeof substrate === 'object' && substrate !== null) { parsedSubstrate = substrate; }
    else if (typeof substrate === 'string') { try { parsedSubstrate = JSON.parse(substrate); if (typeof parsedSubstrate !== 'object' || parsedSubstrate === null) { return substrate; } } catch (error) { return substrate; } }
    else { return "Invalid substrate data"; }
    return Object.entries(parsedSubstrate)
      .map(([key, value]) => { const name = displayNames[key] || key; const amount = Number(value); return `${name}: ${isNaN(amount) ? value : amount + 'g'}`; })
      .join(', ');
  };

  /**
   * Navigates to the detailed growth report page.
   * @param {object} entry - The history entry object.
   */
  const handleEntryClick = (entry) => {
    console.log("Navigating to report with entry:", entry);
    navigate('/growth-report', { state: { entryData: entry } });
  };

  // --- Render Logic ---
  if (isLoading) { return <div className="growth-history loading"><p>Loading history...</p></div>; }
  if (error) { return <div className="growth-history error-message"><p>{error}</p></div>; }

  return (
    <div className="growth-history">
      <header className="history-header">
      <div className="logobox">
                    <div className="logo"> <img src={logoSrc} alt="City Sprouts Logo" /> </div>
                </div>
        <h1>Growth History</h1>
      </header>
      <main className="history-content">
        {/* Note: Month heading is still hardcoded */}
        <h3>April</h3>
        <div className="history-list">
          {history.length > 0 ? (
            [...history].reverse().map((entry, index) => (
              <div
                className="history-item"
                key={entry.id || `history-${index}`}
                onClick={() => handleEntryClick(entry)}
                title="Click to view detailed report"
                style={{ cursor: 'pointer' }}
              >
                <div className="history-details">
                  {/* Display Start Date (Formatted) */}
                  <p><strong>Start Date:</strong> {formatDate_DDMMYYYY(entry.startDate) ?? 'N/A'}</p>
                  {/* Display End Date (Assumed pre-formatted) */}
                  <p><strong>End Date:</strong> {entry.endDate ?? 'N/A'}</p>
                  {/* Display Number of Days */}
                  <p><strong>Duration:</strong> {entry.days ?? 'N/A'} days</p>
                  {/* Display Yield */}
                  <p><strong>Yield:</strong> {entry.yield !== undefined && entry.yield !== null && !isNaN(Number(entry.yield)) ? `${Number(entry.yield)}g` : (entry.yield ?? 'N/A')}</p> {/* Removed toFixed(1) here to match saved value */}
                  {/* Display formatted Substrate and Conditions */}
                  <p>
                    {formatSubstrate(entry.substrate)}
                    {entry.conditions ? ` | ${entry.conditions}` : ''}
                  </p>
                </div>
                <div className="history-date">
                   {/* Display Date Saved */}
                   <p><strong>Saved:</strong> {entry.date ?? 'N/A'}</p>
                   {/* Display Batch Name */}
                   {entry.batchName && entry.batchName !== 'N/A' && <p><strong>Batch:</strong> {entry.batchName}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="no-history-message">No growth history available.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default GrowthHistory;
