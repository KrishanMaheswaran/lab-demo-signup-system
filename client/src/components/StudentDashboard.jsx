import { useState, useEffect } from 'react';
import { students, auth } from '../api';

export default function StudentDashboard() {
    const [mySignups, setMySignups] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('signups');

    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [signupsData, availableData] = await Promise.all([
                students.mySignups(),
                students.availableSlots()
            ]);
            setMySignups(signupsData.signups || []);
            setAvailableSlots(availableData.availableSlots || []);
        } catch (err) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (slotId) => {
        try {
            await students.signup(slotId);
            setSuccess('Successfully signed up for slot');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Signup failed');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleLeave = async (slotId) => {
        try {
            await students.leave(slotId);
            setSuccess('Successfully left slot');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Leave slot failed');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setTimeout(() => setError(''), 5000);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            await auth.changePassword(oldPassword, newPassword);
            setSuccess('Password changed successfully! Please log in again with your new password.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                // Log out after password change
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('mustChange');
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Password change failed');
            setTimeout(() => setError(''), 5000);
        }
    };

    if (loading) {
        return <div className="loading">Loading your data...</div>;
    }

    return (
        <div>
            <h2 className="mb-3">Student Dashboard</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'signups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('signups')}
                >
                    My Signups ({mySignups.length})
                </button>
                <button
                    className={`tab ${activeTab === 'available' ? 'active' : ''}`}
                    onClick={() => setActiveTab('available')}
                >
                    Available Slots ({availableSlots.length})
                </button>
                <button
                    className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* My Signups Tab */}
            {activeTab === 'signups' && (
                <div className="card">
                    <h3>📝 My Signed Up Slots</h3>
                    {mySignups.length === 0 ? (
                        <p>You haven't signed up for any slots yet.</p>
                    ) : (
                        <div>
                            {mySignups.map(({ slot, sheet, course, grade }) => (
                                <div key={slot.id} className="list-item">
                                    <div style={{ flex: 1 }}>
                                        <h4>{course?.code} - {sheet?.assignmentName}</h4>
                                        <p>
                                            <strong>Time:</strong> {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                                        </p>
                                        <p><strong>Course:</strong> {course?.name} (Term: {course?.term}, Section: {course?.section})</p>

                                        {grade && (
                                            <div className="mt-2" style={{
                                                background: '#e8f5e9',
                                                padding: '1rem',
                                                borderRadius: '6px',
                                                borderLeft: '4px solid #4caf50'
                                            }}>
                                                <h4>📊 Grade Information</h4>
                                                <p><strong>Final Mark:</strong> {grade.finalMark} / 100</p>
                                                <p><strong>Base Mark:</strong> {grade.baseMark}</p>
                                                <p><strong>Bonus:</strong> +{grade.bonus || 0}</p>
                                                <p><strong>Penalty:</strong> -{grade.penalty || 0}</p>
                                                {grade.comment && (
                                                    <div>
                                                        <strong>Comments:</strong>
                                                        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                                                            {grade.comment}
                                                        </pre>
                                                    </div>
                                                )}
                                                <p className="mt-1">
                                                    <em>Graded by {grade.taUsername} on {new Date(grade.gradedAt).toLocaleString()}</em>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn btn-danger btn-small"
                                        onClick={() => handleLeave(slot.id)}
                                    >
                                        Leave Slot
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Available Slots Tab */}
            {activeTab === 'available' && (
                <div className="card">
                    <h3>✅ Available Slots to Sign Up</h3>
                    {availableSlots.length === 0 ? (
                        <p>No available slots at the moment.</p>
                    ) : (
                        <div>
                            {availableSlots.map(({ slot, sheet, course, availableSpots }) => (
                                <div key={slot.id} className="list-item">
                                    <div style={{ flex: 1 }}>
                                        <h4>{course?.code} - {sheet?.assignmentName}</h4>
                                        <p>
                                            <strong>Time:</strong> {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                                        </p>
                                        <p><strong>Course:</strong> {course?.name} (Term: {course?.term}, Section: {course?.section})</p>
                                        <span className={`badge ${availableSpots <= 2 ? 'badge-warning' : 'badge-success'}`}>
                                            {availableSpots} / {slot.maxMembers} spots available
                                        </span>
                                    </div>

                                    <button
                                        className="btn btn-success btn-small"
                                        onClick={() => handleSignup(slot.id)}
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="card">
                    <h3>⚙️ Account Settings</h3>

                    <h4>Change Password</h4>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Enter your current password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 characters)"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Change Password
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
