#include "wifi_manager.h"


constexpr int MAX_RETRIES = 3;
constexpr unsigned long CONNECTION_TIMEOUT = 10000;
constexpr unsigned long RECONNECT_INTERVAL = 5000;

unsigned long lastReconnectAttempt = 0;

// Store WiFi credentials internally
const char* savedSsid = nullptr;
const char* savedPassword = nullptr;

WifiStatus connectWifi(const char* ssid, const char* password)
{
    // Save credentials for future reconnects
    savedSsid = ssid;
    savedPassword = password;

    for (int attempt = 1; attempt <= MAX_RETRIES; attempt++)
    {
        Serial.printf("Connecting to WiFi (%d/%d)...\n", attempt, MAX_RETRIES);

        WiFi.disconnect(true);
        delay(500);

        WiFi.begin(ssid, password);

        unsigned long start = millis();

        while (WiFi.status() != WL_CONNECTED &&
               millis() - start < CONNECTION_TIMEOUT)
        {
            delay(500);
            Serial.print(".");
        }

        if (WiFi.status() == WL_CONNECTED)
        {
            Serial.println();
            Serial.println("WiFi connected.");
            Serial.print("IP Address: ");
            Serial.println(WiFi.localIP());

            return WifiStatus::CONNECTED;
        }

        Serial.println();
        Serial.println("Connection failed.");
    }

    Serial.println("All connection attempts failed.");

    return WifiStatus::FAILED;
}

void maintainConnection()
{
    if (WiFi.status() == WL_CONNECTED)
        return;

    if (millis() - lastReconnectAttempt < RECONNECT_INTERVAL)
        return;

    lastReconnectAttempt = millis();

    Serial.println("WiFi disconnected. Reconnecting...");

    connectWifi(savedSsid, savedPassword);
}

bool isConnected()
{
    return WiFi.status() == WL_CONNECTED;
}

IPAddress getLocalIP()
{
    return WiFi.localIP();
}

String getMacAddress()
{
    return WiFi.macAddress();
}

int getSignalStrength()
{
    return WiFi.RSSI();
}