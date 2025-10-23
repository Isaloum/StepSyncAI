import React, { useState, useEffect } from 'react';
import { copingAPI } from '../services/api';

const CopingStrategies = () => {
    const [strategies, setStrategies] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [usingStrategyId, setUsingStrategyId] = useState(null);
    const [rating, setRating] = useState(5);

    useEffect(() => {
        loadStrategies();
    }, []);

    const loadStrategies = async () => {
        try {
            const response = await copingAPI.getAll();
            setStrategies(response.data);
        } catch (error) {
            console.error('Error loading coping strategies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await copingAPI.create({ name, description });
            setName('');
            setDescription('');
            loadStrategies();
        } catch (error) {
            console.error('Error adding strategy:', error);
            alert('Failed to add coping strategy');
        } finally {
            setLoading(false);
        }
    };

    const handleUse = async (id, rating) => {
        try {
            await copingAPI.use(id, rating);
            setUsingStrategyId(null);
            loadStrategies();
        } catch (error) {
            console.error('Error using strategy:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this coping strategy?')) {
            try {
                await copingAPI.delete(id);
                loadStrategies();
            } catch (error) {
                console.error('Error deleting strategy:', error);
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Coping Strategies</h1>
                    <p>Manage techniques that help you cope</p>
                </div>
            </div>

            {/* Add Strategy Form */}
            <div className="card">
                <h2 className="card-title">Add Coping Strategy</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Deep breathing"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="How does this strategy work?"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Strategy'}
                    </button>
                </form>
            </div>

            {/* Strategies List */}
            <div className="card">
                <h2 className="card-title">Your Strategies</h2>

                {strategies.length > 0 ? (
                    <div>
                        {strategies.map((strategy) => (
                            <div key={strategy.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                    <div className="list-item-content">
                                        <div className="list-item-title">{strategy.name}</div>
                                        {strategy.description && (
                                            <p style={{ margin: '0.5rem 0' }}>{strategy.description}</p>
                                        )}
                                        <div className="list-item-meta">
                                            Used: {strategy.times_used} times
                                            {strategy.effectiveness && (
                                                <> • Effectiveness: {strategy.effectiveness}/10</>
                                            )}
                                        </div>
                                    </div>
                                    <div className="list-item-actions">
                                        <button
                                            onClick={() => setUsingStrategyId(strategy.id)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            Use Strategy
                                        </button>
                                        <button onClick={() => handleDelete(strategy.id)} className="btn btn-sm btn-danger">
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {usingStrategyId === strategy.id && (
                                    <div style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem' }}>
                                        <label className="form-label">How effective was it? {rating}/10</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={rating}
                                            onChange={(e) => setRating(parseInt(e.target.value))}
                                            style={{ width: '100%' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <button
                                                onClick={() => handleUse(strategy.id, rating)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Submit Rating
                                            </button>
                                            <button
                                                onClick={() => setUsingStrategyId(null)}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">💪</div>
                        <p>No coping strategies yet. Add some techniques that help you!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CopingStrategies;
