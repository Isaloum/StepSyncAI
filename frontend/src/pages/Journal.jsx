import React, { useState, useEffect } from 'react';
import { journalAPI } from '../services/api';
import { format } from 'date-fns';

const Journal = () => {
    const [entries, setEntries] = useState([]);
    const [content, setContent] = useState('');
    const [type, setType] = useState('general');
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadEntries();
    }, [days]);

    const loadEntries = async () => {
        try {
            const response = await journalAPI.getAll(days);
            setEntries(response.data);
        } catch (error) {
            console.error('Error loading journal entries:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);

        try {
            if (editingId) {
                await journalAPI.update(editingId, { content, type });
                setEditingId(null);
            } else {
                await journalAPI.create({ content, type });
            }

            setContent('');
            setType('general');
            loadEntries();
        } catch (error) {
            console.error('Error saving journal entry:', error);
            alert('Failed to save journal entry');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        setEditingId(entry.id);
        setContent(entry.content);
        setType(entry.type);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this journal entry?')) {
            try {
                await journalAPI.delete(id);
                loadEntries();
            } catch (error) {
                console.error('Error deleting journal entry:', error);
            }
        }
    };

    const getTypeColor = (type) => {
        const colors = {
            general: '#6366f1',
            incident: '#ef4444',
            therapy: '#8b5cf6',
            progress: '#10b981'
        };
        return colors[type] || colors.general;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Journal</h1>
                    <p>Write about your experiences and thoughts</p>
                </div>
            </div>

            {/* Add/Edit Journal Form */}
            <div className="card">
                <h2 className="card-title">{editingId ? 'Edit Entry' : 'New Journal Entry'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Entry Type</label>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="general">General</option>
                            <option value="incident">Incident</option>
                            <option value="therapy">Therapy</option>
                            <option value="progress">Progress</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea
                            className="form-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your thoughts..."
                            rows="8"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Entry')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setContent('');
                                    setType('general');
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Journal History */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Your Entries</h2>
                    <select
                        className="form-select"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        style={{ width: 'auto' }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last year</option>
                    </select>
                </div>

                {entries.length > 0 ? (
                    <div>
                        {entries.map((entry) => (
                            <div key={entry.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.25rem',
                                                background: getTypeColor(entry.type),
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {entry.type}
                                        </span>
                                        <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {format(new Date(entry.timestamp), 'PPp')}
                                        </span>
                                    </div>
                                    <div className="list-item-actions">
                                        <button onClick={() => handleEdit(entry)} className="btn btn-sm btn-secondary">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(entry.id)} className="btn btn-sm btn-danger">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{entry.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📔</div>
                        <p>No journal entries found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Journal;
