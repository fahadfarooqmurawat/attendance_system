#include "server_module.h"

#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "wifi_manager.h"
#include "scanner_module.h"
#include "device_signature.h"
#include "firmware_logic.h"
#include "network_time.h"
#if __has_include("config.h")
#include "config.h"
#else
#include "config.example.h"
#endif
// ArduinoJson for JSON serialization

namespace
{
    String serverUrl = "";

    bool serverConnected = false;

    unsigned long lastPingTime = 0;
    unsigned long lastHeartbeatTime = 0;

    // constexpr unsigned long PING_INTERVAL = 5000;
    // constexpr unsigned long HEARTBEAT_INTERVAL = 5000;
}

// void initializeServer(const char* url)
// {
//     serverUrl = url;
// }

bool isServerConnected()
{
    return serverConnected;
}

void pingServer(const char *url)
{
    // Don't try to ping if WiFi isn't connected
    if (!isConnected())
    {
        serverConnected = false;
        return;
    }

    // Ping only once every 5 seconds
    if (!hasIntervalElapsed(millis(), lastPingTime, SERVER_PING_TIMEOUT))
    {
        return;
    }

    lastPingTime = millis();

    HTTPClient http;

    String endpoint = String(url) + "/ping";

    http.begin(endpoint);

    int statusCode = http.GET();

    if (statusCode == 200)
    {
        String response = http.getString();

        if (response == "pong")
        {
            serverConnected = true;
            Serial.println("Ping Pong");
        }
        else
        {
            serverConnected = false;
            Serial.println("Unexpected server response.");
        }
    }
    else
    {
        serverConnected = false;
        Serial.println("Could not reach server.");
    }

    http.end();
}

bool timeForHeartbeat()
{
    return hasIntervalElapsed(millis(), lastHeartbeatTime, HEARTBEAT_INTERVAL);
}

void sendHeartbeat(
    const char *url,
    const char *deviceId,
    const char *firmwareVersion,
    ScannerMode mode)
{
    if (!isConnected())
    {
        return;
    }

    lastHeartbeatTime = millis();

    HTTPClient http;

    String endpoint = String(url) + "/device/heartbeat";

    http.begin(endpoint);

    http.addHeader("Content-Type", "application/json");

    // Use a dynamic JSON document with a small capacity
    DynamicJsonDocument doc(256);

    doc["deviceId"] = deviceId;
    doc["firmwareVersion"] = firmwareVersion;
    doc["reportedMode"] = scannerModeWireValue(mode);

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("Sending heartbeat: " + requestBody);

    // Build signature headers using the device secret and current timestamp
    String timestamp = getTimestamp();
    String signature = createDeviceSignature("POST", "/device/heartbeat", requestBody, DEVICE_SECRET, timestamp);

    http.addHeader("x-device-id", deviceId);
    http.addHeader("x-device-timestamp", timestamp);
    http.addHeader("x-device-signature", signature);

    int statusCode = http.POST(requestBody);

    if (isSuccessfulHttpStatus(statusCode))
    {
        Serial.print("Heartbeat sent. Status: ");
        Serial.println(statusCode);
    }
    else
    {
        Serial.print("Heartbeat failed. Status: ");
        Serial.println(statusCode);
        String response = http.getString();
        if (response.length() > 0)
        {
            Serial.print("Response: ");
            Serial.println(response);
        }
    }

    http.end();
}

void sendScan(
    const char *url,
    const char *deviceId,
    const char *firmwareVersion,
    const ScanResult &scanResult)
{
    if (!isConnected())
    {
        Serial.println("WiFi not connected. Cannot send scan.");
        return;
    }

    Serial.println("Sending scan result to server...");
    Serial.printf("Template ID: %u, Confidence: %f\n",
                  static_cast<unsigned>(scanResult.scannerTemplateId),
                  scanResult.matchConfidence);

    HTTPClient http;

    String endpoint = String(url) + "/device/scans";

    http.begin(endpoint);

    http.addHeader("Content-Type", "application/json");

    // Create JSON payload matching deviceScanSchema
    DynamicJsonDocument doc(512);

    doc["deviceId"] = deviceId;
    doc["scannerTemplateId"] = scanResult.scannerTemplateId;
    doc["deviceScanSequence"] = getScanSequence();
    doc["firmwareVersion"] = firmwareVersion;
    doc["matchConfidence"] = (double)scanResult.matchConfidence; // Ensure it's 0-1 range

    String requestBody;
    serializeJson(doc, requestBody);

    // Build signature headers using the device secret and current timestamp
    String timestamp = getTimestamp();
    String signature = createDeviceSignature("POST", "/device/scans", requestBody, DEVICE_SECRET, timestamp);

    http.addHeader("x-device-id", deviceId);
    http.addHeader("x-device-timestamp", timestamp);
    http.addHeader("x-device-signature", signature);

    int statusCode = http.POST(requestBody);

    if (isAcceptedScanStatus(statusCode))
    {
        Serial.println("Scan sent to the server successfully.");
        Serial.print("Response code: ");
        Serial.println(statusCode);
    }
    else
    {
        Serial.print("Failed to send scan to server. Status: ");
        Serial.println(statusCode);
        String response = http.getString();
        Serial.println("Response: " + response);
    }

    http.end();
}
