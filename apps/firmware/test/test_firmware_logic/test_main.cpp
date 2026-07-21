#include <cstdint>
#include <limits>
#include <unity.h>

#include "firmware_logic.h"

void test_normalizes_fingerprint_confidence()
{
    TEST_ASSERT_FLOAT_WITHIN(0.0001f, 0.0f, normalizeMatchConfidence(0));
    TEST_ASSERT_FLOAT_WITHIN(0.0001f, 0.01f, normalizeMatchConfidence(1));
    TEST_ASSERT_FLOAT_WITHIN(0.0001f, 0.99f, normalizeMatchConfidence(99));
    TEST_ASSERT_FLOAT_WITHIN(0.0001f, 1.0f, normalizeMatchConfidence(100));
    TEST_ASSERT_FLOAT_WITHIN(0.0001f, 1.0f, normalizeMatchConfidence(500));
}

void test_serializes_scanner_modes_for_the_gateway_protocol()
{
    TEST_ASSERT_EQUAL_STRING("SCAN", scannerModeWireValue(ScannerMode::SCAN));
    TEST_ASSERT_EQUAL_STRING("ENROLL", scannerModeWireValue(ScannerMode::ENROLL));
}

void test_detects_elapsed_intervals_at_the_boundary()
{
    TEST_ASSERT_FALSE(hasIntervalElapsed(1099, 1000, 100));
    TEST_ASSERT_TRUE(hasIntervalElapsed(1100, 1000, 100));
    TEST_ASSERT_TRUE(hasIntervalElapsed(1101, 1000, 100));
}

void test_elapsed_intervals_survive_millis_rollover()
{
    const uint32_t beforeRollover = std::numeric_limits<uint32_t>::max() - 2;

    TEST_ASSERT_FALSE(hasIntervalElapsed(1, beforeRollover, 5));
    TEST_ASSERT_TRUE(hasIntervalElapsed(2, beforeRollover, 5));
}

void test_classifies_successful_http_statuses()
{
    TEST_ASSERT_FALSE(isSuccessfulHttpStatus(199));
    TEST_ASSERT_TRUE(isSuccessfulHttpStatus(200));
    TEST_ASSERT_TRUE(isSuccessfulHttpStatus(299));
    TEST_ASSERT_FALSE(isSuccessfulHttpStatus(300));
}

void test_accepts_only_gateway_scan_creation_statuses()
{
    TEST_ASSERT_FALSE(isAcceptedScanStatus(200));
    TEST_ASSERT_TRUE(isAcceptedScanStatus(201));
    TEST_ASSERT_TRUE(isAcceptedScanStatus(202));
    TEST_ASSERT_FALSE(isAcceptedScanStatus(204));
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_normalizes_fingerprint_confidence);
    RUN_TEST(test_serializes_scanner_modes_for_the_gateway_protocol);
    RUN_TEST(test_detects_elapsed_intervals_at_the_boundary);
    RUN_TEST(test_elapsed_intervals_survive_millis_rollover);
    RUN_TEST(test_classifies_successful_http_statuses);
    RUN_TEST(test_accepts_only_gateway_scan_creation_statuses);
    return UNITY_END();
}
