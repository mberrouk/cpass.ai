#!/bin/bash
#
# Setup Demo Environment for CPASS and TVET Django Project
#
# This script:
# 1. Sets up CPASS backend with demo institutions and workers
# 2. Exports institution data with API keys to JSON
# 3. Sets up TVET Django Project with the same institutions (importing API keys)
# 4. Creates staff users for TVET Django Project
#
# Usage:
#   ./setup_demo.sh
#   ./setup_demo.sh --clean    # Reset databases first
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CPASS_DIR="$SCRIPT_DIR/django-project"
TVET_DIR="$SCRIPT_DIR/tvet_django_project"
SHARED_JSON="$SCRIPT_DIR/.demo_institutions.json"

# Check for --clean flag
CLEAN_DB=false
if [[ "$1" == "--clean" ]]; then
  CLEAN_DB=true
fi

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   CPASS + TVET Django Project Demo Setup${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# ============================================================================
# STEP 1: CPASS Backend Setup
# ============================================================================
echo -e "${YELLOW}Step 1: Setting up CPASS Backend...${NC}"
cd "$CPASS_DIR"

if [ "$CLEAN_DB" = true ]; then
  echo -e "${RED}  Cleaning CPASS database...${NC}"
  rm -f db.sqlite3
fi

echo "  Running migrations..."
python manage.py migrate --run-syncdb 2>/dev/null || python manage.py migrate --settings=config.settings.dev

echo "  Seeding demo institutions with API keys..."
python manage.py seed_demo_institutions --with-workers --output-json "$SHARED_JSON" --settings=config.settings.dev

echo -e "${GREEN} CPASS setup complete${NC}"
echo ""

# ============================================================================
# STEP 2: TVET Django Project Setup
# ============================================================================
echo -e "${YELLOW}Step 2: Setting up TVET Django Project...${NC}"
cd "$TVET_DIR"

if [ "$CLEAN_DB" = true ]; then
  echo -e "${RED}  Cleaning TVET Django Project database...${NC}"
  rm -f db.sqlite3
fi

echo "  Running migrations..."
python manage.py migrate --run-syncdb 2>/dev/null || python manage.py migrate

echo "  Importing institutions from CPASS..."
python manage.py seed_demo_data --from-json "$SHARED_JSON" --with-candidates

echo -e "${GREEN} TVET Django Project setup complete${NC}"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo -e "${YELLOW}Institution data exported to:${NC}"
echo "  $SHARED_JSON"
echo ""
