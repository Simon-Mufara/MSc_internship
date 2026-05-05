const API_BASE = 'http://localhost:5000/api';

let authToken = localStorage.getItem('authToken');

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
}

const api = {
  auth: {
    async login(username, password) {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await handleResponse(response);
      if (data.token) {
        setAuthToken(data.token);
      }
      return data;
    },

    async logout() {
      localStorage.removeItem('authToken');
      authToken = null;
    }
  },

  events: {
    async getAll() {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.events || [];
    },

    async create(event) {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(event)
      });
      return handleResponse(response);
    },

    async update(eventId, event) {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(event)
      });
      return handleResponse(response);
    },

    async delete(eventId) {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  assignments: {
    async getAll() {
      const response = await fetch(`${API_BASE}/assignments`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.assignments || [];
    },

    async create(assignment) {
      const response = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignment)
      });
      return handleResponse(response);
    },

    async update(assignmentId, assignment) {
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignment)
      });
      return handleResponse(response);
    },

    async delete(assignmentId) {
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  messages: {
    async getWithRecipient(recipient) {
      const response = await fetch(`${API_BASE}/messages/${recipient}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.messages || [];
    },

    async send(recipient, content) {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipient, content })
      });
      return handleResponse(response);
    }
  },

  progress: {
    async get(userId) {
      const response = await fetch(`${API_BASE}/progress/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.progress || {};
    },

    async update(userId, progress) {
      const response = await fetch(`${API_BASE}/progress/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(progress)
      });
      return handleResponse(response);
    }
  },

  resources: {
    async getByType(type) {
      const response = await fetch(`${API_BASE}/resources/${type}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.resources || [];
    },

    async upload(resource) {
      const response = await fetch(`${API_BASE}/resources`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(resource)
      });
      return handleResponse(response);
    },

    async delete(resourceId) {
      const response = await fetch(`${API_BASE}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  }
};

function isAuthenticated() {
  return !!authToken;
}

function getUsername() {
  if (!authToken) return null;
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    return payload.username;
  } catch (e) {
    return null;
  }
}

function getRole() {
  if (!authToken) return null;
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
}
