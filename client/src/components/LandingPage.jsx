import { useState } from 'react';
import { auth, search } from '../api';

export default function LandingPage({ onLogin }) {
    const [showLogin, setShowLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [expandedSheet, setExpandedSheet] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await auth.login(username, password);

            // Decode JWT to get user info (username and role)
            // JWT format: header.payload.signature
            const tokenParts = response.token.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));

            const userData = {
                username: payload.username,
                role: payload.role
            };

            onLogin(userData, response.token, response.mustChange || false);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCode.trim()) return;

        setSearching(true);
        setError('');

        try {
            const data = await search.courses(searchCode);
            setSearchResults(data.results || []);
        } catch (err) {
            setError(err.message || 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const toggleSheet = (sheetId) => {
        setExpandedSheet(expandedSheet === sheetId ? null : sheetId);
    };

    return (
        <div className="landing">
            <div className="landing-card">
                <h1 className="landing-title">📚 Lab Signup System</h1>
                <p className="landing-description">
                    Manage course signups, lab sessions, and grading.
                    Search for available lab slots or login to access your account.
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                {!showLogin ? (
                    <>
                        {/* Search Section */}
                        <div className="card">
                            <h3>🔍 Search Lab Signup Sheets</h3>
                            <form onSubmit={handleSearch}>
                                <div className="form-group">
                                    <label>Course Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., SE3316"
                                        value={searchCode}
                                        onChange={(e) => setSearchCode(e.target.value)}
                                        disabled={searching}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={searching}
                                >
                                    {searching ? 'Searching...' : 'Search'}
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-3">
                                    <h4>Search Results ({searchResults.length})</h4>
                                    {searchResults.map(({ course, sheets }) => (
                                        <div key={course.id} className="card mt-2">
                                            <h4>{course.code} - {course.name}</h4>
                                            <p><strong>Term:</strong> {course.term} | <strong>Section:</strong> {course.section}</p>

                                            {sheets.map((sheet) => (
                                                <div key={sheet.id} className="list-item mt-2">
                                                    <div style={{ flex: 1 }}>
                                                        <strong>{sheet.assignmentName}</strong>
                                                        {sheet.description && <p>{sheet.description}</p>}
                                                        <button
                                                            className="btn btn-small btn-secondary mt-1"
                                                            onClick={() => toggleSheet(sheet.id)}
                                                        >
                                                            {expandedSheet === sheet.id ? 'Hide Slots' : 'View Slots'}
                                                        </button>

                                                        {expandedSheet === sheet.id && sheet.slots && (
                                                            <div className="mt-2">
                                                                <table className="table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Start Time</th>
                                                                            <th>End Time</th>
                                                                            <th>Capacity</th>
                                                                            <th>Signups</th>
                                                                            <th>Available</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {sheet.slots.map((slot) => (
                                                                            <tr key={slot.id}>
                                                                                <td>{new Date(slot.startTime).toLocaleString()}</td>
                                                                                <td>{new Date(slot.endTime).toLocaleString()}</td>
                                                                                <td>{slot.capacity}</td>
                                                                                <td>{slot.signupCount}</td>
                                                                                <td>
                                                                                    <span className={`badge ${slot.signupCount >= slot.capacity
                                                                                        ? 'badge-danger'
                                                                                        : 'badge-success'
                                                                                        }`}>
                                                                                        {slot.capacity - slot.signupCount} spots
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchResults.length === 0 && searchCode && !searching && (
                                <p className="mt-2 text-center">No courses found matching "{searchCode}"</p>
                            )}
                        </div>

                        <div className="text-center mt-3">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowLogin(true)}
                            >
                                Login to Your Account
                            </button>
                        </div>
                    </>
                ) : (
                    /* Login Section */
                    <div className="card">
                        <h3>🔐 Login</h3>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowLogin(false)}
                                    disabled={loading}
                                >
                                    Back to Search
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
