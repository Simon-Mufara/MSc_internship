// Determine API base URL based on environment
let API_BASE = 'http://localhost:5000/api';

// If on deployed site (not localhost), try current domain
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  API_BASE = `${window.location.protocol}//${window.location.host}/api`;
}

// Allow manual override via window.API_BASE_OVERRIDE for custom deployments
if (window.API_BASE_OVERRIDE) {
  API_BASE = window.API_BASE_OVERRIDE;
}

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
  try {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('Server returned invalid data');
    }
    throw err;
  }
}

const api = {
  auth: {
    async login(username, password) {
      try {
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
      } catch (err) {
        console.error('Login fetch error:', err);
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          throw new Error(`Cannot reach server at ${API_BASE}. Ensure server is running.`);
        }
        throw err;
      }
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
  },

  portfolio: {
    async getByAuthor(author) {
      const response = await fetch(`${API_BASE}/portfolio/${author}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.entries || [];
    },

    async create(title, content, entry_date) {
      const response = await fetch(`${API_BASE}/portfolio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content, entry_date })
      });
      return handleResponse(response);
    },

    async update(id, title, content, entry_date) {
      const response = await fetch(`${API_BASE}/portfolio/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content, entry_date })
      });
      return handleResponse(response);
    },

    async delete(id) {
      const response = await fetch(`${API_BASE}/portfolio/${id}`, {
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
