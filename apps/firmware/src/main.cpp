#include <Arduino.h>
#include "scanner_module.h"

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("Minimal ESP32 fingerprint scanner test");
    initializeScanner();
    Serial.println("Place an enrolled finger on the sensor.");
}

void loop()
{
    const ScanResult result = scanFingerprint();

    if (result.success)
    {
        Serial.printf("MATCH: template ID %u, confidence %u\n",
                      static_cast<unsigned>(result.scannerTemplateId),
                      static_cast<unsigned>(result.matchConfidence));
    }
    else if (!result.errorMessage.isEmpty())
    {
        Serial.print("SCAN: ");
        Serial.println(result.errorMessage);
    }

    delay(250);
}
