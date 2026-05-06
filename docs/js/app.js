let currentUser = null;
let currentUserRole = null;
let currentMonth = new Date();
let currentEditingEvent = null;
let appData = {
  events: [],
  assignments: [],
  progress: {},
  messages: {}
};

let messagePollId = null;
let socket = null;

let localLibrary = {
  resources: { lectures: [], recordings: [], materials: [] },
  projects: []
};

const examTimetable = [
  {
    title: 'IBS6024F - Biocomputing',
    type: 'assessment',
    date: '2026-06-01',
    description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Computer and paper-based | Invigilator: Hocine Bendou'
  },
  {
    title: 'IBS6025F - Bioinformatic Programming with Python',
    type: 'assessment',
    date: '2026-06-03',
    description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Computer and paper-based | Invigilators: Hocine Bendou, Shareefa Dalvie'
  },
  {
    title: 'IBS6026F - Machine Learning and Biomedical Data Science',
    type: 'assessment',
    date: '2026-06-05',
    description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Computer-based | Invigilator: Musalula Sinkala'
  },
  {
    title: 'PTY6028F - Omics Data Generation',
    type: 'assessment',
    date: '2026-06-08',
    description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Paper-based | Invigilator: Shareefa Dalvie'
  },
  {
    title: 'PTY6027F - Omics Data Mining',
    type: 'assessment',
    date: '2026-06-10',
    description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Paper-based | Invigilator: Shareefa Dalvie'
  },
  {
    title: 'PTY6029F - Population Genomics',
    type: 'assessment',
    date: '2026-06-12',
    description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Paper-based | Invigilator: Shareefa Dalvie'
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  updateDate();
  checkAuthentication();
  setupEventListeners();
});

function checkAuthentication() {
  if (isAuthenticated()) {
    currentUser = getUsername();
    currentUserRole = getRole();
    showApp();
    initApp();
  }
}

function setupEventListeners() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      switchSection(this.dataset.section);
    });
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('usernameInput').value;
  const password = document.getElementById('passwordInput').value;

  try {
    if (!username || !password) {
      showError('Please enter username and password');
      return;
    }
    
    console.log('Attempting login for:', username);
    const result = await api.auth.login(username, password);
    console.log('Login successful:', result);
    
    if (!result.user) {
      throw new Error('No user data returned from server');
    }
    
    currentUser = result.user.username;
    currentUserRole = result.user.role;
    console.log('User logged in as:', currentUser, 'with role:', currentUserRole);
    showApp();
    initApp();
  } catch (error) {
    console.error('Login error:', error);
    const errorMsg = error.message || 'Login failed';
    if (errorMsg.includes('fetch')) {
      showError('Cannot connect to server. Make sure the server is running.');
    } else if (errorMsg.includes('401') || errorMsg.includes('Invalid')) {
      showError('Invalid username or password');
    } else {
      showError(errorMsg);
    }
  }
}

async function handleLogout() {
  if (confirm('Logout?')) {
    await api.auth.logout();
    currentUser = null;
    currentUserRole = null;
    location.reload();
  }
}

function showError(msg) {
  const errorEl = document.getElementById('errorMsg');
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
  setTimeout(() => errorEl.style.display = 'none', 3000);
}

function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';
}

