# Non-Blocking Scanner Usage Example

## How the Non-Blocking Scan Works

The scanner module now uses a **state machine approach** that doesn't block the main loop:

```cpp
// In main.cpp loop()
void loop()
{
    // Check for heartbeat timing
    if (timeForHeartbeat())
    {
        sendHeartbeat(SERVER_URL, DEVICE_ID, FIRMWARE_VERSION, getMode());
    }

    // Check scanner (returns immediately - non-blocking)
    ScanResult result = scanFingerprint();

    // Only send to server if we got a successful scan
    if (result.success)
    {
        sendScan(SERVER_URL, DEVICE_ID, FIRMWARE_VERSION, result);
        // Optionally reset sequence per user/session
        // resetScanSequence();
    }

    // Small delay to prevent CPU burn while still staying responsive
    delay(50);
}
```

## State Machine Flow

**State 1: Idle (scanInProgress = false)**

- Waits for SCAN_COMMAND_INTERVAL (100ms) between commands
- Sends search command to scanner
- Transitions to "waiting for response"

**State 2: Waiting (scanInProgress = true)**

- Checks for response data from scanner (non-blocking)
- Timeout is SCAN_RESPONSE_TIMEOUT (500ms)
- If data arrives → parse and transition back to Idle
- If timeout → mark as failed and transition back to Idle

## Key Benefits

✅ **Heartbeat never blocked** - sends every 5 seconds reliably  
✅ **Responsive scanning** - checks scanner every loop iteration  
✅ **CPU efficient** - minimal delays, no busy-waiting  
✅ **Scales to enrollment** - state machine easily handles multiple modes

## Tuning Parameters

In `scanner_module.cpp`:

- `SCAN_COMMAND_INTERVAL` (100ms) - How often to send search commands
- `SCAN_RESPONSE_TIMEOUT` (500ms) - Max wait for scanner response

Adjust these if:

- Scanner is slow: increase `SCAN_RESPONSE_TIMEOUT`
- Want faster polling: decrease `SCAN_COMMAND_INTERVAL`

## Helper Functions

- `isScanInProgress()` - Check if waiting for scan response
- `getScanSequence()` - Get current scan counter
- `resetScanSequence()` - Reset counter for new session/user
