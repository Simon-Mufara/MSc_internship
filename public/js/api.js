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

let api = {
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

const USE_MOCK_API = Boolean(window.API_BASE_OVERRIDE ? false : window.location.hostname.endsWith('github.io'));
window.API_IS_MOCK = USE_MOCK_API;

// --- Fallback mock API for GitHub Pages ---
function makeMockToken(username) {
  const payload = { username, role: 'student', iat: Date.now() };
  return `mock.${btoa(JSON.stringify(payload))}.sig`;
}

function createMockApi() {
  const STORAGE_KEY = 'msc_mock_store_v1';

  const defaultStore = {
    users: {
      'simon': { password: 'simon2026', role: 'student' },
      'dalvie': { password: 'dalvie2026', role: 'conveyor' },
      'martin': { password: 'martin2026', role: 'supervisor' }
    },
    events: [],
    assignments: [],
    messages: {},
    progress: {},
    resources: { lectures: [], recordings: [], materials: [] },
    portfolio: {}
  };

  const readStore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign({}, defaultStore, JSON.parse(raw)) : JSON.parse(JSON.stringify(defaultStore));
    } catch (error) {
      return JSON.parse(JSON.stringify(defaultStore));
    }
  };

  const writeStore = (nextStore) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
  };

  const store = readStore();

  const save = () => writeStore(store);

  return {
    auth: {
      async login(username, password) {
        const expectedPassword = store.users[username]?.password || `${username}2026`;
        const role = store.users[username]?.role || (username === 'dalvie' ? 'conveyor' : username === 'martin' ? 'supervisor' : 'student');
        if (password === expectedPassword) {
          const token = makeMockToken(username);
          setAuthToken(token);
          return { token, user: { username, role } };
        }
        throw new Error('Invalid credentials (mock)');
      },
      async logout() {
        localStorage.removeItem('authToken');
        authToken = null;
      }
    },

    events: {
      async getAll() { return store.events.slice(); },
      async create(e) { e.id = Date.now().toString(); store.events.push(e); save(); return { event: e }; },
      async update(id, e) { const i = store.events.findIndex(x=>x.id===id); if(i>=0){store.events[i]=Object.assign(store.events[i],e); save(); return {event:store.events[i]};} throw new Error('Not found'); },
      async delete(id){ store.events = store.events.filter(x=>x.id!==id); save(); return { success: true }; }
    },

    assignments: {
      async getAll(){ return store.assignments.slice(); },
      async create(a){ a.id = Date.now().toString(); store.assignments.push(a); save(); return { assignment: a }; },
      async update(id,a){ const i=store.assignments.findIndex(x=>x.id===id); if(i>=0){store.assignments[i]=Object.assign(store.assignments[i],a); save(); return {assignment:store.assignments[i]};} throw new Error('Not found'); },
      async delete(id){ store.assignments = store.assignments.filter(x=>x.id!==id); save(); return { success: true }; }
    },

    messages: {
      async getWithRecipient(recipient){ return store.messages[recipient] || []; },
      async send(recipient, content){ store.messages[recipient]=store.messages[recipient]||[]; store.messages[recipient].push({id:Date.now().toString(),sender:getUsername() || 'student',content,timestamp:new Date().toISOString()}); save(); return { success: true }; }
    },

    progress: {
      async get(userId){ return store.progress[userId] || {}; },
      async update(userId, progress){ store.progress[userId] = Object.assign({}, store.progress[userId] || {}, progress); save(); return { success: true }; }
    },

    resources: {
      async getByType(type){ return (store.resources[type] || []).slice(); },
      async upload(r){
        const resource = Object.assign({ id: Date.now().toString(), created_at: new Date().toISOString() }, r);
        store.resources[typeSafe(resource.type)] = store.resources[typeSafe(resource.type)] || [];
        store.resources[typeSafe(resource.type)].unshift(resource);
        save();
        return { success: true, resource };
      },
      async delete(id){
        for (const type of ['lectures', 'recordings', 'materials']) {
          const index = (store.resources[type] || []).findIndex(item => String(item.id) === String(id));
          if (index >= 0) {
            store.resources[type].splice(index, 1);
            save();
            return { success: true };
          }
        }
        return { success: true };
      }
    },

    portfolio: {
      async getByAuthor(author){ return (store.portfolio[author] || []).slice().sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date)); },
      async create(title, content, entry_date){
        const author = getUsername() || 'student';
        const entry = { id: Date.now().toString(), author, title, content, entry_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        store.portfolio[author] = store.portfolio[author] || [];
        store.portfolio[author].unshift(entry);
        save();
        return { entry };
      },
      async update(id, title, content, entry_date){
        for (const author of Object.keys(store.portfolio)) {
          const index = store.portfolio[author].findIndex(entry => String(entry.id) === String(id));
          if (index >= 0) {
            store.portfolio[author][index] = Object.assign({}, store.portfolio[author][index], {
              title,
              content,
              entry_date,
              updated_at: new Date().toISOString()
            });
            save();
            return { entry: store.portfolio[author][index] };
          }
        }
        throw new Error('Not found');
      },
      async delete(id){
        for (const author of Object.keys(store.portfolio)) {
          const before = store.portfolio[author].length;
          store.portfolio[author] = store.portfolio[author].filter(entry => String(entry.id) !== String(id));
          if (store.portfolio[author].length !== before) {
            save();
            return { success: true };
          }
        }
        return { success: true };
      }
    }
  };
}

function typeSafe(type) {
  return ['lectures', 'recordings', 'materials'].includes(type) ? type : 'materials';
}

if (USE_MOCK_API) {
  console.warn('GitHub Pages detected - using client-side mock API for demo mode.');
  api = createMockApi();
}