function notify(msg, type = 'success') {
  const notif = document.createElement('div');
  notif.className = `notification ${type === 'error' ? 'error' : ''}`;
  notif.textContent = msg;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function updateDate() {
  const now = new Date();
  document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

async function initApp() {
  updateUI();
  setupNavigation();
  loadLocalLibrary();
  await loadAllData();
  initSocket();
  mergeExamTimetable();
  focusCalendarOnExams();
  renderCalendar();
  await updateDashboard();
  await renderProjects();
}

function initSocket() {
  try {
    if (typeof io === 'undefined') return; // socket.io client not present
    if (socket) return;
    const token = localStorage.getItem('authToken');
    socket = io({ auth: { token } });
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('new_message', (data) => {
      // refresh message lists if involved
      if (!currentUser) return;
      if (data.recipient === currentUser || data.sender === currentUser) {
        loadMessages('conveyor');
        loadMessages('supervisor');
      }
    });
  } catch (e) {
    console.warn('Socket init failed:', e.message || e);
  }
}

function loadLocalLibrary() {
  const saved = localStorage.getItem('localLibrary');
  if (!saved) {
    ensureDefaultResearchProject();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    localLibrary.resources = parsed.resources || localLibrary.resources;
    localLibrary.projects = parsed.projects || [];
  } catch (error) {
    console.error('Error loading local library:', error);
  }

  ensureDefaultResearchProject();
}

function saveLocalLibrary() {
  localStorage.setItem('localLibrary', JSON.stringify(localLibrary));
}

function getResearchPdfUrl() {
  // Synchronous fallback for callers that expect a string
  return './research_focus.pdf';
}

async function findResearchPdfUrl() {
  const candidates = [
    './research_focus.pdf',
    'research_focus.pdf',
    './public/research_focus.pdf',
    'public/research_focus.pdf',
    '/research_focus.pdf'
  ];

  for (const c of candidates) {
    try {
      const res = await fetch(c, { method: 'GET', cache: 'no-store' });
      if (res && res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('pdf') || c.toLowerCase().endsWith('.pdf')) return c;
      }
    } catch (e) {
      // ignore and continue
    }
  }

  return './research_focus.pdf';
}

function ensureDefaultResearchProject() {
  localLibrary.projects = localLibrary.projects || [];
  const exists = localLibrary.projects.some(project => project.locked && project.title === 'Current Research Focus');

  if (!exists) {
    localLibrary.projects.unshift({
      title: 'Current Research Focus',
      description: 'Research focus supervised by Prof. Nicole Mulder',
      fileUrl: getResearchPdfUrl(),
      uploadedAt: 'Always available',
      supervisor: 'Prof. Nicole Mulder',
      locked: true
    });
    // probe for a working URL and update project when found
    findResearchPdfUrl().then(url => {
      const p = localLibrary.projects.find(proj => proj.locked && proj.title === 'Current Research Focus');
      if (p) {
        p.fileUrl = url;
        saveLocalLibrary();
        renderProjects();
      }
    }).catch(() => {});
    saveLocalLibrary();
  }
}

function mergeExamTimetable() {
  const seen = new Set(appData.events.map(event => `${event.title}|${event.date}`));
  examTimetable.forEach(event => {
    const key = `${event.title}|${event.date}`;
    if (!seen.has(key)) {
      appData.events.push({ ...event, created_by: 'dalvie', reminder: 0 });
      seen.add(key);
    }
  });
}

function focusCalendarOnExams() {
  const examEvents = appData.events
    .filter(event => event.type === 'assessment')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (examEvents.length > 0) {
    const firstExamDate = new Date(`${examEvents[0].date}T00:00:00`);
    currentMonth = new Date(firstExamDate.getFullYear(), firstExamDate.getMonth(), 1);
  }
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function updateUI() {
  const roleNames = {
    student: `👨‍🎓 ${currentUser}`,
    conveyor: '👩‍🏫 Dalvie (UCT Conveyor)',
    supervisor: '👩‍💼 Martin (UFS Supervisor)'
  };

  document.getElementById('userBadge').textContent = roleNames[currentUserRole] || currentUser;
  document.getElementById('userDisplay').textContent = `Logged in as ${roleNames[currentUserRole] || currentUser}`;

  // Students can upload materials; conveyor/supervisor can upload all content types
  const canUploadMaterials = currentUserRole === 'student' || currentUserRole === 'conveyor' || currentUserRole === 'supervisor';
  const canUploadLectures = currentUserRole === 'conveyor' || currentUserRole === 'supervisor';
  const canAddAssignments = currentUserRole === 'conveyor' || currentUserRole === 'supervisor';
  
  document.getElementById('lectureUpload').style.display = canUploadLectures ? 'block' : 'none';
  document.getElementById('recordingUpload').style.display = canUploadLectures ? 'block' : 'none';
  document.getElementById('materialUpload').style.display = canUploadMaterials ? 'block' : 'none';
  document.getElementById('projectUpload').style.display = canUploadLectures ? 'block' : 'none';
  document.getElementById('assignmentCreateForm').style.display = canAddAssignments ? 'block' : 'none';

  const isSupervisor = currentUserRole === 'supervisor';
  document.getElementById('supervisorFeedback').style.display = isSupervisor ? 'block' : 'none';

  if (currentUserRole !== 'student') {
    document.getElementById('monthlyUpdate').disabled = true;
    document.getElementById('pty6027').disabled = true;
    document.getElementById('pty6028').disabled = true;
  }
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      switchSection(this.dataset.section);
    });
  });
}

