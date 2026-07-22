#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include "wifi_manager.h"
#include "server_module.h"
#include "scanner_module.h"
#include "network_time.h"

#if __has_include("config.h")
#include "config.h"
#else
#include "config.example.h"
#endif

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.printf("Attendance firmware version: %s\n", FIRMWARE_VERSION);
    Serial.printf("Device ID: %s\n", DEVICE_ID);

    initializeScanner();

    if (connectWifi(WIFI_SSID, WIFI_PASSWORD) == WifiStatus::FAILED)
    {
        Serial.println("Main: Could not connect to WiFi.");

        // Handle startup failure here.
        return;
    }

    setupNetworkTime();

    Serial.println("Place an enrolled finger on the sensor.");
}

void loop()
{
    if (timeForHeartbeat())
    {
        sendHeartbeat(GATEWAY_BASE_URL, DEVICE_ID, FIRMWARE_VERSION, getMode());
    }

    ScannerMode mode = getMode();

    if (mode == ScannerMode::SCAN)
    {
        const ScanResult scanResult = scanFingerprint();

        if (scanResult.success)
        {
            Serial.printf("MATCH: template ID %u, confidence %u\n",
                          static_cast<unsigned>(scanResult.scannerTemplateId),
                          static_cast<unsigned>(scanResult.matchConfidence));

            sendScan(
                GATEWAY_BASE_URL,
                DEVICE_ID,
                FIRMWARE_VERSION,
                scanResult);
        }
        else if (!scanResult.errorMessage.isEmpty())
        {
            Serial.print("SCAN: ");
            Serial.println(scanResult.errorMessage);
        }
    }
    else if (mode == ScannerMode::ENROLL)
    {
        EnrollmentResult result =
            enrollFingerprint(
                getEnrollmentTemplateId());

        sendEnrollmentResult(
            GATEWAY_BASE_URL,
            DEVICE_ID,
            FIRMWARE_VERSION,
            result);

        if (result.success)
        {
            Serial.println("Enrollment finished successfully.");
        }
        else
        {
            Serial.println("Enrollment failed.");
        }

        cancelEnrollment();
    }
    delay(250);
}
