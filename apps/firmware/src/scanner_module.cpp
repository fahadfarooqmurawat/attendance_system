#include "scanner_module.h"
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>

namespace
{
    ScannerMode currentMode = ScannerMode::SCAN;
    bool enrollmentRunning = false; // chatgpt
    HardwareSerial scannerSerial(2);
    Adafruit_Fingerprint finger(&scannerSerial);
    bool sensorAvailable = false;
    uint32_t scanSequence = 0;
    String currentEnrollmentSessionId = "";   // chatgpt
    uint16_t currentEnrollmentTemplateId = 0; // chatgpt
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

void setMode(ScannerMode mode) // chatgpt
{
    currentMode = mode;
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
    result.matchConfidence = normalizeMatchConfidence(finger.confidence);
    scanSequence++;
    return result;
}

EnrollmentResult enrollFingerprint(uint16_t templateId) // chatgpt
{
    EnrollmentResult result;

    result.enrollmentSessionId = getEnrollmentSessionId();

    result.status = EnrollmentStatus::FAILED;
    result.success = false;
    result.scannerTemplateId = templateId;

    if (!sensorAvailable)
    {
        result.errorMessage = "Sensor unavailable";
        return result;
    }

    enrollmentRunning = true;

    Serial.println("Enrollment started");

    int p = -1;

    Serial.println("Place finger");

    while (p != FINGERPRINT_OK)
    {
        p = finger.getImage();

        if (p == FINGERPRINT_NOFINGER)
        {
            delay(50);
            continue;
        }

        if (p != FINGERPRINT_OK)
        {
            result.errorMessage = "Failed to capture first image";
            enrollmentRunning = false;
            return result;
        }
    }

    if (finger.image2Tz(1) != FINGERPRINT_OK)
    {
        result.errorMessage = "image2Tz(1) failed";
        enrollmentRunning = false;
        return result;
    }

    Serial.println("Remove finger");

    delay(2000);

    while (finger.getImage() != FINGERPRINT_NOFINGER)
    {
        delay(50);
    }

    Serial.println("Place same finger again");

    p = -1;

    while (p != FINGERPRINT_OK)
    {
        p = finger.getImage();

        if (p == FINGERPRINT_NOFINGER)
        {
            delay(50);
            continue;
        }

        if (p != FINGERPRINT_OK)
        {
            result.errorMessage = "Failed second capture";
            enrollmentRunning = false;
            return result;
        }
    }

    if (finger.image2Tz(2) != FINGERPRINT_OK)
    {
        result.errorMessage = "image2Tz(2) failed";
        enrollmentRunning = false;
        return result;
    }

    if (finger.createModel() != FINGERPRINT_OK)
    {
        result.errorMessage = "createModel failed";
        enrollmentRunning = false;
        return result;
    }

    if (finger.storeModel(templateId) != FINGERPRINT_OK)
    {
        result.errorMessage = "storeModel failed";
        enrollmentRunning = false;
        return result;
    }

    enrollmentRunning = false;

    result.status = EnrollmentStatus::SUCCESS;
    result.success = true;

    Serial.print("Enrollment successful. Template ID: ");
    Serial.println(templateId);

    return result;
}

bool isEnrollmentRunning() // chatgpt
{
    return enrollmentRunning;
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

// chatgpt
void startEnrollment(
    const String &sessionId,
    uint16_t templateId)
{
    currentEnrollmentSessionId = sessionId;
    currentEnrollmentTemplateId = templateId;

    enrollmentRunning = true;

    currentMode = ScannerMode::ENROLL;
}

void cancelEnrollment()
{
    enrollmentRunning = false;

    currentEnrollmentSessionId = "";
    currentEnrollmentTemplateId = 0;

    currentMode = ScannerMode::SCAN;
}

String getEnrollmentSessionId()
{
    return currentEnrollmentSessionId;
}

uint16_t getEnrollmentTemplateId()
{
    return currentEnrollmentTemplateId;
}
