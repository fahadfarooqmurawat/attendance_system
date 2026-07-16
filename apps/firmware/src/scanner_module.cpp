#include "scanner_module.h"
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>

namespace
{
    ScannerMode currentMode = ScannerMode::SCAN;
    HardwareSerial scannerSerial(2); // UART2 for the fingerprint scanner
    Adafruit_Fingerprint finger(&scannerSerial);
    bool sensorAvailable = false;
    uint32_t scanSequence = 0;
}

void initializeScanner()
{
    // Initialize UART for fingerprint scanner
    scannerSerial.begin(SCANNER_BAUD_RATE, SERIAL_8N1, SCANNER_RX_PIN, SCANNER_TX_PIN);
    Serial.printf("Scanner module initialized on GPIO%u (RX) and GPIO%u (TX)\n", SCANNER_RX_PIN, SCANNER_TX_PIN);

    // Initialize Adafruit fingerprint wrapper
    finger.begin(SCANNER_BAUD_RATE);
    delay(100);
    if (finger.verifyPassword())
    {
        sensorAvailable = true;
        finger.getTemplateCount();
        Serial.print("Sensor ready. Templates: ");
        Serial.println(finger.templateCount);
    }
    else
    {
        sensorAvailable = false;
        Serial.println("Sensor not found or wrong password.");
    }
}

ScannerMode getMode()
{
    return currentMode;
}

ScanResult scanFingerprint()
{
    ScanResult result = {false, 0, 0.0f, ""};

    if (!sensorAvailable)
    {
        result.errorMessage = "Sensor not available";
        return result;
    }

    uint8_t p = finger.getImage();

    if (p != FINGERPRINT_OK)
    {
        if (p == FINGERPRINT_NOFINGER)
        {
            // No finger present
            return result;
        }
        result.errorMessage = "Imaging error";
        return result;
    }

    if (finger.image2Tz(1) != FINGERPRINT_OK)
    {
        result.errorMessage = "Convert failed";
        return result;
    }

    if (finger.fingerSearch() != FINGERPRINT_OK)
    {
        result.success = false;
        result.errorMessage = "No match";
        Serial.println("No match — ACCESS DENIED");
        return result;
    }

    uint16_t id = finger.fingerID;
    uint16_t confidence = finger.confidence;

    result.success = true;
    result.scannerTemplateId = id;
    result.matchConfidence = (float)confidence / 65535.0f;
    scanSequence++;

    Serial.printf("Scan successful - Template ID: %u, Confidence: %.2f, Sequence: %u\n",
                  (unsigned)id, (double)result.matchConfidence, (unsigned)scanSequence);

    return result;
}

uint32_t getScanSequence()
{
    return scanSequence;
}

void resetScanSequence()
{
    scanSequence = 0;
}

bool isScanInProgress()
{
    // With blocking Adafruit calls we don't track an in-progress flag here.
    return false;
}
