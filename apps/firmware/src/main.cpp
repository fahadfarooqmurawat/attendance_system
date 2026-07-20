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
    const ScanResult result = scanFingerprint();

    if (result.success)
    {
        Serial.printf("MATCH: template ID %u, confidence %u\n",
                      static_cast<unsigned>(result.scannerTemplateId),
                      static_cast<unsigned>(result.matchConfidence));
    }
    else if (!result.errorMessage.isEmpty())
    {
        Serial.print("SCAN: ");
        Serial.println(result.errorMessage);
    }

    delay(250);
}
