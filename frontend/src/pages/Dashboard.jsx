import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moodsAPI, symptomsAPI, journalAPI, goalsAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const Dashboard = () => {
    const [moodStats, setMoodStats] = useState(null);
    const [moodData, setMoodData] = useState([]);
    const [symptomStats, setSymptomStats] = useState([]);
    const [recentJournals, setRecentJournals] = useState([]);
    const [activeGoals, setActiveGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [moodsResponse, moodStatsResponse, symptomsResponse, journalsResponse, goalsResponse] = await Promise.all([
                moodsAPI.getAll(7),
                moodsAPI.getStats(7),
                symptomsAPI.getStats(7),
                journalAPI.getAll(3),
                goalsAPI.getAll(false)
            ]);

            setMoodData(moodsResponse.data.reverse());
            setMoodStats(moodStatsResponse.data);
            setSymptomStats(symptomsResponse.data);
            setRecentJournals(journalsResponse.data);
            setActiveGoals(goalsResponse.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMoodEmoji = (rating) => {
        if (rating <= 2) return '😢';
        if (rating <= 4) return '😔';
        if (rating <= 6) return '😐';
        if (rating <= 8) return '🙂';
        return '😊';
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Your mental health overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-4">
                <div className="stat-card">
                    <div className="stat-value">
                        {moodStats?.average_mood ? `${getMoodEmoji(moodStats.average_mood)} ${moodStats.average_mood.toFixed(1)}` : 'N/A'}
                    </div>
                    <div className="stat-label">Average Mood (7 days)</div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <div className="stat-value">{moodStats?.total_entries || 0}</div>
                    <div className="stat-label">Mood Entries</div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <div className="stat-value">{symptomStats.length}</div>
                    <div className="stat-label">Symptom Types Logged</div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <div className="stat-value">{activeGoals.length}</div>
                    <div className="stat-label">Active Goals</div>
                </div>
            </div>

            {/* Mood Chart */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Mood Trend (Last 7 Days)</h2>
                    <Link to="/mood" className="btn btn-sm btn-primary">View All</Link>
                </div>
                {moodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={moodData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
                            />
                            <YAxis domain={[0, 10]} />
                            <Tooltip
                                labelFormatter={(timestamp) => format(new Date(timestamp), 'PPpp')}
                            />
                            <Line type="monotone" dataKey="rating" stroke="#6366f1" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <p>No mood data yet</p>
                        <Link to="/mood" className="btn btn-primary">Log Your First Mood</Link>
                    </div>
                )}
            </div>

            <div className="grid grid-2">
                {/* Recent Symptoms */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Top Symptoms</h2>
                        <Link to="/symptoms" className="btn btn-sm btn-secondary">View All</Link>
                    </div>
                    {symptomStats.length > 0 ? (
                        <div>
                            {symptomStats.slice(0, 5).map((symptom) => (
                                <div key={symptom.type} className="list-item">
                                    <div className="list-item-content">
                                        <div className="list-item-title">{symptom.type}</div>
                                        <div className="list-item-meta">
                                            {symptom.occurrences} occurrences • Avg severity: {symptom.avg_severity.toFixed(1)}/10
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No symptoms logged yet</p>
                        </div>
                    )}
                </div>

                {/* Recent Journal Entries */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Recent Journal Entries</h2>
                        <Link to="/journal" className="btn btn-sm btn-secondary">View All</Link>
                    </div>
                    {recentJournals.length > 0 ? (
                        <div>
                            {recentJournals.map((journal) => (
                                <div key={journal.id} className="list-item">
                                    <div className="list-item-content">
                                        <div className="list-item-title">
                                            [{journal.type}] {journal.content.substring(0, 60)}...
                                        </div>
                                        <div className="list-item-meta">
                                            {format(new Date(journal.timestamp), 'PPp')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No journal entries yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 className="card-title">Quick Actions</h2>
                <div className="grid grid-4" style={{ marginTop: '1rem' }}>
                    <Link to="/mood" className="btn btn-primary">Log Mood</Link>
                    <Link to="/journal" className="btn btn-primary">Write Journal</Link>
                    <Link to="/symptoms" className="btn btn-primary">Log Symptom</Link>
                    <Link to="/coping" className="btn btn-primary">Use Coping Strategy</Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
