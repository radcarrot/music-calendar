#!/bin/bash

# ==============================================================================
# BeatDrop - Shift-Left Testing Execution Script
# runs the complete test suite across Backend (Jest/Supertest) and Frontend (Vitest)
# ==============================================================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting BeatDrop Testing Audit Suite...${NC}\n"

# 1. Backend Tests
echo -e "${YELLOW}--- [1/2] Executing Backend Test Suite (Jest & Supertest) ---${NC}"
cd backend
npm run test
BACKEND_STATUS=$?
cd ..

if [ $BACKEND_STATUS -ne 0 ]; then
  echo -e "\n${RED}✗ Backend tests failed! Aborting frontend tests to fail fast.${NC}"
  exit $BACKEND_STATUS
else
  echo -e "\n${GREEN}✓ Backend tests passed successfully!${NC}\n"
fi

# 2. Frontend Tests
echo -e "${YELLOW}--- [2/2] Executing Frontend Test Suite (Vitest & RTL) ---${NC}"
cd frontend
npm run test -- --run # use --run to execute once instead of watch mode
FRONTEND_STATUS=$?
cd ..

if [ $FRONTEND_STATUS -ne 0 ]; then
  echo -e "\n${RED}✗ Frontend tests failed!${NC}"
  exit $FRONTEND_STATUS
else
  echo -e "\n${GREEN}✓ Frontend tests passed successfully!${NC}\n"
fi

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}All systems nominal. The Shift-Left Testing Audit completed successfully!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
exit 0
