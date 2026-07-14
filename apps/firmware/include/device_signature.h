#pragma once

#include <Arduino.h>

String createDeviceSignature(const char *method, const char *path, const String &body, const char *deviceSecret, String &outTimestamp);
