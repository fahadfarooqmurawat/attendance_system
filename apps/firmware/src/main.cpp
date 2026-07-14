#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include "wifi_manager.h"
#include "server_module.h"
#include "scanner_module.h"

#if __has_include("config.h")
#include "config.h"
#else
#include "config.example.h"
#endif

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("Attendance firmware scaffold");
    Serial.print("Device ID: ");
    Serial.println(DEVICE_ID);

    if (connectWifi(WIFI_SSID, WIFI_PASSWORD) == WifiStatus::FAILED)
    {
        Serial.println("Main: Could not connect to WiFi.");

        // Handle startup failure here.
    }

    pingServer(GATEWAY_BASE_URL);
}

void loop()
{
    maintainConnection();

    ScannerMode mode = getMode();

    sendHeartbeat(
        GATEWAY_BASE_URL,
        DEVICE_ID,
        FIRMWARE_VERSION,
        mode);

    delay(10000);
}
