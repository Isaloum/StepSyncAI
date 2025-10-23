import React, { useState, useEffect } from 'react';
import { triggersAPI } from '../services/api';
import { format } from 'date-fns';

const Triggers = () => {
    const [triggers, setTriggers] = useState([]);
    const [description, setDescription] = useState('');
    const [intensity, setIntensity] = useState(5);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTriggers();
    }, []);

    const loadTriggers = async () => {
        try {
            const response = await triggersAPI.getAll();
            setTriggers(response.data);
        } catch (error) {
            console.error('Error loading triggers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await triggersAPI.create({ description, intensity });
            setDescription('');
            setIntensity(5);
            loadTriggers();
        } catch (error) {
            console.error('Error adding trigger:', error);
            alert('Failed to add trigger');
        } finally {
            setLoading(false);
        }
    };

    const handleLogOccurrence = async (id) => {
        try {
            await triggersAPI.logOccurrence(id);
            loadTriggers();
        } catch (error) {
            console.error('Error logging occurrence:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this trigger?')) {
            try {
                await triggersAPI.delete(id);
                loadTriggers();
            } catch (error) {
                console.error('Error deleting trigger:', error);
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Triggers</h1>
                    <p>Identify and track your triggers</p>
                </div>
            </div>

            {/* Add Trigger Form */}
            <div className="card">
                <h2 className="card-title">Add New Trigger</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                            type="text"
                            className="form-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What triggers you?"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Intensity: {intensity}/10</label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Trigger'}
                    </button>
                </form>
            </div>

            {/* Triggers List */}
            <div className="card">
                <h2 className="card-title">Your Triggers</h2>

                {triggers.length > 0 ? (
                    <div>
                        {triggers.map((trigger) => (
                            <div key={trigger.id} className="list-item">
                                <div className="list-item-content">
                                    <div className="list-item-title">{trigger.description}</div>
                                    <div className="list-item-meta">
                                        Intensity: {trigger.intensity}/10 •
                                        Occurrences: {trigger.occurrences} •
                                        Last: {format(new Date(trigger.last_occurred), 'PPp')}
                                    </div>
                                </div>
                                <div className="list-item-actions">
                                    <button onClick={() => handleLogOccurrence(trigger.id)} className="btn btn-sm btn-primary">
                                        Log Occurrence
                                    </button>
                                    <button onClick={() => handleDelete(trigger.id)} className="btn btn-sm btn-danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">⚠️</div>
                        <p>No triggers recorded yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Triggers;
