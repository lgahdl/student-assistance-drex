#!/bin/bash

echo "🧪 Running Student Assistance Server Integration Tests"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_file="$2"
    
    echo -e "\n${YELLOW}Running: $test_name${NC}"
    echo "----------------------------------------"
    
    if pnpm test "$test_file" --silent; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Run individual test suites
run_test "Health Check" "tests/health.test.ts"
run_test "Authentication Core" "tests/auth-simple.test.ts"
run_test "API Endpoints" "tests/api-endpoints.test.ts"

# Summary
echo -e "\n🏁 Test Summary"
echo "=============="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}💥 Some tests failed!${NC}"
    exit 1
fi
