# Approval Workflow

Manual attendance requests are sequential.

```text
employee submits request
  -> direct manager approval, if an eligible manager exists
  -> HR approval
  -> applied to attendance timeline
```

Rules:

- Employees have at most one direct manager.
- Managers use the same workflow as employees.
- HR employees use the same workflow as employees.
- No employee should approve their own request.
- If there is no manager, the request goes directly to HR.
- If there is no eligible HR approver, an owner account is the fallback approver.
