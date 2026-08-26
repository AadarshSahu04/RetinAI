#!/bin/bash
# =============================================================================
# DR Detection System — Setup & Run Script (macOS Apple Silicon / M2)
# =============================================================================
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()    { echo -e "${CYAN}[DR]${NC} $1"; }
success(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Diabetic Retinopathy Detection System      ║${NC}"
echo -e "${BOLD}║   Setup for macOS Apple Silicon (M2)         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────────
log "Checking prerequisites..."

command -v python3 >/dev/null 2>&1 || error "Python 3 not found. Install from https://www.python.org"
command -v node >/dev/null 2>&1    || error "Node.js not found. Install from https://nodejs.org"
command -v psql >/dev/null 2>&1    || { warn "psql not found. Install PostgreSQL: brew install postgresql@16"; }
command -v brew >/dev/null 2>&1    || warn "Homebrew not found — some steps may need manual intervention."

success "Prerequisites OK"

# ── PostgreSQL ───────────────────────────────────────────────────────────────
log "Setting up PostgreSQL..."

# Start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  warn "PostgreSQL not running. Starting..."
  brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || warn "Could not start PostgreSQL automatically. Please start it manually."
  sleep 2
fi

# Create DB and user (ignore errors if already exist)
psql -U postgres -f setup_db.sql 2>/dev/null || psql -c "\i setup_db.sql" 2>/dev/null || warn "DB setup skipped (may already exist)."
success "PostgreSQL ready"

# ── Backend ──────────────────────────────────────────────────────────────────
log "Setting up backend..."

cd backend

# Create virtual environment
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

# On M2: TensorFlow requires tensorflow-macos
log "Installing Python dependencies (M2 optimized)..."
pip install --upgrade pip --quiet

# Check if running on Apple Silicon
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  log "Apple Silicon detected — installing tensorflow-macos..."
  pip install tensorflow-macos tensorflow-metal --quiet 2>/dev/null || {
    warn "tensorflow-macos install failed. Falling back to standard tensorflow..."
    pip install tensorflow --quiet
  }
else
  pip install tensorflow --quiet
fi

# Install remaining deps (excluding tensorflow from requirements.txt)
grep -v "tensorflow" requirements.txt | pip install -r /dev/stdin --quiet
success "Backend dependencies installed"

# Create .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env 2>/dev/null || true
fi

# Create upload and report dirs
mkdir -p uploads reports
success "Backend ready"
cd ..

# ── Frontend ─────────────────────────────────────────────────────────────────
log "Setting up frontend..."
cd frontend
npm install --silent
success "Frontend dependencies installed"
cd ..

echo ""
success "Setup complete!"
echo ""
echo -e "${BOLD}To start the application:${NC}"
echo ""
echo -e "  ${CYAN}Terminal 1 — Backend:${NC}"
echo -e "    cd backend && source .venv/bin/activate && python main.py"
echo ""
echo -e "  ${CYAN}Terminal 2 — Frontend:${NC}"
echo -e "    cd frontend && npm run dev"
echo ""
echo -e "  ${CYAN}URLs:${NC}"
echo -e "    Frontend : http://localhost:3000"
echo -e "    API docs : http://localhost:8000/docs"
echo ""
