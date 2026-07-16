#ifndef SCANNER_MODULE_H
#define SCANNER_MODULE_H

#include <Arduino.h>

enum class ScannerMode
{
    SCAN,
    ENROLL
};

struct ScanResult
{
    bool success;
    uint16_t scannerTemplateId;
    float matchConfidence;
    String errorMessage;
};

// GPIO pins for fingerprint scanner UART
#define SCANNER_RX_PIN 17
#define SCANNER_TX_PIN 16
#define SCANNER_BAUD_RATE 57600

void initializeScanner();

ScannerMode getMode();

// Non-blocking scan function - call repeatedly in main loop
ScanResult scanFingerprint();

// Check if a scan is currently in progress
bool isScanInProgress();

// Get current scan sequence
uint32_t getScanSequence();

// Reset scan sequence counter
void resetScanSequence();

#endif