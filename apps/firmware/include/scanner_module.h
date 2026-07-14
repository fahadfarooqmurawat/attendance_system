#ifndef SCANNER_MODULE_H
#define SCANNER_MODULE_H

#include <Arduino.h>

enum class ScannerMode
{
    SCAN,
    ENROLL
};

void initializeScanner();

ScannerMode getMode();

#endif