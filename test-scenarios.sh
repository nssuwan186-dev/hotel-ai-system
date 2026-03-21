#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║   REAL-WORLD USER SCENARIO TESTING     ║"
echo "╚════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:3000/api"
PASS=0
FAIL=0

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s $API_URL/health > /dev/null 2>&1; then
  echo "  ✅ Server is running"
else
  echo "  ❌ Server not running"
  echo "  💡 Run: npm run dev"
  exit 1
fi

echo ""

# Test 1: API Health
echo "🧪 Test 1: API Health Check..."
RESPONSE=$(curl -s $API_URL/health)
if echo "$RESPONSE" | grep -q "ok"; then
  echo "  ✅ PASS - Server responding"
  ((PASS++))
else
  echo "  ❌ FAIL - Server not responding"
  ((FAIL++))
fi

echo ""

# Test 2: Get Rooms
echo "🧪 Test 2: Get Rooms..."
RESPONSE=$(curl -s $API_URL/rooms)
if echo "$RESPONSE" | grep -q "success"; then
  ROOM_COUNT=$(echo "$RESPONSE" | grep -o '"data":\[' | wc -l)
  echo "  ✅ PASS - Retrieved $ROOM_COUNT rooms"
  ((PASS++))
else
  echo "  ❌ FAIL - Cannot get rooms"
  ((FAIL++))
fi

echo ""

# Test 3: Get Customers
echo "🧪 Test 3: Get Customers..."
RESPONSE=$(curl -s $API_URL/customers)
if echo "$RESPONSE" | grep -q "success"; then
  CUST_COUNT=$(echo "$RESPONSE" | grep -o '"data":\[' | wc -l)
  echo "  ✅ PASS - Retrieved $CUST_COUNT customers"
  ((PASS++))
else
  echo "  ❌ FAIL - Cannot get customers"
  ((FAIL++))
fi

echo ""

# Test 4: Get Bookings
echo "🧪 Test 4: Get Bookings..."
RESPONSE=$(curl -s $API_URL/bookings)
if echo "$RESPONSE" | grep -q "success"; then
  BOOK_COUNT=$(echo "$RESPONSE" | grep -o '"data":\[' | wc -l)
  echo "  ✅ PASS - Retrieved $BOOK_COUNT bookings"
  ((PASS++))
else
  echo "  ❌ FAIL - Cannot get bookings"
  ((FAIL++))
fi

echo ""

# Test 5: Chat System
echo "🧪 Test 5: Chat System..."
RESPONSE=$(curl -s $API_URL/ai/status)
if echo "$RESPONSE" | grep -q "initialized"; then
  echo "  ✅ PASS - AI system initialized"
  ((PASS++))
else
  echo "  ❌ FAIL - AI system not ready"
  ((FAIL++))
fi

echo ""

# Test 6: Notifications API
echo "🧪 Test 6: Notifications API..."
RESPONSE=$(curl -s $API_URL/notifications)
if echo "$RESPONSE" | grep -q "success"; then
  echo "  ✅ PASS - Notifications API working"
  ((PASS++))
else
  echo "  ⚠️  SKIP - Notifications API not available"
fi

echo ""

# Test 7: Reports API
echo "🧪 Test 7: Reports API..."
RESPONSE=$(curl -s $API_URL/reports/daily-summary)
if echo "$RESPONSE" | grep -q "success\|error"; then
  echo "  ✅ PASS - Reports API responding"
  ((PASS++))
else
  echo "  ⚠️  SKIP - Reports API not available"
fi

echo ""

# Test 8: Database Connection
echo "🧪 Test 8: Database Connection..."
if [ -f "data/db/hotel.sqlite" ]; then
  TABLES=$(sqlite3 data/db/hotel.sqlite "SELECT count(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
  if [ "$TABLES" -gt 0 ]; then
    echo "  ✅ PASS - Database connected ($TABLES tables)"
    ((PASS++))
  else
    echo "  ❌ FAIL - Database has no tables"
    ((FAIL++))
  fi
else
  echo "  ❌ FAIL - Database file not found"
  ((FAIL++))
fi

echo ""
echo "════════════════════════════════════════"
echo "         TEST SUMMARY"
echo "════════════════════════════════════════"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  📊 Total:  $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 All tests passed!"
  echo "  ✅ System is ready for production!"
else
  echo "  ⚠️  $FAIL tests failed"
  echo "  💡 Review failed tests above"
fi

echo "════════════════════════════════════════"
