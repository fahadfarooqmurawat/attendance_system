#include "server_module.h"

#include <HTTPClient.h>

#include "wifi_manager.h"

namespace
{
    String serverUrl = "";

    bool serverConnected = false;

    unsigned long lastPingTime = 0;

    constexpr unsigned long PING_INTERVAL = 5000;
}

// void initializeServer(const char* url)
// {
//     serverUrl = url;
// }

bool isServerConnected()
{
    return serverConnected;
}

void pingServer(const char* url)
{
    // Don't try to ping if WiFi isn't connected
    if (!isConnected())
    {
        serverConnected = false;
        return;
    }

    // Ping only once every 5 seconds
    if (millis() - lastPingTime < PING_INTERVAL)
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