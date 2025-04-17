import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css'; // Make sure this path is correct
import logoSrc from '../assets/images/cslogo.png'; // Ensure this path is correct

const LandingPage = () => {
    const navigate = useNavigate();

    const handleStartClick = () => {
        navigate('/condition-setting');
    };

    const handleViewHistoryClick = () => {
        navigate('/growth-history'); // Navigate to the GrowthHistory page
    };

    // Navigation links data
    const navLinks = [
        { name: 'New Simulation', href: '/condition-setting' },
        { name: 'Growth History', href: '/growth-history' },
        { name: 'City Sprouts', href: 'https://citysprouts.com.sg' },
        { name: 'Vidacity', href: 'https://vidacity.com.sg' },
    ];

    return (
        <div className="landing-page">
            <div className="navbar">
                <div className="logo">
                    <img src={logoSrc} alt="Logo" />
                </div>
                <nav className="nav-links">
                    {navLinks.map((link) => (
                        // Use anchor tags for external links, potentially NavLink/Link for internal
                        <a key={link.name}
                           href={link.href}
                           className="nav-link"
                           // Open external links in a new tab
                           target={link.href.startsWith('http') ? '_blank' : '_self'}
                           rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                        >
                            {link.name}
                        </a>
                    ))}
                </nav>
            </div>

            {/* Main Content Wrapper - This will be centered */}
            <div className="landing-content-wrapper">
                <header className="landing-header">
                    <h1>Mushroom Growth Simulator</h1>
                </header>
                <p className='sub'>Powered By: The Mushroom People</p>
                <main className="landing-content">
                    <button className="view-history-button" onClick={handleViewHistoryClick}>
                        View History
                    </button>
                    <button className="start-button" onClick={handleStartClick}>
                        Start Growing
                    </button>
                </main>
            </div>
        </div>
    );
};

export default LandingPage;