#ifndef SERVER_MODULE_H
#define SERVER_MODULE_H

#include <Arduino.h>

//void initializeServer(const char* serverUrl);

void pingServer(const char* serverUrl);

bool isServerConnected();

#endif