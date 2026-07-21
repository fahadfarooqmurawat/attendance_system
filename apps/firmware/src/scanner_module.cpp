#include "scanner_module.h"
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>

namespace
{
    ScannerMode currentMode = ScannerMode::SCAN;
    HardwareSerial scannerSerial(2);
    Adafruit_Fingerprint finger(&scannerSerial);
    bool sensorAvailable = false;
    uint32_t scanSequence = 0;
}

void initializeScanner()
{
    Serial.printf("UART2: RX=GPIO%d, TX=GPIO%d, baud=%lu\n",
                  ESP_RX_PIN,
                  ESP_TX_PIN,
                  static_cast<unsigned long>(SCANNER_BAUD_RATE));
    Serial.println("Wiring: scanner TX -> GPIO16, scanner RX -> GPIO17, and common GND");

    scannerSerial.begin(
        SCANNER_BAUD_RATE,
        SERIAL_8N1,
        ESP_RX_PIN,
        ESP_TX_PIN);
    finger.begin(SCANNER_BAUD_RATE);

    if (!finger.verifyPassword())
    {
        Serial.println("ERROR: no response from sensor (check RX/TX direction, baud, power, and GND)");
        return;
    }

    sensorAvailable = true;
    Serial.println("Sensor connection OK");

    const uint8_t status = finger.getTemplateCount();
    if (status == FINGERPRINT_OK)
    {
        Serial.printf("Stored templates: %u\n", static_cast<unsigned>(finger.templateCount));
    }
    else
    {
        Serial.printf("Could not read template count (code 0x%02X)\n", status);
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

    uint8_t status = finger.getImage();
    if (status == FINGERPRINT_NOFINGER)
    {
        return result;
    }
    if (status != FINGERPRINT_OK)
    {
        result.errorMessage = "getImage failed (code 0x" + String(status, HEX) + ")";
        return result;
    }

    status = finger.image2Tz();
    if (status != FINGERPRINT_OK)
    {
        result.errorMessage = "image2Tz failed (code 0x" + String(status, HEX) + ")";
        return result;
    }

    status = finger.fingerSearch();
    if (status == FINGERPRINT_NOTFOUND)
    {
        result.errorMessage = "finger read successfully, but no enrolled template matched";
        return result;
    }
    if (status != FINGERPRINT_OK)
    {
        result.errorMessage = "fingerSearch failed (code 0x" + String(status, HEX) + ")";
        return result;
    }

    result.success = true;
    result.scannerTemplateId = finger.fingerID;
    // result.matchConfidence = static_cast<float>(finger.confidence);
    result.matchConfidence = normalizeMatchConfidence(finger.confidence);
    scanSequence++;
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
    return false;
}
