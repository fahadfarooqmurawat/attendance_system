#include "network_time.h"

void setupNetworkTime()
{
  configTime(0, 0, "pool.ntp.org", "time.cloudflare.com");
}

String getTimestamp()
{
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 10000))
  {
    return "0";
  }

  time_t now = time(nullptr);
  String timestamp = String(static_cast<unsigned long>(now));

  return timestamp;
}