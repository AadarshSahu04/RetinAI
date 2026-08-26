#!/bin/bash
# Start the React frontend
cd "$(dirname "$0")/frontend"
echo "Starting DR Detection Frontend on http://localhost:3000"
npm run dev
