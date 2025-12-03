const API_BASE = '';

/**
 * Generic API request handler with JWT auth
 */
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Auth API
export const auth = {
    login: (username, password) =>
        request('/api/open/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }),

    changePassword: (oldPassword, newPassword) =>
        request('/api/secure/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        })
};

// Search API (unauthenticated)
export const search = {
    courses: (code) =>
        request(`/api/open/search?code=${encodeURIComponent(code)}`)
};

// Course API
export const courses = {
    list: () => request('/api/secure/courses'),
    create: (data) => request('/api/secure/courses', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/api/secure/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/api/secure/courses/${id}`, {
        method: 'DELETE'
    })
};

// Members API
export const members = {
    list: (courseId) => request(`/api/secure/members/${courseId}`),
    add: (courseId, data) => request(`/api/secure/members/${courseId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    delete: (courseId, memberId) =>
        request(`/api/secure/members/${courseId}/${memberId}`, {
            method: 'DELETE'
        }),
    bulkAdd: async (courseId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/secure/members/${courseId}/bulk`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
        return data;
    }
};

// Sheets API
export const sheets = {
    list: (courseId) => request(`/api/secure/sheets/${courseId}`),
    add: (courseId, data) => request(`/api/secure/sheets/${courseId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (sheetId, data) => request(`/api/secure/sheets/one/${sheetId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (sheetId) => request(`/api/secure/sheets/one/${sheetId}`, {
        method: 'DELETE'
    })
};

// Slots API
export const slots = {
    list: (sheetId) => request(`/api/secure/slots/${sheetId}`),
    add: (sheetId, data) => request(`/api/secure/slots/${sheetId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (slotId, data) => request(`/api/secure/slots/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (slotId) => request(`/api/secure/slots/${slotId}`, {
        method: 'DELETE'
    })
};

// Grading API
export const grades = {
    getCurrentSlot: (sheetId) => request(`/api/secure/grades/current/${sheetId}`),
    navigate: (slotId, direction) =>
        request(`/api/secure/grades/navigate/${slotId}?direction=${direction}`),
    addOrUpdate: (slotId, memberId, data) =>
        request(`/api/secure/grades/${slotId}/${memberId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getAudit: (gradeId) => request(`/api/secure/grades/audit/${gradeId}`)
};

// Student API
export const students = {
    mySignups: () => request('/api/secure/students/my-signups'),
    availableSlots: () => request('/api/secure/students/available-slots'),
    signup: (slotId) => request(`/api/secure/students/signup/${slotId}`, {
        method: 'POST'
    }),
    leave: (slotId) => request(`/api/secure/students/leave/${slotId}`, {
        method: 'DELETE'
    })
};

// Admin API
export const admin = {
    addTA: (username) => request('/api/admin/add-ta', {
        method: 'POST',
        body: JSON.stringify({ username })
    }),
    removeTA: (username) => request('/api/admin/remove-ta', {
        method: 'POST',
        body: JSON.stringify({ username })
    }),
    resetPassword: (username) => request('/api/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({ username })
    })
};
