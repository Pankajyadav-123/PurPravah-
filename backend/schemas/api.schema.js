import { z } from "zod";

const category = z.enum([
  "road_damage",
  "electricity",
  "garbage",
  "water_leakage",
  "other",
]);
const department = z.enum([
  "roads",
  "electricity",
  "sanitation",
  "water",
  "general",
]);
const complaintStatus = z.enum([
  "under_verification",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
]);
const role = z.enum(["citizen", "department_staff", "admin"]);
const idParams = z.object({ id: z.string().min(1) });
const response = z.unknown();
const responseList = z.array(z.unknown());

export const HealthCheckResponse = z.object({ status: z.literal("ok") });
export const GetSetupStatusResponse = z.object({
  ready: z.boolean(),
  mongoConfigured: z.boolean(),
  cloudinaryConfigured: z.boolean(),
  missing: z.array(z.string()),
  message: z.string(),
});
export const AuthRegisterBody = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});
export const AuthLoginBody = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const GetProfileResponse = response;
export const UpdateProfileResponse = response;
export const UpdateProfileBody = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30),
});

export const GetDashboardSummaryResponse = z.object({
  total: z.number(),
  pending: z.number(),
  inProgress: z.number(),
  resolved: z.number(),
  needsReview: z.number(),
  averageResolutionHours: z.number(),
  recent: responseList,
});
export const GetDepartmentPerformanceResponse = responseList;
export const GetPublicComplaintStatsResponse = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  resolved: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  recentComplaints: z.array(z.object({
    publicId: z.string(),
    category,
    description: z.string(),
    area: z.string().nullable(),
    district: z.string().nullable(),
    state: z.string().nullable(),
    mapLatitude: z.number().min(-90).max(90).nullable(),
    mapLongitude: z.number().min(-180).max(180).nullable(),
    status: complaintStatus,
    createdAt: z.string().datetime(),
    resolvedAt: z.string().datetime().nullable(),
  })),
});

export const GetComplaintParams = idParams;
export const ReviewComplaintParams = idParams;
export const SubmitComplaintFeedbackParams = idParams;
export const UpdateComplaintStatusParams = idParams;
export const GetComplaintResponse = response;
export const CreateComplaintResponse = response;
export const ReviewComplaintResponse = response;
export const SubmitComplaintFeedbackResponse = response;
export const UpdateComplaintStatusResponse = response;
export const ListComplaintsResponse = responseList;

export const CreateComplaintBody = z.object({
  category,
  description: z.string().trim().min(1).max(5000),
  address: z.string().trim().min(1).max(1000),
  city: z.string().trim().max(120).optional(),
  village: z.string().trim().max(120).optional(),
  district: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  photoUrl: z.string().url(),
});
export const ListComplaintsQueryParams = z.object({
  status: complaintStatus.optional(),
  category: category.optional(),
  department: department.optional(),
  mineOnly: z.preprocess(
    (value) => value === "true" || value === true,
    z.boolean(),
  ).optional(),
  search: z.string().optional(),
});
export const UpdateComplaintStatusBody = z.object({
  status: z.enum(["in_progress", "resolved"]),
  note: z.string().trim().max(1000),
  resolutionPhotoUrl: z.string().url().optional(),
});
export const ReviewComplaintBody = z.object({
  action: z.enum(["verify", "reject", "reassign"]),
  department: department.optional(),
  note: z.string().trim().max(1000),
});
export const SubmitComplaintFeedbackBody = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
});

export const CreateUploadSignatureBody = z.object({
  purpose: z.enum(["complaint", "resolution"]),
});
export const CreateUploadSignatureResponse = z.object({
  cloudName: z.string(),
  apiKey: z.string(),
  timestamp: z.number(),
  signature: z.string(),
  folder: z.string(),
});

export const AdminListUsersQueryParams = z.object({
  role: role.optional(),
  search: z.string().optional(),
});
export const AdminListUsersResponse = responseList;
export const AdminListFeedbackResponse = z.array(z.object({
  publicId: z.string(),
  reporterName: z.string(),
  category,
  department: department.nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string().datetime(),
}));
export const AdminUpdateUserRoleParams = idParams;
export const AdminUpdateUserRoleBody = z.object({
  role,
  department: department.nullable().optional(),
});
export const AdminUpdateUserRoleResponse = response;

export const ListNotificationsResponse = responseList;
export const MarkNotificationsReadBody = z.object({
  ids: z.array(z.string()).max(100),
});
export const MarkNotificationsReadResponse = z.object({
  updated: z.number(),
});
