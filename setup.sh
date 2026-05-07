#!/bin/bash
# MSc Dashboard Setup Script
# Robust installation with error handling

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════"
echo "  🚀 MSc Dashboard - Installation Script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handler
handle_error() {
  echo -e "${RED}❌ Error: $1${NC}"
  exit 1
}

# Success message
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Info message
info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Warning message
warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check Node.js
echo ""
echo "Step 1: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
  handle_error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
fi
NODE_VERSION=$(node --version)
success "Node.js found: $NODE_VERSION"

# Step 2: Check npm
echo ""
echo "Step 2: Checking npm installation..."
if ! command -v npm &> /dev/null; then
  handle_error "npm is not installed"
fi
NPM_VERSION=$(npm --version)
success "npm found: $NPM_VERSION"

# Step 3: Navigate to server directory
echo ""
echo "Step 3: Navigating to server directory..."
cd "$(dirname "${BASH_SOURCE[0]}")/server" || handle_error "Could not navigate to server directory"
success "In server directory: $(pwd)"

# Step 4: Check if node_modules exists
echo ""
echo "Step 4: Checking existing installation..."
if [ -d "node_modules" ]; then
  warn "node_modules directory already exists"
  read -p "Do you want to reinstall? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "Removing existing node_modules..."
    rm -rf node_modules package-lock.json
    success "Removed old installation"
  else
    success "Keeping existing installation"
  fi
fi

# Step 5: Install dependencies
echo ""
echo "Step 5: Installing dependencies..."
info "This may take a few minutes..."
if npm install --legacy-peer-deps 2>&1 | tee npm-install.log; then
  success "Dependencies installed successfully"
else
  handle_error "npm install failed. Check npm-install.log for details"
fi

# Step 6: Verify installation
echo ""
echo "Step 6: Verifying installation..."
if npm list --depth=0 &> /dev/null; then
  success "Installation verified"
  npm list --depth=0
else
  warn "Could not verify all dependencies, but installation may still work"
fi

# Step 7: Check environment
echo ""
echo "Step 7: Checking environment setup..."
if [ -f ".env" ]; then
  success ".env file exists"
else
  if [ -f ".env.example" ]; then
    info "Creating .env from .env.example..."
    cp .env.example .env
    success ".env created"
  else
    warn "No .env file found. Please create one with PORT=5000"
  fi
fi

# Step 8: Test syntax
echo ""
echo "Step 8: Validating JavaScript syntax..."
for file in server.js db.js routes/*.js; do
  if [ -f "$file" ]; then
    if node -c "$file" 2>&1 | grep -q "SyntaxError"; then
      handle_error "Syntax error in $file"
    fi
  fi
done
success "All JavaScript files have valid syntax"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✨ Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Next steps:"
echo "  1. Start the server:"
echo "     npm start"
echo ""
echo "  2. Open in browser:"
echo "     http://localhost:5000"
echo ""
echo "  3. Test credentials:"
echo "     Student: simon / simon2026"
echo "     Conveyor: dalvie / dalvie2026"
echo "     Supervisor: martin / martin2026"
echo ""
echo "═══════════════════════════════════════════════════════════"
