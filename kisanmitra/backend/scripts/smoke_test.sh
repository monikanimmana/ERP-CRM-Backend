#!/usr/bin/env bash
# SayDone Smoke Test
# ------------------
# Posts all 8 required utterances and the empty/garbage cases.
# Run from the project root after starting the server:
#   python manage.py runserver
#   bash scripts/smoke_test.sh

BASE="${API_BASE:-http://localhost:8000}"
NOW="$(date -Iseconds 2>/dev/null || python3 -c 'from datetime import datetime; print(datetime.now().astimezone().isoformat())')"
TZ="Asia/Kolkata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

pass=0; fail=0

check() {
  local label="$1"
  local expected_code="$2"
  local payload="$3"
  local response
  local http_code

  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/voice/process" \
    -H "Content-Type: application/json" \
    -d "$payload")
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" == "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} [$http_code] $label"
    ((pass++))
  else
    echo -e "${RED}✗ FAIL${NC} [$http_code != $expected_code] $label"
    echo "  Body: $(echo "$body" | head -c 200)"
    ((fail++))
  fi
}

echo ""
echo "═══════════════════════════════════════════════════"
echo " SayDone Smoke Tests  →  $BASE"
echo "═══════════════════════════════════════════════════"
echo ""

# Health check first
echo "── Health ──"
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
if [ "$http_code" == "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} [200] GET /api/health"
  ((pass++))
else
  echo -e "${RED}✗ FAIL${NC} [$http_code] GET /api/health — server may not be running"
  ((fail++))
fi

echo ""
echo "── Voice Pipeline (8 required scenarios) ──"

check "Scenario 1 — expense + reminder (en)" "200" \
  "{\"transcript\":\"Spent 250 rupees on lunch and remind me to submit the form on Friday\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 2 — two expenses" "200" \
  "{\"transcript\":\"Add 120 for auto rickshaw and 80 for chai\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 3 — spending query" "200" \
  "{\"transcript\":\"How much have I spent this week?\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 4 — reminder tomorrow 6 PM" "200" \
  "{\"transcript\":\"Remind me to call mom tomorrow at 6 PM\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 5 — email summary" "200" \
  "{\"transcript\":\"Email me today's summary\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 6 — Hindi expense" "200" \
  "{\"transcript\":\"Aaj canteen mein 90 rupaye kharch hue\",\"lang\":\"hi-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 7 — NOT_UNDERSTOOD (422)" "422" \
  "{\"transcript\":\"blah blah blah\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

check "Scenario 8 — EMPTY_TRANSCRIPT (422)" "422" \
  "{\"transcript\":\"\",\"lang\":\"en-IN\",\"client_time\":\"$NOW\",\"timezone\":\"$TZ\"}"

echo ""
echo "── Dashboard & CRUD ──"

http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/dashboard")
[ "$http_code" == "200" ] && { echo -e "${GREEN}✓ PASS${NC} [200] GET /api/dashboard"; ((pass++)); } \
  || { echo -e "${RED}✗ FAIL${NC} [$http_code] GET /api/dashboard"; ((fail++)); }

http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/expenses?limit=5")
[ "$http_code" == "200" ] && { echo -e "${GREEN}✓ PASS${NC} [200] GET /api/expenses"; ((pass++)); } \
  || { echo -e "${RED}✗ FAIL${NC} [$http_code] GET /api/expenses"; ((fail++)); }

http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/tasks?status=open")
[ "$http_code" == "200" ] && { echo -e "${GREEN}✓ PASS${NC} [200] GET /api/tasks"; ((pass++)); } \
  || { echo -e "${RED}✗ FAIL${NC} [$http_code] GET /api/tasks"; ((fail++)); }

http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/demo/reset")
[ "$http_code" == "200" ] && { echo -e "${GREEN}✓ PASS${NC} [200] POST /api/demo/reset"; ((pass++)); } \
  || { echo -e "${RED}✗ FAIL${NC} [$http_code] POST /api/demo/reset"; ((fail++)); }

echo ""
echo "═══════════════════════════════════════════════════"
if [ $fail -eq 0 ]; then
  echo -e " ${GREEN}ALL $pass TESTS PASSED${NC}"
else
  echo -e " ${GREEN}$pass passed${NC}  ${RED}$fail failed${NC}"
fi
echo "═══════════════════════════════════════════════════"
echo ""

exit $fail
