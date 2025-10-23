import React, { useState, useEffect } from 'react';
import { goalsAPI } from '../services/api';
import { format } from 'date-fns';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadGoals();
    }, [showCompleted]);

    const loadGoals = async () => {
        try {
            const response = await goalsAPI.getAll(showCompleted);
            setGoals(response.data);
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await goalsAPI.create({ description, target_date: targetDate || null });
            setDescription('');
            setTargetDate('');
            loadGoals();
        } catch (error) {
            console.error('Error adding goal:', error);
            alert('Failed to add goal');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            await goalsAPI.complete(id);
            loadGoals();
        } catch (error) {
            console.error('Error completing goal:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this goal?')) {
            try {
                await goalsAPI.delete(id);
                loadGoals();
            } catch (error) {
                console.error('Error deleting goal:', error);
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Goals</h1>
                    <p>Track your recovery and wellness goals</p>
                </div>
            </div>

            {/* Add Goal Form */}
            <div className="card">
                <h2 className="card-title">Add New Goal</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Goal Description</label>
                        <input
                            type="text"
                            className="form-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What do you want to achieve?"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Date (optional)</label>
                        <input
                            type="date"
                            className="form-input"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Goal'}
                    </button>
                </form>
            </div>

            {/* Goals List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Your Goals</h2>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                        />
                        Show completed
                    </label>
                </div>

                {goals.length > 0 ? (
                    <div>
                        {goals.map((goal) => (
                            <div key={goal.id} className="list-item">
                                <div className="list-item-content">
                                    <div className="list-item-title" style={{ textDecoration: goal.completed ? 'line-through' : 'none' }}>
                                        {goal.completed ? '✅ ' : '⭕ '}{goal.description}
                                    </div>
                                    <div className="list-item-meta">
                                        {goal.target_date && (
                                            <>Target: {format(new Date(goal.target_date), 'PP')} • </>
                                        )}
                                        Created: {format(new Date(goal.created_at), 'PP')}
                                        {goal.completed && (
                                            <> • Completed: {format(new Date(goal.completed_at), 'PP')}</>
                                        )}
                                    </div>
                                </div>
                                <div className="list-item-actions">
                                    {!goal.completed && (
                                        <button onClick={() => handleComplete(goal.id)} className="btn btn-sm btn-primary">
                                            Complete
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(goal.id)} className="btn btn-sm btn-danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <p>No {showCompleted ? 'completed' : 'active'} goals yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Goals;
