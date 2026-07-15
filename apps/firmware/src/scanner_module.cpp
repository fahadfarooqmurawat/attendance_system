#include "scanner_module.h"

namespace
{
    ScannerMode currentMode = ScannerMode::SCAN;
}

void initializeScanner()
{
    // Future scanner initialization code
}

ScannerMode getMode()
{
    return currentMode;
}