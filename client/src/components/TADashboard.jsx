import { useState, useEffect } from 'react';
import { courses, members, sheets, slots, grades, auth } from '../api';

export default function TADashboard() {
    const [activeTab, setActiveTab] = useState('courses');
    const [coursesList, setCoursesList] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingCourse, setEditingCourse] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [membersList, setMembersList] = useState([]);
    const [sheetsList, setSheetsList] = useState([]);
    const [slotsList, setSlotsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Grading mode state
    const [gradingMode, setGradingMode] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null);
    const [slotMembers, setSlotMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);

    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showGradeModal, setShowGradeModal] = useState(false);

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            loadMembers(selectedCourse.id);
            loadSheets(selectedCourse.id);
        }
    }, [selectedCourse]);

    useEffect(() => {
        if (selectedSheet) {
            loadSlots(selectedSheet.id);
        }
    }, [selectedSheet]);

    // Auto-clear error and success messages after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const loadCourses = async () => {
        try {
            const data = await courses.list();
            setCoursesList(data.courses || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const loadMembers = async (courseId) => {
        try {
            const data = await members.list(courseId);
            setMembersList(data.members || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const loadSheets = async (courseId) => {
        try {
            const data = await sheets.list(courseId);
            setSheetsList(data.sheets || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const loadSlots = async (sheetId) => {
        try {
            const data = await slots.list(sheetId);
            setSlotsList(data.slots || []);
        } catch (err) {
            setError(err.message);
        }
    };

    // Course Management
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            term: formData.get('term'),
            code: formData.get('code'),
            section: formData.get('section'),
            name: formData.get('name')
        };

        try {
            await courses.create(data);
            setSuccess('Course created successfully');
            loadCourses();
            e.target.reset();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            term: formData.get('term'),
            code: formData.get('code'),
            section: formData.get('section'),
            name: formData.get('name')
        };

        try {
            await courses.update(editingCourse.id, data);
            setSuccess('Course updated successfully');
            setEditingCourse(null);
            loadCourses();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteCourse = async (id) => {
        try {
            await courses.delete(id);
            setSuccess('Course deleted successfully');
            loadCourses();
            if (selectedCourse?.id === id) setSelectedCourse(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Member Management
    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedCourse) {
            setError('Please select a course first');
            return;
        }

        const formData = new FormData(e.target);
        const data = {
            username: formData.get('username'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            password: formData.get('password')
        };

        try {
            await members.add(selectedCourse.id, data);
            setSuccess('Member added successfully');
            loadMembers(selectedCourse.id);
            e.target.reset();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedCourse) return;

        try {
            const data = await members.bulkAdd(selectedCourse.id, file);
            setSuccess(`Added ${data.added.length} members from CSV`);
            loadMembers(selectedCourse.id);
            e.target.value = '';
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteMember = async (memberId) => {
        try {
            await members.delete(selectedCourse.id, memberId);
            setSuccess('Member deleted successfully');
            loadMembers(selectedCourse.id);
        } catch (err) {
            setError(err.message);
        }
    };

    // Sheet Management
    const handleAddSheet = async (e) => {
        e.preventDefault();
        if (!selectedCourse) {
            setError('Please select a course first');
            return;
        }

        const formData = new FormData(e.target);
        const data = {
            assignmentName: formData.get('assignmentName'),
            description: formData.get('description')
        };

        try {
            await sheets.add(selectedCourse.id, data);
            setSuccess('Signup sheet added successfully');
            loadSheets(selectedCourse.id);
            e.target.reset();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteSheet = async (sheetId) => {
        try {
            await sheets.delete(sheetId);
            setSuccess('Signup sheet deleted successfully');
            loadSheets(selectedCourse.id);
            if (selectedSheet?.id === sheetId) setSelectedSheet(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Slot Management
    const handleAddSlot = async (e) => {
        e.preventDefault();
        if (!selectedSheet) {
            setError('Please select a signup sheet first');
            return;
        }

        const formData = new FormData(e.target);
        const data = {
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            maxMembers: formData.get('maxMembers')
        };

        try {
            await slots.add(selectedSheet.id, data);
            setSuccess('Slot added successfully');
            loadSlots(selectedSheet.id);
            e.target.reset();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateSlot = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            maxMembers: parseInt(formData.get('maxMembers'))
        };

        try {
            await slots.update(editingSlot.id, data);
            setSuccess('Slot updated successfully');
            setEditingSlot(null);
            loadSlots(selectedSheet.id);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        try {
            await slots.delete(slotId);
            setSuccess('Slot deleted successfully');
            loadSlots(selectedSheet.id);
        } catch (err) {
            setError(err.message);
        }
    };

    // Grading Mode
    const enterGradingMode = async () => {
        if (!selectedSheet) {
            setError('Please select a signup sheet first');
            return;
        }

        try {
            const data = await grades.getCurrentSlot(selectedSheet.id);
            setCurrentSlot(data.slot);
            setSlotMembers(data.members || []);
            setGradingMode(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const navigateSlot = async (direction) => {
        try {
            const data = await grades.navigate(currentSlot.id, direction);
            setCurrentSlot(data.slot);
            setSlotMembers(data.members || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const openGradeModal = (member) => {
        setSelectedMember(member);
        setShowGradeModal(true);
    };

    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            baseMark: formData.get('baseMark'),
            bonus: formData.get('bonus') || 0,
            penalty: formData.get('penalty') || 0,
            comment: formData.get('comment')
        };

        try {
            await grades.addOrUpdate(currentSlot.id, selectedMember.id, data);
            setSuccess('Grade saved successfully');
            setShowGradeModal(false);

            // Refresh current slot data
            const refreshData = await grades.getCurrentSlot(selectedSheet.id);
            setSlotMembers(refreshData.members || []);
        } catch (err) {
            setError(err.message);
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

    return (
        <div>
            <h2 className="mb-3">TA Dashboard</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {!gradingMode ? (
                <>
                    {/* Navigation Tabs */}
                    <div className="tabs">
                        <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                            Courses
                        </button>
                        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                            Members
                        </button>
                        <button className={`tab ${activeTab === 'sheets' ? 'active' : ''}`} onClick={() => setActiveTab('sheets')}>
                            Signup Sheets
                        </button>
                        <button className={`tab ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => setActiveTab('slots')}>
                            Slots
                        </button>
                        <button className={`tab ${activeTab === 'grading' ? 'active' : ''}`} onClick={() => setActiveTab('grading')}>
                            Grading
                        </button>
                        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                            ⚙️ Settings
                        </button>
                    </div>

                    {/* Courses Tab */}
                    {activeTab === 'courses' && (
                        <div className="card">
                            <h3>📚 Manage Courses</h3>
                            <form onSubmit={handleCreateCourse} className="mb-3">
                                <div className="grid">
                                    <div className="form-group">
                                        <label>Term</label>
                                        <input type="text" name="term" placeholder="2024F" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Code</label>
                                        <input type="text" name="code" placeholder="SE3316" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Section</label>
                                        <input type="text" name="section" placeholder="001" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Course Name</label>
                                    <input type="text" name="name" placeholder="Web Technologies" required />
                                </div>
                                <button type="submit" className="btn btn-primary">Create Course</button>
                            </form>

                            <h4>Existing Courses</h4>
                            {coursesList.map((course) => (
                                <div key={course.id} className="list-item">
                                    {editingCourse?.id === course.id ? (
                                        /* Edit Form */
                                        (() => {
                                            // Only check sheets if this is the selected course (sheets are loaded)
                                            const courseHasSheets = selectedCourse?.id === course.id && sheetsList.length > 0;
                                            return (
                                                <form onSubmit={handleUpdateCourse} style={{ flex: 1 }}>
                                                    {courseHasSheets && (
                                                        <div className="alert alert-info" style={{ marginBottom: '1rem', padding: '0.5rem', background: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
                                                            ℹ️ This course has signup sheets. Only the course name can be edited.
                                                        </div>
                                                    )}
                                                    <div className="grid">
                                                        <div className="form-group">
                                                            <label>Term</label>
                                                            <input
                                                                type="text"
                                                                name="term"
                                                                defaultValue={course.term}
                                                                required
                                                                disabled={courseHasSheets}
                                                                style={courseHasSheets ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Code</label>
                                                            <input
                                                                type="text"
                                                                name="code"
                                                                defaultValue={course.code}
                                                                required
                                                                disabled={courseHasSheets}
                                                                style={courseHasSheets ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Section</label>
                                                            <input
                                                                type="text"
                                                                name="section"
                                                                defaultValue={course.section}
                                                                required
                                                                disabled={courseHasSheets}
                                                                style={courseHasSheets ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Course Name</label>
                                                        <input type="text" name="name" defaultValue={course.name} required />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button type="submit" className="btn btn-success btn-small">Save</button>
                                                        <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingCourse(null)}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            );
                                        })()
                                    ) : (
                                        /* Normal View */
                                        <>
                                            <div>
                                                <strong>{course.code} - {course.name}</strong>
                                                <p>Term: {course.term} | Section: {course.section}</p>
                                            </div>
                                            <div className="list-item-actions">
                                                <button className="btn btn-primary btn-small" onClick={() => setSelectedCourse(course)}>
                                                    Select
                                                </button>
                                                <button className="btn btn-secondary btn-small" onClick={() => setEditingCourse(course)}>
                                                    Edit
                                                </button>
                                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteCourse(course.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="card">
                            <h3>👥 Manage Members</h3>
                            {selectedCourse ? (
                                <>
                                    <div className="alert alert-info mb-3">
                                        Selected Course: <strong>{selectedCourse.code} - {selectedCourse.name}</strong>
                                    </div>

                                    <form onSubmit={handleAddMember} className="mb-3">
                                        <div className="grid">
                                            <div className="form-group">
                                                <label>Username</label>
                                                <input type="text" name="username" required />
                                            </div>
                                            <div className="form-group">
                                                <label>First Name</label>
                                                <input type="text" name="firstName" required />
                                            </div>
                                            <div className="form-group">
                                                <label>Last Name</label>
                                                <input type="text" name="lastName" required />
                                            </div>
                                            <div className="form-group">
                                                <label>Password</label>
                                                <input type="password" name="password" required />
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Add Member</button>
                                    </form>

                                    <div className="mb-3">
                                        <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer' }}>
                                            📁 Upload CSV File
                                            <input type="file" accept=".csv" onChange={handleBulkUpload} style={{ display: 'none' }} />
                                        </label>
                                        <p className="mt-1"><small>Format: last-name, first-name, username, password</small></p>
                                    </div>

                                    <h4>Members ({membersList.length})</h4>
                                    {membersList.map((member) => (
                                        <div key={member.id} className="list-item">
                                            <div>
                                                <strong>{member.firstName} {member.lastName}</strong>
                                                <p>Username: {member.username}</p>
                                            </div>
                                            <button className="btn btn-danger btn-small" onClick={() => handleDeleteMember(member.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p>Please select a course from the Courses tab first.</p>
                            )}
                        </div>
                    )}

                    {/* Sheets Tab */}
                    {activeTab === 'sheets' && (
                        <div className="card">
                            <h3>📋 Manage Signup Sheets</h3>
                            {selectedCourse ? (
                                <>
                                    <div className="alert alert-info mb-3">
                                        Selected Course: <strong>{selectedCourse.code} - {selectedCourse.name}</strong>
                                    </div>

                                    <form onSubmit={handleAddSheet} className="mb-3">
                                        <div className="form-group">
                                            <label>Assignment Name</label>
                                            <input type="text" name="assignmentName" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <textarea name="description" rows="3"></textarea>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Add Signup Sheet</button>
                                    </form>

                                    <h4>Signup Sheets ({sheetsList.length})</h4>
                                    {sheetsList.map((sheet) => (
                                        <div key={sheet.id} className="list-item">
                                            <div>
                                                <strong>{sheet.assignmentName}</strong>
                                                {sheet.description && <p>{sheet.description}</p>}
                                            </div>
                                            <div className="list-item-actions">
                                                <button className="btn btn-primary btn-small" onClick={() => setSelectedSheet(sheet)}>
                                                    Select
                                                </button>
                                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteSheet(sheet.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p>Please select a course from the Courses tab first.</p>
                            )}
                        </div>
                    )}

                    {/* Slots Tab */}
                    {activeTab === 'slots' && (
                        <div className="card">
                            <h3>⏰ Manage Slots</h3>
                            {selectedSheet ? (
                                <>
                                    <div className="alert alert-info mb-3">
                                        Selected Sheet: <strong>{selectedSheet.assignmentName}</strong>
                                    </div>

                                    <form onSubmit={handleAddSlot} className="mb-3">
                                        <div className="grid">
                                            <div className="form-group">
                                                <label>Start Time</label>
                                                <input type="datetime-local" name="startTime" required />
                                            </div>
                                            <div className="form-group">
                                                <label>End Time</label>
                                                <input type="datetime-local" name="endTime" required />
                                            </div>
                                            <div className="form-group">
                                                <label>Max Members</label>
                                                <input type="number" name="maxMembers" min="1" required />
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Add Slot</button>
                                    </form>

                                    <h4>Slots ({slotsList.length})</h4>
                                    {slotsList.map((slot) => (
                                        <div key={slot.id} className="list-item">
                                            {editingSlot?.id === slot.id ? (
                                                /* Edit Form */
                                                <form onSubmit={handleUpdateSlot} style={{ flex: 1 }}>
                                                    <div className="grid">
                                                        <div className="form-group">
                                                            <label>Start Time</label>
                                                            <input
                                                                type="datetime-local"
                                                                name="startTime"
                                                                defaultValue={new Date(slot.startTime).toISOString().slice(0, 16)}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>End Time</label>
                                                            <input
                                                                type="datetime-local"
                                                                name="endTime"
                                                                defaultValue={new Date(slot.endTime).toISOString().slice(0, 16)}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Max Members</label>
                                                            <input
                                                                type="number"
                                                                name="maxMembers"
                                                                min="1"
                                                                defaultValue={slot.maxMembers}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button type="submit" className="btn btn-success btn-small">Save</button>
                                                        <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingSlot(null)}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                /* Normal View */
                                                <>
                                                    <div>
                                                        <strong>{new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}</strong>
                                                        <p>Capacity: {slot.signupMemberIds?.length || 0} / {slot.maxMembers}</p>
                                                    </div>
                                                    <div className="list-item-actions">
                                                        <button className="btn btn-secondary btn-small" onClick={() => setEditingSlot(slot)}>
                                                            Edit
                                                        </button>
                                                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteSlot(slot.id)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p>Please select a signup sheet from the Sheets tab first.</p>
                            )}
                        </div>
                    )}

                    {/* Grading Tab */}
                    {activeTab === 'grading' && (
                        <div className="card">
                            <h3>📝 Grading Mode</h3>
                            {selectedSheet ? (
                                <>
                                    <div className="alert alert-info mb-3">
                                        Selected Sheet: <strong>{selectedSheet.assignmentName}</strong>
                                    </div>
                                    <button className="btn btn-success" onClick={enterGradingMode}>
                                        Enter Grading Mode
                                    </button>
                                </>
                            ) : (
                                <p>Please select a signup sheet from the Sheets tab first.</p>
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
                </>
            ) : (
                /* Grading Mode View */
                <div className="card">
                    <div className="flex-between mb-3">
                        <h3>📝 Grading Mode</h3>
                        <button className="btn btn-secondary" onClick={() => setGradingMode(false)}>
                            Exit Grading Mode
                        </button>
                    </div>

                    {currentSlot && (
                        <>
                            <div className="alert alert-info mb-3">
                                <h4>Current Slot</h4>
                                <p><strong>Time:</strong> {new Date(currentSlot.startTime).toLocaleString()} - {new Date(currentSlot.endTime).toLocaleString()}</p>
                                <p><strong>Signups:</strong> {currentSlot.signupMemberIds?.length || 0} / {currentSlot.maxMembers}</p>
                            </div>

                            <div className="flex gap-2 mb-3">
                                <button className="btn btn-primary" onClick={() => navigateSlot('prev')}>
                                    ← Previous Slot
                                </button>
                                <button className="btn btn-primary" onClick={() => navigateSlot('next')}>
                                    Next Slot →
                                </button>
                            </div>

                            <h4>Members in this Slot</h4>
                            {slotMembers.length === 0 ? (
                                <p>No members signed up for this slot.</p>
                            ) : (
                                slotMembers.map((member) => (
                                    <div key={member.id} className="list-item">
                                        <div style={{ flex: 1 }}>
                                            <strong>{member.firstName} {member.lastName}</strong>
                                            <p>Username: {member.username}</p>
                                            {member.grade && (
                                                <div className="mt-1">
                                                    <span className="badge badge-success">
                                                        Final Mark: {member.grade.finalMark} / 100
                                                    </span>
                                                    <span className="badge badge-info ml-1">
                                                        Graded by {member.grade.taUsername}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <button className="btn btn-primary btn-small" onClick={() => openGradeModal(member)}>
                                            {member.grade ? 'Edit Grade' : 'Add Grade'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Grade Modal */}
            {showGradeModal && selectedMember && (
                <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Grade: {selectedMember.firstName} {selectedMember.lastName}</h3>
                            <button className="modal-close" onClick={() => setShowGradeModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleGradeSubmit}>
                            {selectedMember.grade && (
                                <div className="alert alert-info mb-2">
                                    <p><strong>Current Final Mark:</strong> {selectedMember.grade.finalMark}</p>
                                    {selectedMember.grade.comment && (
                                        <div className="mt-1">
                                            <strong>Previous Comments:</strong>
                                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                                {selectedMember.grade.comment}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Base Mark (required)</label>
                                <input type="number" name="baseMark" min="0" max="100"
                                    defaultValue={selectedMember.grade?.baseMark || ''} required />
                            </div>

                            <div className="grid">
                                <div className="form-group">
                                    <label>Bonus</label>
                                    <input type="number" name="bonus" min="0"
                                        defaultValue={selectedMember.grade?.bonus || 0} />
                                </div>
                                <div className="form-group">
                                    <label>Penalty</label>
                                    <input type="number" name="penalty" min="0"
                                        defaultValue={selectedMember.grade?.penalty || 0} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Comment {selectedMember.grade && '(required for changes)'}</label>
                                <textarea name="comment" rows="4"
                                    required={!!selectedMember.grade}
                                    placeholder="Enter your comment here..."></textarea>
                            </div>

                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-success">Save Grade</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
