#!/bin/bash
# Start the FastAPI backend
cd "$(dirname "$0")/backend"
source .venv/bin/activate 2>/dev/null || true
echo "Starting DR Detection API on http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
python main.py
