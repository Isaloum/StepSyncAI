import React, { useState, useEffect } from 'react';
import { moodsAPI } from '../services/api';
import { format } from 'date-fns';

const MoodTracker = () => {
    const [moods, setMoods] = useState([]);
    const [rating, setRating] = useState(5);
    const [note, setNote] = useState('');
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMoods();
    }, [days]);

    const loadMoods = async () => {
        try {
            const response = await moodsAPI.getAll(days);
            setMoods(response.data);
        } catch (error) {
            console.error('Error loading moods:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await moodsAPI.create({ rating, note });
            setRating(5);
            setNote('');
            loadMoods();
        } catch (error) {
            console.error('Error adding mood:', error);
            alert('Failed to add mood entry');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this mood entry?')) {
            try {
                await moodsAPI.delete(id);
                loadMoods();
            } catch (error) {
                console.error('Error deleting mood:', error);
            }
        }
    };

    const getMoodEmoji = (rating) => {
        if (rating <= 2) return '😢';
        if (rating <= 4) return '😔';
        if (rating <= 6) return '😐';
        if (rating <= 8) return '🙂';
        return '😊';
    };

    const getMoodColor = (rating) => {
        if (rating <= 2) return '#ef4444';
        if (rating <= 4) return '#f59e0b';
        if (rating <= 6) return '#eab308';
        if (rating <= 8) return '#22c55e';
        return '#10b981';
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Mood Tracker</h1>
                    <p>Track your daily emotional state</p>
                </div>
            </div>

            {/* Add Mood Form */}
            <div className="card">
                <h2 className="card-title">Log Your Mood</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            How are you feeling? <span className="mood-emoji">{getMoodEmoji(rating)}</span> {rating}/10
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={rating}
                            onChange={(e) => setRating(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: getMoodColor(rating) }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <span>Very Bad</span>
                            <span>Neutral</span>
                            <span>Great</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Note (optional)</label>
                        <textarea
                            className="form-textarea"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What's on your mind?"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Log Mood'}
                    </button>
                </form>
            </div>

            {/* Mood History */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Mood History</h2>
                    <select
                        className="form-select"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        style={{ width: 'auto' }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>

                {moods.length > 0 ? (
                    <div>
                        {moods.map((mood) => (
                            <div key={mood.id} className="list-item">
                                <div className="list-item-content">
                                    <div className="list-item-title">
                                        <span className="mood-emoji">{getMoodEmoji(mood.rating)}</span> {mood.rating}/10
                                    </div>
                                    {mood.note && <p style={{ margin: '0.5rem 0', color: 'var(--text)' }}>{mood.note}</p>}
                                    <div className="list-item-meta">
                                        {format(new Date(mood.timestamp), 'PPp')}
                                    </div>
                                </div>
                                <div className="list-item-actions">
                                    <button onClick={() => handleDelete(mood.id)} className="btn btn-sm btn-danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">😊</div>
                        <p>No mood entries found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoodTracker;
