import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>Mental Health Support</h1>
                    <p>Welcome, {user?.name}</p>
                </div>

                <nav>
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <NavLink to="/dashboard" className="nav-link">
                                <span>📊</span> Dashboard
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/mood" className="nav-link">
                                <span>😊</span> Mood Tracker
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/journal" className="nav-link">
                                <span>📔</span> Journal
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/symptoms" className="nav-link">
                                <span>⚕️</span> Symptoms
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/triggers" className="nav-link">
                                <span>⚠️</span> Triggers
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/coping" className="nav-link">
                                <span>💪</span> Coping Strategies
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/goals" className="nav-link">
                                <span>🎯</span> Goals
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/contacts" className="nav-link">
                                <span>📞</span> Emergency Contacts
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/profile" className="nav-link">
                                <span>👤</span> Profile
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
