import React, { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';

const EmergencyContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const response = await contactsAPI.getAll();
            setContacts(response.data);
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await contactsAPI.create({ name, relationship, phone, notes });
            setName('');
            setRelationship('');
            setPhone('');
            setNotes('');
            loadContacts();
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('Failed to add emergency contact');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this emergency contact?')) {
            try {
                await contactsAPI.delete(id);
                loadContacts();
            } catch (error) {
                console.error('Error deleting contact:', error);
            }
        }
    };

    const handleCall = (phone) => {
        window.location.href = `tel:${phone}`;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Emergency Contacts</h1>
                    <p>Quick access to your support network</p>
                </div>
            </div>

            {/* Crisis Resources */}
            <div className="card" style={{ background: '#fee2e2', border: '2px solid #ef4444' }}>
                <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>📞 Crisis Resources</h2>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div><strong>988 Suicide & Crisis Lifeline:</strong> Call or Text 988</div>
                    <div><strong>Crisis Text Line:</strong> Text HOME to 741741</div>
                    <div><strong>SAMHSA Helpline:</strong> 1-800-662-4357</div>
                    <div><strong>Emergency:</strong> 911</div>
                </div>
            </div>

            {/* Add Contact Form */}
            <div className="card">
                <h2 className="card-title">Add Emergency Contact</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contact name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Relationship</label>
                            <input
                                type="text"
                                className="form-input"
                                value={relationship}
                                onChange={(e) => setRelationship(e.target.value)}
                                placeholder="e.g., Therapist, Friend"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(555) 123-4567"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            className="form-textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Available hours, specific instructions, etc."
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Contact'}
                    </button>
                </form>
            </div>

            {/* Contacts List */}
            <div className="card">
                <h2 className="card-title">Your Emergency Contacts</h2>

                {contacts.length > 0 ? (
                    <div>
                        {contacts.map((contact) => (
                            <div key={contact.id} className="list-item">
                                <div className="list-item-content">
                                    <div className="list-item-title">
                                        {contact.name} {contact.relationship && `(${contact.relationship})`}
                                    </div>
                                    <div style={{ margin: '0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        📞 {contact.phone}
                                    </div>
                                    {contact.notes && (
                                        <div className="list-item-meta">{contact.notes}</div>
                                    )}
                                </div>
                                <div className="list-item-actions">
                                    <button onClick={() => handleCall(contact.phone)} className="btn btn-sm btn-primary">
                                        Call
                                    </button>
                                    <button onClick={() => handleDelete(contact.id)} className="btn btn-sm btn-danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📞</div>
                        <p>No emergency contacts saved yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyContacts;
