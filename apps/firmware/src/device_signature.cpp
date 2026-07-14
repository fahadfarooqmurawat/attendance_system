#include "device_signature.h"
#include <time.h>
#include <cstring>
#include <cstdio>
#include <mbedtls/sha256.h>
#include <mbedtls/md.h>

String createDeviceSignature(const char *method, const char *path, const String &body, const char *deviceSecret, String &outTimestamp)
{
    // Compute sha256(secret) -> 32 bytes key
    unsigned char secretHash[32];
    mbedtls_sha256_context sha_ctx;
    mbedtls_sha256_init(&sha_ctx);
    mbedtls_sha256_starts_ret(&sha_ctx, 0); // 0 for SHA-256
    mbedtls_sha256_update_ret(&sha_ctx, (const unsigned char *)deviceSecret, strlen(deviceSecret));
    mbedtls_sha256_finish_ret(&sha_ctx, secretHash);
    mbedtls_sha256_free(&sha_ctx);

    // Build message: timestamp + '\n' + METHOD + '\n' + PATH + '\n' + body
    String methodStr = String(method);
    methodStr.toUpperCase();
    String message = outTimestamp + "\n" + methodStr + "\n" + String(path) + "\n" + body;

    // Compute HMAC-SHA256 with key = secretHash
    const mbedtls_md_info_t *md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    unsigned char mac[32];
    mbedtls_md_hmac(md_info, secretHash, sizeof(secretHash), (const unsigned char *)message.c_str(), message.length(), mac);

    // Convert mac to lowercase hex
    char hex[65];
    for (size_t i = 0; i < 32; ++i)
    {
        sprintf(&hex[i * 2], "%02x", mac[i]);
    }
    hex[64] = '\0';

    // Prefix with sha256= to match server normalization expectations (optional)
    String signature = String("sha256=") + String(hex);
    return signature;
}
