"use server";

import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { createPrismaClient } from "@attendance/db";
import { revalidatePath } from "next/cache";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export type RequestState = {
  error?: string;
  success?: string;
};

export async function submitManualRequest(prevState: RequestState, formData: FormData): Promise<RequestState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized: Please log in to submit requests." };
  }

  const punchType = formData.get("punchType") as string;
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;
  const reason = (formData.get("reason") as string)?.trim();

  if (!dateStr || !timeStr) {
    return { error: "Both date and time are required." };
  }

  if (!reason) {
    return { error: "Reason for manual request is required." };
  }

  const timestamp = new Date(`${dateStr}T${timeStr}:00`);

  if (isNaN(timestamp.getTime())) {
    return { error: "Invalid date or time format provided." };
  }

  // Fetch employee role and manager to determine initial status
  const employee = await db.employee.findUnique({
    where: { id: user.employeeId },
    include: { role: true }
  });

  const isRegularEmployee = !employee?.role || employee.role.name === "employee";
  // Regular employees start at PENDING_MANAGER (Stage 1), managers/HR start at PENDING_HR (Stage 2)
  const initialStatus = isRegularEmployee && employee?.managerId ? "PENDING_MANAGER" : "PENDING_HR";

  const punchLabel = punchType === "CHECK_OUT" ? "Check-Out" : "Check-In";
  const formattedReason = `[${punchLabel}] ${reason}`;

  await db.manualAttendanceRequest.create({
    data: {
      employeeId: user.employeeId,
      createdByEmployeeId: user.employeeId,
      type: "ADD_SCAN",
      requestedTimestamp: timestamp,
      reason: formattedReason,
      status: initialStatus
    }
  });

  revalidatePath("/manual-requests");
  revalidatePath("/my-attendance");

  const stageLabel = initialStatus === "PENDING_MANAGER" ? "Sent to Manager for 1st approval." : "Sent to HR for approval.";
  return {
    success: `Manual ${punchLabel} request submitted successfully! ${stageLabel}`
  };
}

export async function approveRequest(requestId: string): Promise<RequestState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized: Please log in." };
  }

  const request = await db.manualAttendanceRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: {
        include: { role: true }
      },
      createdBy: {
        include: { role: true }
      }
    }
  });

  if (!request) {
    return { error: "Request not found" };
  }

  if (request.status === "APPROVED") {
    return { error: "Request is already approved." };
  }

  if (request.status === "REJECTED") {
    return { error: "Request has been rejected." };
  }

  const requesterRole = request.employee.role?.name || request.createdBy?.role?.name;
  const isHRRequest = requesterRole === "hr";
  const isSelf = user.employeeId === request.employeeId || user.employeeId === request.createdByEmployeeId;

  // RULE 1: HR requests can ONLY be approved by the Owner (HR cannot self-approve or approve fellow HR)
  if (isHRRequest) {
    if (user.roleName !== "owner") {
      return { error: "Unauthorized: Requests for HR staff can ONLY be approved by the Company Owner." };
    }
  }

  const userRole = user.roleName?.toLowerCase() || "";
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  // RULE 2: No self-approval (except Owner / Admin)
  if (isSelf && !isOwnerOrAdmin) {
    return { error: "Unauthorized: You cannot approve your own manual attendance request." };
  }

  // Stage 1: Manager / Supervisor / Approver Stage (PENDING_MANAGER -> PENDING_HR)
  if (request.status === "PENDING_MANAGER") {
    if (userRole === "hr") {
      return { error: "Stage 1 Approval must be completed by the direct Manager first before HR can approve." };
    }

    const canApproveStage1 =
      hasPermission(user, "approvals") ||
      ["manager", "supervisor", "team_lead", "owner", "admin"].includes(userRole);

    if (!canApproveStage1) {
      return { error: "Unauthorized: 1st stage approval must be completed by an authorized Manager or Approver." };
    }

    await db.manualAttendanceRequest.update({
      where: { id: requestId },
      data: { status: "PENDING_HR" }
    });

    revalidatePath("/approvals");
    revalidatePath("/manual-requests");
    revalidatePath("/my-attendance");

    return { success: "1st Stage Approval completed! Request advanced to HR for final approval." };
  }

  // Stage 2: HR or Owner Approval (PENDING_HR -> APPROVED)
  if (request.status === "PENDING_HR") {
    if (isHRRequest && !isOwnerOrAdmin) {
      return { error: "Unauthorized: HR requests can only be approved by the Company Owner." };
    }

    const canApproveStage2 =
      userRole === "hr" ||
      isOwnerOrAdmin ||
      hasPermission(user, "company_attendance");

    if (!canApproveStage2) {
      return { error: "Unauthorized: Final stage approval must be completed by HR or Owner." };
    }

    await db.manualAttendanceRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        appliedAt: new Date()
      }
    });

    if (request.requestedTimestamp) {
      let device = await db.device.findFirst({ where: { status: "ACTIVE" } });
      if (!device) device = await db.device.findFirst();

      if (device) {
        await db.scanEvent.create({
          data: {
            deviceId: device.id,
            employeeId: request.employeeId,
            scannerTemplateId: 1,
            serverReceivedAt: request.requestedTimestamp,
            createdAt: request.requestedTimestamp
          }
        });
      }
    }

    revalidatePath("/approvals");
    revalidatePath("/manual-requests");
    revalidatePath("/my-attendance");

    return { success: "Approval completed! Missing scan timestamp added to attendance table." };
  }

  return { error: "Invalid request state." };
}

export async function rejectRequest(requestId: string): Promise<RequestState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized: Please log in." };
  }

  const request = await db.manualAttendanceRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: {
        include: { role: true }
      },
      createdBy: {
        include: { role: true }
      }
    }
  });

  if (!request) {
    return { error: "Request not found" };
  }

  const requesterRole = request.employee.role?.name || request.createdBy?.role?.name;
  const isHRRequest = requesterRole === "hr";
  const isSelf = user.employeeId === request.employeeId || user.employeeId === request.createdByEmployeeId;

  if (isHRRequest && user.roleName !== "owner") {
    return { error: "Unauthorized: Requests for HR staff can ONLY be rejected by the Company Owner." };
  }

  if (isSelf && user.roleName !== "owner") {
    return { error: "Unauthorized: You cannot reject your own manual attendance request." };
  }

  await db.manualAttendanceRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" }
  });

  revalidatePath("/approvals");
  revalidatePath("/manual-requests");
  revalidatePath("/my-attendance");

  return { success: "Request rejected." };
}

export async function deleteManualRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in.");
  }

  const id = formData.get("id") as string;
  if (!id) return;

  const request = await db.manualAttendanceRequest.findUnique({
    where: { id }
  });

  if (!request) return;

  const isOwnerOrHR = user.roleName === "owner" || user.roleName === "hr";
  const isOwnerOrCreator = request.employeeId === user.employeeId || request.createdByEmployeeId === user.employeeId;

  if (!isOwnerOrHR && !isOwnerOrCreator) {
    throw new Error("Unauthorized: You can only delete your own submitted requests.");
  }

  await db.manualAttendanceRequest.delete({
    where: { id }
  });

  revalidatePath("/manual-requests");
  revalidatePath("/my-attendance");
  revalidatePath("/approvals");
}
