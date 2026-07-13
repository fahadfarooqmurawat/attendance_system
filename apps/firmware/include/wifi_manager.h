#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>

enum class WifiStatus
{
    CONNECTED,
    FAILED
};

WifiStatus connectWifi(const char* ssid, const char* password);

void maintainConnection();

bool isConnected();

IPAddress getLocalIP();

String getMacAddress();

int getSignalStrength();

#endif