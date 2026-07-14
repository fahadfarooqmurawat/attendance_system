#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>

#if __has_include("config.h")
#include "config.h"
#else
#include "config.example.h"
#endif

#define LED_PIN 2

// void connectToWifi() {
//   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
//   Serial.print("Connecting to WiFi");

//   while (WiFi.status() != WL_CONNECTED) {
//     delay(500);
//     Serial.print(".");
//   }

//   Serial.println();
//   Serial.print("Connected as ");
//   Serial.println(WiFi.localIP());
// }

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Setup started");

  Serial.println("attendance firmware scaffold");
  Serial.print("device id: ");
  Serial.println(DEVICE_ID);

  //connectToWifi();
}

void loop() {
  // Placeholder: read scanner mode, match fingerprints, and post scan events.
  Serial.println("LED ON");
  digitalWrite(LED_PIN, HIGH);
  delay(500);

  Serial.println("LED OFF");
  digitalWrite(LED_PIN, LOW);
  delay(500);
  //delay(1000);
}
