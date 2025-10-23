import React, { useState, useEffect } from 'react';
import { symptomsAPI } from '../services/api';
import { format } from 'date-fns';

const symptomTypes = [
    'anxiety', 'panic', 'flashback', 'nightmare',
    'depression', 'insomnia', 'irritability', 'avoidance',
    'hypervigilance', 'concentration', 'physical-pain', 'other'
];

const Symptoms = () => {
    const [symptoms, setSymptoms] = useState([]);
    const [type, setType] = useState('anxiety');
    const [severity, setSeverity] = useState(5);
    const [note, setNote] = useState('');
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSymptoms();
    }, [days]);

    const loadSymptoms = async () => {
        try {
            const response = await symptomsAPI.getAll(days);
            setSymptoms(response.data);
        } catch (error) {
            console.error('Error loading symptoms:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await symptomsAPI.create({ type, severity, note });
            setNote('');
            setSeverity(5);
            loadSymptoms();
        } catch (error) {
            console.error('Error adding symptom:', error);
            alert('Failed to log symptom');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this symptom entry?')) {
            try {
                await symptomsAPI.delete(id);
                loadSymptoms();
            } catch (error) {
                console.error('Error deleting symptom:', error);
            }
        }
    };

    const getSeverityColor = (severity) => {
        if (severity <= 3) return '#10b981';
        if (severity <= 6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Symptoms Tracker</h1>
                    <p>Monitor and track your symptoms</p>
                </div>
            </div>

            {/* Log Symptom Form */}
            <div className="card">
                <h2 className="card-title">Log Symptom</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Symptom Type</label>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            {symptomTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Severity: {severity}/10
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={severity}
                            onChange={(e) => setSeverity(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: getSeverityColor(severity) }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <span>Mild</span>
                            <span>Moderate</span>
                            <span>Severe</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Note (optional)</label>
                        <textarea
                            className="form-textarea"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Additional details..."
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Log Symptom'}
                    </button>
                </form>
            </div>

            {/* Symptom History */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Symptom History</h2>
                    <select
                        className="form-select"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        style={{ width: 'auto' }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>

                {symptoms.length > 0 ? (
                    <div>
                        {symptoms.map((symptom) => (
                            <div key={symptom.id} className="list-item">
                                <div className="list-item-content">
                                    <div className="list-item-title">
                                        <span style={{
                                            display: 'inline-block',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: getSeverityColor(symptom.severity),
                                            marginRight: '0.5rem'
                                        }} />
                                        {symptom.type} - Severity: {symptom.severity}/10
                                    </div>
                                    {symptom.note && <p style={{ margin: '0.5rem 0' }}>{symptom.note}</p>}
                                    <div className="list-item-meta">
                                        {format(new Date(symptom.timestamp), 'PPp')}
                                    </div>
                                </div>
                                <div className="list-item-actions">
                                    <button onClick={() => handleDelete(symptom.id)} className="btn btn-sm btn-danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">⚕️</div>
                        <p>No symptoms logged</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Symptoms;
