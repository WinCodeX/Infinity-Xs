#!/bin/bash

###############################################################################
# INFINITY BACKEND - TEST SCRIPT
# 
# This script tests your backend API endpoints
# Run this AFTER starting your server with: pnpm dev
###############################################################################

echo "🧪 Testing Infinity Backend API..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000/api"

###############################################################################
# Test 1: Health Check
###############################################################################
echo -e "${BLUE}Test 1: Health Check${NC}"
echo "GET $BASE_URL/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$RESPONSE_BODY" | jq '.'
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo "-------------------------------------------"
echo ""

###############################################################################
# Test 2: User Registration
###############################################################################
echo -e "${BLUE}Test 2: User Registration${NC}"
echo "POST $BASE_URL/auth/register"
echo ""

REGISTER_DATA='{
  "email": "test@infinity.com",
  "password": "Test123456",
  "name": "Test User"
}'

REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" \
  "$BASE_URL/auth/register")

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    echo "$RESPONSE_BODY" | jq '.'
    
    # Extract token for subsequent requests
    TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.data.token')
    echo ""
    echo "📝 Token saved for authenticated requests"
elif [ "$HTTP_STATUS" = "400" ]; then
    echo -e "${RED}⚠ User might already exist (this is okay if running tests multiple times)${NC}"
    echo "$RESPONSE_BODY" | jq '.'
else
    echo -e "${RED}✗ Registration failed${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo "-------------------------------------------"
echo ""

###############################################################################
# Test 3: User Login
###############################################################################
echo -e "${BLUE}Test 3: User Login${NC}"
echo "POST $BASE_URL/auth/login"
echo ""

LOGIN_DATA='{
  "email": "test@infinity.com",
  "password": "Test123456"
}'

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" \
  "$BASE_URL/auth/login")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "$RESPONSE_BODY" | jq '.'
    
    # Update token from login
    TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.data.token')
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo "-------------------------------------------"
echo ""

###############################################################################
# Test 4: Get User Profile (Protected Route)
###############################################################################
echo -e "${BLUE}Test 4: Get User Profile (Protected)${NC}"
echo "GET $BASE_URL/auth/me"
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ No token available. Skipping authenticated tests.${NC}"
else
    PROFILE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -H "Authorization: Bearer $TOKEN" \
      "$BASE_URL/auth/me")

    HTTP_STATUS=$(echo "$PROFILE_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    RESPONSE_BODY=$(echo "$PROFILE_RESPONSE" | sed '$d')

    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Profile retrieved successfully${NC}"
        echo "$RESPONSE_BODY" | jq '.'
    else
        echo -e "${RED}✗ Failed to get profile${NC}"
        echo "$RESPONSE_BODY"
    fi
fi

echo ""
echo "-------------------------------------------"
echo ""

###############################################################################
# Test 5: Unauthorized Access (No Token)
###############################################################################
echo -e "${BLUE}Test 5: Unauthorized Access (Should Fail)${NC}"
echo "GET $BASE_URL/auth/me (without token)"
echo ""

UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "$BASE_URL/auth/me")

HTTP_STATUS=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$UNAUTH_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Correctly rejected unauthorized request${NC}"
    echo "$RESPONSE_BODY" | jq '.'
else
    echo -e "${RED}✗ Should have returned 401${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo "-------------------------------------------"
echo ""

###############################################################################
# SUMMARY
###############################################################################
echo -e "${BLUE}📊 Test Summary${NC}"
echo ""
echo "All basic authentication tests completed!"
echo ""
echo "Next steps:"
echo "1. Check the terminal where server is running for any errors"
echo "2. Test with Postman or similar tool for more detailed testing"
echo "3. Continue building product, cart, and order endpoints"
echo ""

###############################################################################
# NOTE: This script requires:
# - curl (for making HTTP requests)
# - jq (for formatting JSON output)
# 
# Install jq on Mac: brew install jq
# Install jq on Ubuntu: sudo apt-get install jq
###############################################################################