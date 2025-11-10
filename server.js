// Minimal static file server with plain-text user storage (no external packages)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const USERS_FILE = path.join(__dirname, 'users.txt');
const SESSION_TTL_MS = 1000 * 60 * 60; // 1 hour
const sessions = new Map(); // sid -> { username, expires }

function sendJSON(res, status, obj, headers = {}) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers });
  res.end(payload);
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname);
  // prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404); res.end('Not found'); return;
    }
    if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(500); res.end('Server error'); return; }
      const ext = path.extname(filePath).toLowerCase();
      const map = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml'
      };
      const ct = map[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct });
      res.end(data);
    });
  });
}

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const content = fs.readFileSync(USERS_FILE, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').map(line => {
      try { return JSON.parse(line); } catch (e) { return null; }
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function appendUser(user) {
  try {
    const line = JSON.stringify(user) + '\n';
    fs.appendFileSync(USERS_FILE, line, 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function cleanupUsersFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) return;
    const lines = fs.readFileSync(USERS_FILE, 'utf8').split('\n').filter(l => l.trim().length > 0);
    const valid = [];
    for (const line of lines) {
      try { const obj = JSON.parse(line); if (obj && obj.username) valid.push(JSON.stringify(obj)); } catch (_) {}
    }
    fs.writeFileSync(USERS_FILE, valid.join('\n') + (valid.length ? '\n' : ''), 'utf8');
  } catch (_) { /* ignore */ }
}

function parseCookies(req) {
  const header = req.headers['cookie'];
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      acc[k] = v;
    }
    return acc;
  }, {});
}

function createSession(username) {
  const sid = crypto.randomBytes(16).toString('hex');
  sessions.set(sid, { username, expires: Date.now() + SESSION_TTL_MS });
  return sid;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const sid = cookies['sid'];
  if (!sid) return null;
  const s = sessions.get(sid);
  if (!s) return null;
  if (s.expires < Date.now()) { sessions.delete(sid); return null; }
  return s;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);
  // basic request logging for debugging 404s
  console.log(new Date().toISOString(), req.method, pathname);

  if (req.method === 'GET') {
    // protect mainmenu.html behind a simple session
    if (pathname === '/mainmenu.html') {
      const s = getSession(req);
      if (!s) { res.writeHead(302, { Location: '/Login.html' }); res.end(); return; }
    }
    // serve static files; root -> index.html
    const p = pathname === '/' ? '/index.html' : pathname;
    serveStatic(req, res, p);
    return;
  }

  if (req.method === 'POST' && pathname === '/register') {
    // collect body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      // debug log
      console.log('POST /register content-type:', req.headers['content-type']);
      console.log('POST /register raw body:', body);
      let data = null;
      // try JSON
      try { data = JSON.parse(body); } catch (e) {
        // try URL-encoded form (key=value&...)
        try {
          const params = new URLSearchParams(body);
          data = {};
          for (const [k, v] of params) data[k] = v;
        } catch (e2) {
          return sendJSON(res, 400, { success: false, message: 'Invalid JSON' });
        }
      }
      const username = (data.username || '').trim();
      const password = (data.password || '').toString();
      const email = (data.email || '').trim();
      const address = (data.address || '').trim();
      const phone = (data.phone || '').trim();

      if (!username || !password || !email) return sendJSON(res, 400, { success: false, message: 'Missing fields' });

      const users = readUsers();
      if (users.find(u => u.username === username)) return sendJSON(res, 409, { success: false, message: 'Username already exists' });
      if (users.find(u => u.email === email)) return sendJSON(res, 409, { success: false, message: 'Email already exists' });

      const user = { username, password, email, address, phone, created_at: new Date().toISOString() };
      const ok = appendUser(user);
      if (!ok) return sendJSON(res, 500, { success: false, message: 'Failed to save user' });
      return sendJSON(res, 200, { success: true });
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/login') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      // debug log
      console.log('POST /login content-type:', req.headers['content-type']);
      console.log('POST /login raw body:', body);
      let data = null;
      try { data = JSON.parse(body); } catch (e) {
        // fallback to URL-encoded form
        try {
          const params = new URLSearchParams(body);
          data = {};
          for (const [k, v] of params) data[k] = v;
        } catch (e2) {
          return sendJSON(res, 400, { success: false, message: 'Invalid JSON' });
        }
      }
      const username = (data.username || '').trim();
      const password = (data.password || '').toString();
      if (!username || !password) return sendJSON(res, 400, { success: false, message: 'Missing fields' });
      const users = readUsers();
      const found = users.find(u => u.username === username && u.password === password);
      if (!found) return sendJSON(res, 401, { success: false, message: 'Invalid credentials' });
      const sid = createSession(username);
      // Set-Cookie: sid=...; HttpOnly; Path=/; SameSite=Lax
      const cookie = `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`;
      return sendJSON(res, 200, { success: true }, { 'Set-Cookie': cookie });
    });
    return;
  }

  // default 404
  res.writeHead(404); res.end('Not found');
});

cleanupUsersFile();
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