async function switchSection(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(section + 'Section').classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`).classList.add('active');

  const titles = {
    dashboard: '📊 Dashboard',
    calendar: '📅 Calendar',
    resources: '📁 Resources',
    projects: '📁 Projects',
    portfolio: '📓 Portfolio',
    assignments: '✏️ Assignments',
    progress: '📈 Progress',
    messages: '💬 Messages'
  };

  document.getElementById('pageTitle').textContent = titles[section];

  if (section === 'calendar') {
    renderCalendar();
    await renderAllEvents();
    // stop messages polling when leaving messages
    if (messagePollId) { clearInterval(messagePollId); messagePollId = null; }
  } else if (section === 'progress') {
    await loadProgress();
    if (messagePollId) { clearInterval(messagePollId); messagePollId = null; }
  } else if (section === 'assignments') {
    await loadAssignments();
    if (messagePollId) { clearInterval(messagePollId); messagePollId = null; }
  } else if (section === 'resources') {
    await loadResources();
    if (messagePollId) { clearInterval(messagePollId); messagePollId = null; }
  } else if (section === 'projects') {
    await renderProjects();
    if (messagePollId) { clearInterval(messagePollId); messagePollId = null; }
  } else if (section === 'messages') {
    await loadMessages('conveyor');
    await loadMessages('supervisor');
    // start polling messages for real-time-ish sync
    if (!messagePollId) {
      messagePollId = setInterval(() => {
        loadMessages('conveyor');
        loadMessages('supervisor');
      }, 3000);
    }
  } else if (section === 'portfolio') {
    await loadPortfolio();
    if (messagePollId) { clearInterval(messagePollId); messagePollId = null; }
  }
}

async function loadAllData() {
  try {
    appData.events = await api.events.getAll();
    appData.assignments = await api.assignments.getAll();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// CALENDAR
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  document.getElementById('calendarMonth').textContent =
    currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let html = '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days.forEach(d => {
    html += `<div class="calendar-day-header">${d}</div>`;
  });

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month"><div class="calendar-day-number">${daysInPrevMonth - i}</div></div>`;
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const dateStr = formatDateKey(date);
    const dayEvents = appData.events.filter(e => e.date === dateStr);

    html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="openEventModal('${dateStr}')">
      <div class="calendar-day-number">${day}</div>
      <div class="day-events">`;

    dayEvents.slice(0, 2).forEach(e => {
      const color = { assessment: 'event-assessment', deadline: 'event-deadline', work: 'event-work', class: 'event-class' };
      html += `<div class="event-badge ${color[e.type] || ''}">${e.title}</div>`;
    });

    if (dayEvents.length > 2) html += `<div style="font-size: 10px; color: var(--text-light);">+${dayEvents.length - 2} more</div>`;
    html += `</div></div>`;
  }

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let day = 1; day <= totalCells - firstDay - daysInMonth; day++) {
    html += `<div class="calendar-day other-month"><div class="calendar-day-number">${day}</div></div>`;
  }

  document.getElementById('calendarGrid').innerHTML = html;
}

function previousMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  renderCalendar();
}

function todayMonth() {
  currentMonth = new Date();
  renderCalendar();
}

// EVENTS
async function openEventModal(dateStr = null) {
  if (!['student', 'conveyor', 'supervisor'].includes(currentUserRole)) return;

  currentEditingEvent = null;
  document.getElementById('modalTitle').textContent = 'Add Event';
  document.getElementById('eventForm').reset();
  document.getElementById('deleteEventBtn').style.display = 'none';

  if (dateStr) {
    document.getElementById('eventStart').value = dateStr;
    document.getElementById('eventEnd').value = dateStr;
  }

  document.getElementById('eventModal').classList.add('active');
}

function closeEventModal() {
  document.getElementById('eventModal').classList.remove('active');
  currentEditingEvent = null;
}

async function saveEvent(e) {
  e.preventDefault();

  const event = {
    title: document.getElementById('eventTitle').value,
    type: document.getElementById('eventType').value,
    date: document.getElementById('eventStart').value,
    endDate: document.getElementById('eventEnd').value,
    description: document.getElementById('eventDesc').value,
    reminder: document.getElementById('eventReminder').checked
  };

  try {
    if (currentEditingEvent) {
      await api.events.update(currentEditingEvent.id, event);
    } else {
      await api.events.create(event);
    }

    await loadAllData();
    closeEventModal();
    renderCalendar();
    await renderAllEvents();
    await updateDashboard();
    notify('✅ Event saved!');
  } catch (error) {
    notify('Error saving event: ' + error.message, 'error');
  }
}

async function deleteEvent() {
  if (!currentEditingEvent) return;
  if (!confirm('Delete this event?')) return;

  try {
    await api.events.delete(currentEditingEvent.id);
    await loadAllData();
    closeEventModal();
    renderCalendar();
    await renderAllEvents();
    await updateDashboard();
    notify('Event deleted');
  } catch (error) {
    notify('Error deleting event: ' + error.message, 'error');
  }
}

async function renderAllEvents() {
  const sorted = [...appData.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  let html = sorted.length ? sorted.map(e => `
    <div class="event-item">
      <div class="event-item-content">
        <div class="event-item-title">${e.title}</div>
        <div class="event-item-meta">
          📅 ${parseDateOnly(e.date).toLocaleDateString()} |
          <span style="display: inline-block; padding: 2px 6px; background: var(--light); border-radius: 3px; margin: 0 4px;">
            ${e.type}
          </span>
          Created by: ${e.created_by}
        </div>
      </div>
      ${(currentUserRole === 'conveyor' || currentUserRole === e.created_by) ? `
        <button class="btn btn-primary btn-small" onclick="editEvent(${e.id})">Edit</button>
      ` : ''}
    </div>
  `).join('') : '<p style="color: var(--text-light); font-size: 13px;">No events yet</p>';

  document.getElementById('allEventsList').innerHTML = html;
}

async function editEvent(id) {
  const event = appData.events.find(e => e.id === id);
  if (!event) return;

  currentEditingEvent = event;
  document.getElementById('modalTitle').textContent = 'Edit Event';
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventType').value = event.type;
  document.getElementById('eventStart').value = event.date;
  document.getElementById('eventEnd').value = event.end_date;
  document.getElementById('eventDesc').value = event.description;
  document.getElementById('eventReminder').checked = event.reminder;
  document.getElementById('deleteEventBtn').style.display = 'block';

  document.getElementById('eventModal').classList.add('active');
}

// ASSIGNMENTS
async function createAssignment() {
  const title = document.getElementById('assignTitle').value;
  const desc = document.getElementById('assignDesc').value;
  const due = document.getElementById('assignDue').value;

  if (!title || !desc || !due) return alert('Fill all fields');

  try {
    await api.assignments.create({ title, description: desc, dueDate: due });
    document.getElementById('assignTitle').value = '';
    document.getElementById('assignDesc').value = '';
    document.getElementById('assignDue').value = '';
    await loadAssignments();
    await updateDashboard();
    notify('✅ Assignment created!');
  } catch (error) {
    notify('Error creating assignment: ' + error.message, 'error');
  }
}

async function loadAssignments() {
  try {
    appData.assignments = await api.assignments.getAll();
    let html = appData.assignments.length ? appData.assignments.map(a => `
      <div class="event-item" style="border-left-color: var(--warning);">
        <div class="event-item-content">
          <div class="event-item-title">${a.title}</div>
          <div class="event-item-meta">Due: ${parseDateOnly(a.due_date).toLocaleDateString()} | Status: ${a.status}</div>
          <div style="margin-top: 8px; font-size: 13px; color: var(--text);">${a.description}</div>
        </div>
      </div>
    `).join('') : '<p style="color: var(--text-light);">No assignments</p>';

    document.getElementById('assignmentsList').innerHTML = html;
  } catch (error) {
    console.error('Error loading assignments:', error);
  }
}

// PROGRESS
async function saveProgress() {
  try {
    const progress = {
      monthlyUpdate: document.getElementById('monthlyUpdate').value,
      pty6027: document.getElementById('pty6027').value,
      pty6028: document.getElementById('pty6028').value,
      supervisorFeedback: document.getElementById('feedbackArea').value
    };
    await api.progress.update(currentUser, progress);
    await updateDashboard();
    notify('✅ Progress saved!');
  } catch (error) {
    notify('Error saving progress: ' + error.message, 'error');
  }
}

async function loadProgress() {
  try {
    const p = await api.progress.get(currentUser);
    document.getElementById('monthlyUpdate').value = p.monthlyUpdate || '';
    document.getElementById('pty6027').value = p.pty6027 || 0;
    document.getElementById('pty6028').value = p.pty6028 || 0;
    document.getElementById('feedbackArea').value = p.supervisorFeedback || '';
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

// MESSAGES
async function sendMessage(recipient) {
  const input = document.getElementById(recipient + 'Msg');
  const msg = input.value.trim();
  if (!msg) return;

  try {
    await api.messages.send(recipient, msg);
    input.value = '';
    await loadMessages(recipient);
    notify('📨 Message sent!');
  } catch (error) {
    notify('Error sending message: ' + error.message, 'error');
  }
}

async function loadMessages(recipient) {
  try {
    const msgs = await api.messages.getWithRecipient(recipient);
    let html = msgs.map(m => `
      <div class="event-item">
        <div class="event-item-content">
          <div class="event-item-title">${m.sender}</div>
          <div class="event-item-meta">${new Date(m.timestamp).toLocaleString()}</div>
          <div style="margin-top: 8px; color: var(--text);">${m.content}</div>
        </div>
      </div>
    `).join('');

    document.getElementById(recipient + 'Messages').innerHTML = html || '<p style="color: var(--text-light);">No messages</p>';
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

// RESOURCES
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tab + 'Tab').classList.add('active');
  event.target.classList.add('active');
}

function handleFileUpload(event, type) {
  const files = event.target.files;
  if (!files || !files.length) return;

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        date: new Date().toLocaleDateString(),
        data: e.target.result,
        mimeType: file.type
      };

      localLibrary.resources[type].push(item);
      saveLocalLibrary();
      loadResources();
      notify(`✅ ${file.name} uploaded!`);
    };
    reader.readAsDataURL(file);
  }

  event.target.value = '';
}

function getCombinedResources(type) {
  const apiItems = (window._apiResources && window._apiResources[type]) || [];
  const localItems = localLibrary.resources[type] || [];

  return [
    ...localItems.map((item, index) => ({ ...item, _source: 'local', _localIndex: index })),
    ...apiItems.map(item => ({ ...item, _source: 'api' }))
  ];
}

async function loadResources() {
  try {
    window._apiResources = window._apiResources || { lectures: [], recordings: [], materials: [] };
    for (let type of ['lectures', 'recordings', 'materials']) {
      const resources = await api.resources.getByType(type);
      window._apiResources[type] = resources;
      const combined = getCombinedResources(type);
      const html = combined.length ? combined.map((f, i) => `
        <div class="event-item">
          <div class="event-item-content">
            <div class="event-item-title">📄 ${f.name}</div>
            <div class="event-item-meta">${f.size || f.fileSize || '0.00'} MB • ${f.created_at || f.date || ''}</div>
          </div>
          ${f.data ? `<button class="btn btn-secondary btn-small" onclick="downloadLocalFile('${f.data}', '${f.name}')">Download</button>` : ''}
          ${currentUserRole === 'conveyor' ? `<button class="btn btn-danger btn-small" onclick="deleteResource('${type}', ${f._source === 'local' ? f._localIndex : f.id}, '${f._source}')">Delete</button>` : ''}
        </div>
      `).join('') : '<p style="color: var(--text-light);">No files</p>';

      document.getElementById(type + 'List').innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading resources:', error);
  }
}

async function deleteResource(type, id, source = 'api') {
  try {
    if (source === 'local') {
      const localItems = localLibrary.resources[type] || [];
      localItems.splice(id, 1);
      saveLocalLibrary();
      await loadResources();
      notify('Resource deleted');
      return;
    }

    await api.resources.delete(id);
    await loadResources();
    notify('Resource deleted');
  } catch (error) {
    notify('Error deleting resource: ' + error.message, 'error');
  }
}

function downloadLocalFile(data, name) {
  const link = document.createElement('a');
  link.href = data;
  link.download = name;
  link.click();
}

function handleProjectUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const titleInput = document.getElementById('projectTitleInput');
  const descriptionInput = document.getElementById('projectDescriptionInput');
  const title = titleInput.value.trim() || file.name.replace(/\.pdf$/i, '');

  const reader = new FileReader();
  reader.onload = (e) => {
    localLibrary.projects.push({
      title,
      description: descriptionInput.value.trim(),
      fileName: file.name,
      fileData: e.target.result,
      uploadedAt: new Date().toLocaleDateString(),
      supervisor: 'Prof. Nicole Mulder'
    });

    saveLocalLibrary();
    titleInput.value = '';
    descriptionInput.value = '';
    event.target.value = '';
    renderProjects();
    notify('✅ Project PDF added!');
  };
  reader.readAsDataURL(file);
}

async function renderProjects() {
  const list = document.getElementById('projectsList');
  const viewer = document.getElementById('projectPdfViewer');
  if (!list || !viewer) return;

  const projects = localLibrary.projects || [];
  if (!projects.length) {
    list.innerHTML = '<p style="color: var(--text-light);">No project PDFs uploaded yet</p>';
    viewer.src = 'about:blank';
    document.getElementById('projectPreviewTitle').textContent = 'No project selected';
    return;
  }

  list.innerHTML = projects.map((project, index) => `
    <div class="event-item">
      <div class="event-item-content">
        <div class="event-item-title">📄 ${project.title}</div>
        <div class="event-item-meta">Supervisor: ${project.supervisor} • ${project.uploadedAt}</div>
        <div style="margin-top: 8px; color: var(--text);">${project.description || ''}</div>
      </div>
      <button class="btn btn-primary btn-small" onclick="viewProject(${index})">View PDF</button>
      ${project.fileData ? `<button class="btn btn-secondary btn-small" onclick="downloadLocalFile('${project.fileData}', '${project.fileName}')">Download</button>` : `<button class="btn btn-secondary btn-small" onclick="window.open('${project.fileUrl}', '_blank')">Open</button>`}
      ${project.locked ? '' : `<button class="btn btn-danger btn-small" onclick="deleteProject(${index})">Delete</button>`}
    </div>
  `).join('');

  viewProject(0);
}

function viewProject(index) {
  const project = localLibrary.projects[index];
  if (!project) return;

  const viewer = document.getElementById('projectPdfViewer');
  const title = document.getElementById('projectPreviewTitle');
  viewer.src = project.fileData || project.fileUrl;
  title.textContent = project.title;
}

function deleteProject(index) {
  if (localLibrary.projects[index]?.locked) return;
  localLibrary.projects.splice(index, 1);
  saveLocalLibrary();
  renderProjects();
}

// DASHBOARD
async function updateDashboard() {
  try {
    const upcomingDays = 7;
    const today = new Date();
    const upcoming = appData.events
      .filter(e => {
        const eDate = parseDateOnly(e.date);
        return eDate >= today && eDate <= new Date(today.getTime() + upcomingDays * 24 * 60 * 60 * 1000);
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    document.getElementById('stat-events').textContent = appData.events.length;
    document.getElementById('stat-assignments').textContent = appData.assignments.length;

    const progress = await api.progress.get(currentUser);
    const avg = progress.pty6027 && progress.pty6028 ? Math.round((parseInt(progress.pty6027) + parseInt(progress.pty6028)) / 2) : 0;
    document.getElementById('stat-progress').textContent = avg + '%';

    document.getElementById('upcomingEventsList').innerHTML = upcoming.length ? upcoming.map(e => `
      <div class="event-item">
        <div class="event-item-content">
          <div class="event-item-title">${e.title}</div>
          <div class="event-item-meta">📅 ${parseDateOnly(e.date).toLocaleDateString()} | ${e.type}</div>
        </div>
      </div>
    `).join('') : '<p style="color: var(--text-light);">No upcoming events in the next 7 days</p>';

    let totalMessages = 0;
    try {
      const convMsgs = await api.messages.getWithRecipient('conveyor');
      const supMsgs = await api.messages.getWithRecipient('supervisor');
      totalMessages = convMsgs.length + supMsgs.length;
    } catch (e) {}
    document.getElementById('stat-messages').textContent = totalMessages;
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

// PORTFOLIO
async function loadPortfolio() {
  try {
    // Load current user's portfolio if student, otherwise load simon's
    const author = currentUserRole === 'student' ? currentUser : 'simon';
    const entries = await api.portfolio.getByAuthor(author);
    
    let html = '';
    if (currentUserRole === 'student') {
      // Student view: show input and list
      html = `
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title">✍️ Write New Portfolio Entry</div>
          <div class="form-group">
            <label>Entry Date</label>
            <input type="date" id="portfolioDate" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="portfolioTitle" placeholder="Entry title">
          </div>
          <div class="form-group">
            <label>What did you accomplish today?</label>
            <textarea id="portfolioContent" placeholder="Write your daily portfolio entry..." style="min-height: 150px;"></textarea>
          </div>
          <button class="btn btn-primary" onclick="savePortfolioEntry()">Save Entry</button>
        </div>
      `;
    }
    
    html += `
      <div class="card">
        <div class="card-title">${author === 'simon' ? "📓 Simon's Portfolio" : '📓 My Portfolio'}</div>
        <div style="margin-bottom: 15px; padding: 12px; background: var(--light); border-radius: 6px; font-size: 12px; color: var(--text-light);">
          ${currentUserRole !== 'student' ? `Portfolio entries from Simon for tracking daily progress` : 'Track your daily activities and accomplishments'}
        </div>
        <div id="portfolioEntries">${entries.length ? '' : '<p style="color: var(--text-light);">No portfolio entries yet</p>'}</div>
      </div>
    `;
    
    document.getElementById('portfolioSection').innerHTML = html;
    
    // Render entries
    if (entries.length > 0) {
      document.getElementById('portfolioEntries').innerHTML = entries.map((e, i) => `
        <div class="event-item" style="border-left-color: var(--primary);">
          <div class="event-item-content">
            <div class="event-item-title">${e.title}</div>
            <div class="event-item-meta">📅 ${new Date(e.entry_date).toLocaleDateString()} | Posted ${new Date(e.created_at).toLocaleDateString()}</div>
            <div style="margin-top: 12px; padding: 12px; background: var(--light); border-radius: 6px; line-height: 1.6;">${e.content}</div>
          </div>
          ${currentUserRole === 'student' ? `<button class="btn btn-danger btn-small" onclick="deletePortfolioEntry(${e.id})">Delete</button>` : ''}
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading portfolio:', error);
    document.getElementById('portfolioSection').innerHTML = `<p style="color: red;">Error loading portfolio: ${error.message}</p>`;
  }
}

async function savePortfolioEntry() {
  const title = document.getElementById('portfolioTitle').value.trim();
  const content = document.getElementById('portfolioContent').value.trim();
  const entry_date = document.getElementById('portfolioDate').value;
  
  if (!title || !content || !entry_date) {
    notify('Please fill in all fields', 'error');
    return;
  }
  
  try {
    await api.portfolio.create(title, content, entry_date);
    notify('✅ Portfolio entry saved!');
    document.getElementById('portfolioTitle').value = '';
    document.getElementById('portfolioContent').value = '';
    await loadPortfolio();
  } catch (error) {
    notify(`Error: ${error.message}`, 'error');
  }
}

async function deletePortfolioEntry(id) {
  if (!confirm('Delete this entry?')) return;
  
  try {
    await api.portfolio.delete(id);
    notify('✅ Entry deleted');
    await loadPortfolio();
  } catch (error) {
    notify(`Error: ${error.message}`, 'error');
  }
}
