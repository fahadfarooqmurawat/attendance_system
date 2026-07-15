#ifndef SERVER_MODULE_H
#define SERVER_MODULE_H

#include <Arduino.h>
#include "scanner_module.h"

//void initializeServer(const char* serverUrl);

void pingServer(const char* serverUrl);

bool isServerConnected();

void sendHeartbeat(
    const char* url,
    const char* deviceId,
    const char* firmwareVersion,
    ScannerMode mode);
    
#endif