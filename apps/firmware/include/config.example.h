#ifndef CONFIG_EXAMPLE_H
#define CONFIG_EXAMPLE_H

static constexpr const char *WIFI_SSID = "change-me";
static constexpr const char *WIFI_PASSWORD = "change-me";
static constexpr const char *DEVICE_ID = "esp32-dev-001";
static constexpr const char *DEVICE_SECRET = "change-me";
static constexpr const char *GATEWAY_BASE_URL = "http://192.168.1.100:4001";
static constexpr const char *FIRMWARE_VERSION = "1.0.0";
static constexpr const int SERVER_PING_TIMEOUT = 5000;
static constexpr const int HEARTBEAT_INTERVAL = 30000;

#endif // CONFIG_EXAMPLE_H
