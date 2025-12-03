import { useState } from 'react';
import { auth } from '../api';

export default function Login({ forcePasswordChange = false, onPasswordChanged, onLogout }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await auth.changePassword(oldPassword, newPassword);
            setSuccess('Password changed successfully. Please log in again.');
            setTimeout(() => {
                onPasswordChanged();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Password change failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing">
            <div className="landing-card">
                <h1 className="landing-title">🔒 Change Password Required</h1>

                {forcePasswordChange && (
                    <div className="alert alert-info mb-3">
                        You must change your password before accessing the system.
                    </div>
                )}

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>

                        {!forcePasswordChange && onLogout && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onLogout}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
