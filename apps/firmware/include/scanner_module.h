#ifndef SCANNER_MODULE_H
#define SCANNER_MODULE_H

#include <Arduino.h>

enum class ScannerMode
{
    SCAN,
    ENROLL
};

enum class EnrollmentStatus // chatgpt
{
    IDLE,
    IN_PROGRESS,
    SUCCESS,
    FAILED
};

struct ScanResult
{
    bool success;
    uint16_t scannerTemplateId;
    float matchConfidence;
    String errorMessage;
};

struct EnrollmentResult // chatgpt
{
    EnrollmentStatus status;

    bool success;

    String enrollmentSessionId;

    uint16_t scannerTemplateId;

    String errorMessage;
};

// These are ESP32 pin roles, not scanner pin labels:
// scanner TX -> ESP32 RX (GPIO16)
// scanner RX -> ESP32 TX (GPIO17)
constexpr int ESP_RX_PIN = 16;
constexpr int ESP_TX_PIN = 17;
constexpr uint32_t SCANNER_BAUD_RATE = 57600;

void initializeScanner();

ScannerMode getMode();

// Poll once for a finger and search the templates stored in the sensor.
ScanResult scanFingerprint();

// Check if a scan is currently in progress
bool isScanInProgress();

// Get current scan sequence
uint32_t getScanSequence();

// Reset scan sequence counter
void resetScanSequence();

void setMode(ScannerMode mode); // chatgpt

EnrollmentResult enrollFingerprint(uint16_t templateId); // chatgpt

bool isEnrollmentRunning(); // chatgpt

// Enrollment control, chatgpt
void startEnrollment(
    const String &sessionId,
    uint16_t templateId);

void cancelEnrollment(); // chatgpt

String getEnrollmentSessionId(); // chatgpt

uint16_t getEnrollmentTemplateId(); // chatgpt

#endif
