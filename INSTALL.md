# 📦 Installation Guide - MSc Dashboard

## Quick Start (Recommended)

### Windows Users
```bash
setup.bat
npm start
```

### Mac/Linux Users
```bash
bash setup.sh
npm start
```

Then open: **http://localhost:5000**

---

## Manual Installation (If Scripts Fail)

### Step 1: Install Node.js
- Download from https://nodejs.org/ (LTS version recommended)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### Step 2: Navigate to Server Directory
```bash
cd server
```

### Step 3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

**Note:** Using `--legacy-peer-deps` avoids peer dependency conflicts

### Step 4: Create Environment File
```bash
# Copy the example
cp .env.example .env

# Or create manually with:
# PORT=5000
# NODE_ENV=development
# JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### Step 5: Verify Installation
```bash
npm list --depth=0
```

You should see all dependencies listed without errors.

### Step 6: Start the Server
```bash
npm start
```

You should see:
```
✅ Server running on: http://localhost:5000
```

### Step 7: Test in Browser
Open: http://localhost:5000

---

## Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Student | `simon` | `simon2026` |
| Conveyor | `conveyor` | `conveyor2026` |
| Supervisor | `dalvie` | `dalvie2026` |

---

## Troubleshooting

### "npm: command not found"
- Node.js is not installed or not in PATH
- Download from https://nodejs.org/
- After installation, restart your terminal

### "Port 5000 already in use"
- Change PORT in .env file:
  ```
  PORT=5001
  ```
- Restart server

### "Cannot find module"
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install --legacy-peer-deps`

### "Syntax Error in server.js"
- Ensure you have Node.js 14+
- Check that all files were downloaded correctly
- Delete node_modules and reinstall

### "Database error"
- Check that database.db doesn't exist from previous errors
- Let the server create it fresh on first run
- Ensure write permissions in the server directory

### Module not found: better-sqlite3
- This is expected, we use sqlite3 instead
- The error is already fixed in the code
- Run: `npm install --legacy-peer-deps`

---

## Troubleshooting npm Install

### Issue: Peer Dependency Warnings
**Solution:** Use `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Issue: npm ERR! code ERESOLVE
**Solution:** Try with legacy peer deps:
```bash
npm install --legacy-peer-deps
```

### Issue: gyp ERR! build error
**Solution:** This is usually about native modules
- On Windows: May need Visual Studio Build Tools
- On Mac: May need Xcode Command Line Tools
- On Linux: May need build-essential

Try:
```bash
npm install --legacy-peer-deps --no-optional
```

### Issue: EACCES: permission denied
**Solution:** 
- On Mac/Linux: Use sudo or fix npm permissions
- On Windows: Run as Administrator

```bash
# On Mac/Linux, if needed:
sudo npm install --legacy-peer-deps
```

### Issue: Slow Installation
**Solution:** Try different npm registry or clear cache:
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

---

## Clean Installation

If you encounter persistent issues:

```bash
# 1. Remove all node artifacts
rm -rf node_modules package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall
npm install --legacy-peer-deps

# 4. Verify
npm list --depth=0
```

---

## Development Mode

To run with automatic restart on file changes:

```bash
npm run dev
```

(Requires nodemon, installed via `npm install`)

---

## Production Deployment

Before deploying to production:

1. Update .env with production values:
   ```
   NODE_ENV=production
   JWT_SECRET=use_a_strong_random_key_here
   PORT=your_production_port
   ```

2. Remove devDependencies:
   ```bash
   npm install --production
   ```

3. Test thoroughly

4. Deploy using your preferred hosting service

---

## Expected Output After Starting

```
╔════════════════════════════════════════════════════════════════╗
║                  🚀 MSc Dashboard Server                       ║
║                                                                ║
║  ✅ Server running on: http://localhost:5000                  ║
║                                                                ║
║  📍 Open http://localhost:5000 in your browser                ║
║                                                                ║
║  🔐 Test Credentials:                                          ║
║     Username: simon, Role: Student, Password: simon2026        ║
║     Username: conveyor, Role: Conveyor, Password: conveyor2026 ║
║     Username: dalvie, Role: Supervisor, Password: dalvie2026   ║
║                                                                ║
║  💡 For multi-user testing:                                    ║
║     Open 2 browsers or 2 browser windows                       ║
║     Login with different roles                                 ║
║     Events and messages sync automatically!                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Verify Everything Works

1. **Login test:**
   - Try login with each role
   - Should see different interfaces

2. **Messaging test:**
   - Open 2 browsers
   - Login as different users
   - Send messages - should appear in both

3. **Calendar test:**
   - Create an event
   - Refresh page - event should persist
   - Open in another browser - should see same event

4. **Progress test:**
   - Update progress as student
   - Verify it saves
   - Check as supervisor

---

## Getting Help

If you encounter issues:

1. Check this INSTALL.md file
2. Review BUG_FIXES.md for known issues
3. Check GITHUB_PUSH_SUMMARY.md for deployment info
4. Check INDEX.md for documentation overview

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-05
