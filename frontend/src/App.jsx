import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import Journal from './pages/Journal';
import Symptoms from './pages/Symptoms';
import Triggers from './pages/Triggers';
import CopingStrategies from './pages/CopingStrategies';
import EmergencyContacts from './pages/EmergencyContacts';
import Goals from './pages/Goals';
import Profile from './pages/Profile';

// Layout
import Layout from './components/Layout';

import './styles/App.css';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="mood" element={<MoodTracker />} />
                    <Route path="journal" element={<Journal />} />
                    <Route path="symptoms" element={<Symptoms />} />
                    <Route path="triggers" element={<Triggers />} />
                    <Route path="coping" element={<CopingStrategies />} />
                    <Route path="contacts" element={<EmergencyContacts />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
