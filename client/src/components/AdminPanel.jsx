import { useState } from 'react';
import { admin } from '../api';
import TADashboard from './TADashboard';

export default function AdminPanel() {
    const [showTAFunctions, setShowTAFunctions] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddTA = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await admin.addTA(username);
            setSuccess(`User ${username} has been granted TA access`);
            setUsername('');
        } catch (err) {
            setError(err.message || 'Failed to add TA');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTA = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await admin.removeTA(username);
            setSuccess(`TA role removed from user ${username}`);
            setUsername('');
        } catch (err) {
            setError(err.message || 'Failed to remove TA');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await admin.resetPassword(username);
            setSuccess(`Password reset for ${username}. New password: ${response.resetTo}. User must change on first login.`);
            setUsername('');
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="mb-3">🔧 Administrator Panel</h2>

            <div className="tabs mb-3">
                <button
                    className={`tab ${!showTAFunctions ? 'active' : ''}`}
                    onClick={() => setShowTAFunctions(false)}
                >
                    Admin Functions
                </button>
                <button
                    className={`tab ${showTAFunctions ? 'active' : ''}`}
                    onClick={() => setShowTAFunctions(true)}
                >
                    TA Functions
                </button>
            </div>

            {!showTAFunctions ? (
                <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                    {/* Add/Remove TA */}
                    <div className="card">
                        <h3>👤 Manage TA Roles</h3>
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="btn btn-success"
                                onClick={handleAddTA}
                                disabled={loading || !username.trim()}
                            >
                                Add as TA
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleRemoveTA}
                                disabled={loading || !username.trim()}
                            >
                                Remove TA Role
                            </button>
                        </div>
                    </div>

                    {/* Reset Password */}
                    <div className="card">
                        <h3>🔑 Reset User Password</h3>
                        <p>Reset a user's password. They will be required to change it on first login.</p>

                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                disabled={loading}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleResetPassword}
                            disabled={loading || !username.trim()}
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            ) : (
                /* Show all TA functions */
                <TADashboard />
            )}
        </div>
    );
}
