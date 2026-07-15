# Data Model Notes

Core records:

- `Employee`: every user is an employee.
- `Device`: ESP32 plus scanner pair.
- `EnrollmentSession`: heartbeat-delivered workflow for enrolling one employee on one device.
- `FingerprintEnrollment`: server mapping from employee to device-local scanner template ID.
- `ScanEvent`: immutable biometric match event received by `device-gateway`.
- `ManualAttendanceRequest`: add/remove scan correction request.
- `ApprovalStep`: sequential manager and HR approvals.
- `Notification`: in-app notification created by dashboard or worker.
- `JobRun`: worker execution audit trail.
- `ReportExport`: generated report state.

Attendance is derived by ordering real scan events plus approved manual scan additions,
then pairing them as check-in/check-out, check-in/check-out.

`Device.reportedMode` records whether the ESP32 last reported `SCAN` or `ENROLL`. It is
observed state, not a server-side instruction. The gateway derives the desired mode from an
active `EnrollmentSession` and returns it in each heartbeat response. Pending sessions become
`CLAIMED` when first delivered and are redelivered by session ID until completed, cancelled,
or expired.
