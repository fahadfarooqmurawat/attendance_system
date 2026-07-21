#ifndef FIRMWARE_LOGIC_H
#define FIRMWARE_LOGIC_H

#include <cstdint>

enum class ScannerMode
{
    SCAN,
    ENROLL
};

constexpr float normalizeMatchConfidence(uint16_t confidence)
{
    return confidence >= 100 ? 1.0f : static_cast<float>(confidence) / 100.0f;
}

constexpr const char *scannerModeWireValue(ScannerMode mode)
{
    return mode == ScannerMode::SCAN ? "SCAN" : "ENROLL";
}

constexpr bool hasIntervalElapsed(uint32_t now, uint32_t previous, uint32_t interval)
{
    return static_cast<uint32_t>(now - previous) >= interval;
}

constexpr bool isSuccessfulHttpStatus(int statusCode)
{
    return statusCode >= 200 && statusCode < 300;
}

constexpr bool isAcceptedScanStatus(int statusCode)
{
    return statusCode == 201 || statusCode == 202;
}

#endif
