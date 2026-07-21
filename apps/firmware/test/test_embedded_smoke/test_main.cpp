#include <Arduino.h>
#include <unity.h>

#include "firmware_logic.h"

void test_embedded_build_uses_shared_firmware_logic()
{
    TEST_ASSERT_EQUAL_STRING("SCAN", scannerModeWireValue(ScannerMode::SCAN));
    TEST_ASSERT_FLOAT_WITHIN(0.0001f, 1.0f, normalizeMatchConfidence(100));
}

void setup()
{
    delay(2000);
    UNITY_BEGIN();
    RUN_TEST(test_embedded_build_uses_shared_firmware_logic);
    UNITY_END();
}

void loop() {}
