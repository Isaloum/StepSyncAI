import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [accidentDate, setAccidentDate] = useState('');
    const [accidentDescription, setAccidentDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await profileAPI.get();
            setProfile(response.data);

            if (response.data.accident_date) {
                setAccidentDate(response.data.accident_date);
            }
            if (response.data.accident_description) {
                setAccidentDescription(response.data.accident_description);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await profileAPI.update({
                accident_date: accidentDate,
                accident_description: accidentDescription
            });
            alert('Profile updated successfully!');
            loadProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Profile</h1>
                    <p>Manage your account information</p>
                </div>
            </div>

            {/* User Info */}
            <div className="card">
                <h2 className="card-title">Account Information</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                            Name
                        </label>
                        <div>{user?.name}</div>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                            Email
                        </label>
                        <div>{user?.email}</div>
                    </div>
                    {profile?.created_at && (
                        <div>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                Member Since
                            </label>
                            <div>{format(new Date(profile.created_at), 'PPP')}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recovery Profile */}
            <div className="card">
                <h2 className="card-title">Recovery Profile</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Optional: Document your recovery journey. This information helps provide context for your tracking.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Accident/Incident Date (optional)</label>
                        <input
                            type="date"
                            className="form-input"
                            value={accidentDate}
                            onChange={(e) => setAccidentDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Brief Description (optional)</label>
                        <textarea
                            className="form-textarea"
                            value={accidentDescription}
                            onChange={(e) => setAccidentDescription(e.target.value)}
                            placeholder="Briefly describe what happened (if you're comfortable sharing)"
                            rows="4"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            {/* Privacy Notice */}
            <div className="card" style={{ background: '#eff6ff', border: '1px solid var(--primary)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>🔒 Privacy & Data</h3>
                <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>All your data is stored locally and privately</li>
                    <li>This is a personal tracking tool - always consult mental health professionals for proper care</li>
                    <li>In crisis, please contact emergency services or crisis hotlines</li>
                    <li>Your recovery journey is unique and valid</li>
                </ul>
            </div>
        </div>
    );
};

export default Profile;
