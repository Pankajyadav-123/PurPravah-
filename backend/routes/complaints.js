import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { Router } from "express";
import { CreateComplaintBody, CreateComplaintResponse, GetComplaintParams, GetComplaintResponse, ListComplaintsQueryParams, ListComplaintsResponse, ReviewComplaintBody, ReviewComplaintParams, ReviewComplaintResponse, SubmitComplaintFeedbackBody, SubmitComplaintFeedbackParams, SubmitComplaintFeedbackResponse, UpdateComplaintStatusBody, UpdateComplaintStatusParams, UpdateComplaintStatusResponse, } from "../schemas/api.schema.js";
import { getCurrentUser, requireAuth } from "../lib/current-user.js";
import { createNotification } from "../lib/notifications.js";
import { getDatabase } from "../lib/mongo.js";
import { complaintDto, DEPARTMENT_BY_CATEGORY, escapeRegExp, haversineMeters, isCloudinaryImageUrl, } from "../schemas/smart-nagarik.schema.js";
const router = Router();
router.use(requireAuth);
const duplicateWindowMs = 30 * 24 * 60 * 60 * 1000;
const duplicateRadiusMeters = 100;
function categoryLabel(category) {
    const labels = {
        road_damage: "road damage",
        electricity: "electricity",
        garbage: "garbage",
        water_leakage: "water leakage",
        other: "civic issue",
    };
    return labels[category];
}
async function findComplaint(db, id) {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    return db
        .collection("complaints")
        .findOne({ _id: new ObjectId(id) });
}
function canViewComplaint(user, complaint) {
    if (user.role === "admin")
        return true;
    if (user.role === "citizen")
        return complaint.reporterId === user._id;
    return Boolean(user.role === "department_staff" &&
        user.department &&
        complaint.department === user.department);
}
router.get("/complaints", async (req, res) => {
    const parsed = ListComplaintsQueryParams.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const clauses = [];
    if (user.role === "citizen") {
        clauses.push({ reporterId: user._id });
    }
    else if (user.role === "department_staff") {
        if (!user.department) {
            res.status(403).json({ error: "Your account is not assigned to a department." });
            return;
        }
        clauses.push({ department: user.department });
    }
    if (parsed.data.status)
        clauses.push({ status: parsed.data.status });
    if (parsed.data.category)
        clauses.push({ category: parsed.data.category });
    if (parsed.data.department)
        clauses.push({ department: parsed.data.department });
    if (parsed.data.mineOnly)
        clauses.push({ reporterId: user._id });
    if (parsed.data.search?.trim()) {
        const search = new RegExp(escapeRegExp(parsed.data.search.trim()), "i");
        clauses.push({
            $or: [
                { publicId: search },
                { description: search },
                { address: search },
                { reporterName: search },
            ],
        });
    }
    const filter = clauses.length > 0 ? { $and: clauses } : {};
    const complaints = await db
        .collection("complaints")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
    res.json(ListComplaintsResponse.parse(complaints.map(complaintDto)));
});
router.post("/complaints", async (req, res) => {
    const parsed = CreateComplaintBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    if (!isCloudinaryImageUrl(parsed.data.photoUrl)) {
        res.status(400).json({ error: "Upload the report photo to Cloudinary first." });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    if (user.role === "department_staff") {
        res.status(403).json({ error: "Department staff cannot submit citizen reports." });
        return;
    }
    const description = parsed.data.description.trim();
    const address = parsed.data.address.trim();
    if (description.length < 10 || address.length < 4) {
        res.status(400).json({ error: "Add a clear description and a more complete location." });
        return;
    }
    if (!Number.isFinite(parsed.data.latitude) ||
        Math.abs(parsed.data.latitude) > 90 ||
        !Number.isFinite(parsed.data.longitude) ||
        Math.abs(parsed.data.longitude) > 180) {
        res.status(400).json({ error: "Choose a valid map location." });
        return;
    }
    const now = new Date();
    const candidates = await db
        .collection("complaints")
        .find({
        category: parsed.data.category,
        status: { $ne: "rejected" },
        createdAt: { $gte: new Date(now.getTime() - duplicateWindowMs) },
    })
        .project({ latitude: 1, longitude: 1, publicId: 1 })
        .limit(250)
        .toArray();
    const duplicate = candidates.find((candidate) => haversineMeters(candidate.latitude, candidate.longitude, parsed.data.latitude, parsed.data.longitude) <= duplicateRadiusMeters);
    const status = duplicate
        ? "under_verification"
        : "assigned";
    const department = duplicate
        ? null
        : DEPARTMENT_BY_CATEGORY[parsed.data.category];
    const publicId = `SN-${now.getFullYear()}-${randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;
    const complaint = {
        _id: new ObjectId(),
        publicId,
        reporterId: user._id,
        reporterName: user.name,
        category: parsed.data.category,
        description,
        address,
        city: parsed.data.city?.trim() || null,
        village: parsed.data.village?.trim() || null,
        district: parsed.data.district?.trim() || null,
        state: parsed.data.state?.trim() || null,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        photoUrl: parsed.data.photoUrl,
        resolutionPhotoUrl: null,
        department,
        status,
        suspectedDuplicate: Boolean(duplicate),
        reviewNote: duplicate
            ? `A similar ${categoryLabel(parsed.data.category)} report (${duplicate.publicId}) is nearby. An administrator will review this submission.`
            : null,
        history: [
            {
                status,
                note: duplicate
                    ? "Possible duplicate detected; sent for manual verification."
                    : `Automatically assigned to the ${department} department.`,
                actorName: "PurPravah",
                createdAt: now,
            },
        ],
        feedback: null,
        createdAt: now,
        updatedAt: now,
    };
    await db.collection("complaints").insertOne(complaint);
    try {
        await createNotification(db, user._id, complaint, duplicate ? "Report under verification" : "Report submitted", duplicate
            ? `${publicId} needs a manual review because a similar report is nearby.`
            : `${publicId} was assigned to the ${department} department.`);
    }
    catch (error) {
        req.log.warn({ errorName: error instanceof Error ? error.name : "unknown" }, "Could not create complaint notification");
    }
    res.status(201).json(CreateComplaintResponse.parse(complaintDto(complaint)));
});
router.get("/complaints/:id", async (req, res) => {
    const params = GetComplaintParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const complaint = await findComplaint(db, params.data.id);
    if (!complaint) {
        res.status(404).json({ error: "Complaint not found." });
        return;
    }
    if (!canViewComplaint(user, complaint)) {
        res.status(403).json({ error: "You do not have access to this complaint." });
        return;
    }
    res.json(GetComplaintResponse.parse(complaintDto(complaint)));
});
router.patch("/complaints/:id/status", async (req, res) => {
    const params = UpdateComplaintStatusParams.safeParse(req.params);
    const body = UpdateComplaintStatusBody.safeParse(req.body);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    if (user.role !== "admin" && user.role !== "department_staff") {
        res.status(403).json({ error: "Only department staff can update complaint status." });
        return;
    }
    const complaint = await findComplaint(db, params.data.id);
    if (!complaint) {
        res.status(404).json({ error: "Complaint not found." });
        return;
    }
    if (user.role === "department_staff" &&
        (!user.department || complaint.department !== user.department)) {
        res.status(403).json({ error: "This complaint is assigned to another department." });
        return;
    }
    const nextStatus = body.data.status;
    if (nextStatus === "in_progress" && !["assigned", "in_progress"].includes(complaint.status)) {
        res.status(409).json({ error: "Only assigned complaints can be started." });
        return;
    }
    if (nextStatus === "resolved") {
        if (complaint.status !== "in_progress") {
            res.status(409).json({ error: "Start work before marking this complaint resolved." });
            return;
        }
        if (!body.data.resolutionPhotoUrl || !isCloudinaryImageUrl(body.data.resolutionPhotoUrl)) {
            res.status(400).json({ error: "Upload an after-resolution photo to Cloudinary before resolving." });
            return;
        }
    }
    const now = new Date();
    const note = body.data.note.trim() || (nextStatus === "in_progress" ? "Work started." : "Issue resolved.");
    const historyEntry = {
        status: nextStatus,
        note,
        actorName: user.name,
        createdAt: now,
    };
    const set = {
        status: nextStatus,
        updatedAt: now,
    };
    if (nextStatus === "resolved") {
        set.resolutionPhotoUrl = body.data.resolutionPhotoUrl ?? null;
        set.resolvedAt = now;
    }
    await db.collection("complaints").updateOne({ _id: complaint._id }, { $set: set, $push: { history: historyEntry } });
    const updated = await findComplaint(db, complaint._id.toHexString());
    if (!updated) {
        res.status(500).json({ error: "Complaint status was saved, but the updated report could not be loaded." });
        return;
    }
    try {
        await createNotification(db, complaint.reporterId, updated, nextStatus === "resolved" ? "Issue resolved" : "Work is in progress", `${complaint.publicId}: ${note}`);
    }
    catch (error) {
        req.log.warn({ errorName: error instanceof Error ? error.name : "unknown" }, "Could not create status notification");
    }
    res.json(UpdateComplaintStatusResponse.parse(complaintDto(updated)));
});
router.post("/complaints/:id/review", async (req, res) => {
    const params = ReviewComplaintParams.safeParse(req.params);
    const body = ReviewComplaintBody.safeParse(req.body);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    if (user.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
    }
    const complaint = await findComplaint(db, params.data.id);
    if (!complaint) {
        res.status(404).json({ error: "Complaint not found." });
        return;
    }
    if (body.data.action !== "reassign" && complaint.status !== "under_verification") {
        res.status(409).json({ error: "Only reports under verification can be verified or rejected." });
        return;
    }
    if (body.data.action === "reassign" && complaint.status === "resolved") {
        res.status(409).json({ error: "Resolved complaints cannot be reassigned." });
        return;
    }
    if (body.data.action === "reassign" && !body.data.department) {
        res.status(400).json({ error: "Choose a department for reassignment." });
        return;
    }
    const now = new Date();
    const nextDepartment = body.data.action === "reassign"
        ? body.data.department
        : body.data.department ?? DEPARTMENT_BY_CATEGORY[complaint.category];
    const nextStatus = body.data.action === "reject"
        ? "rejected"
        : body.data.action === "verify" || body.data.action === "reassign"
            ? "assigned"
            : complaint.status;
    const note = body.data.note.trim();
    const historyNote = body.data.action === "reassign"
        ? `Reassigned to ${nextDepartment}: ${note}`
        : body.data.action === "verify"
            ? `Verified and assigned to ${nextDepartment}: ${note}`
            : `Rejected after review: ${note}`;
    await db.collection("complaints").updateOne({ _id: complaint._id }, {
        $set: {
            status: nextStatus,
            department: body.data.action === "reject" ? null : nextDepartment,
            suspectedDuplicate: false,
            reviewNote: body.data.action === "reject" ? note : null,
            updatedAt: now,
        },
        $push: {
            history: {
                status: nextStatus,
                note: historyNote,
                actorName: user.name,
                createdAt: now,
            },
        },
    });
    const updated = await findComplaint(db, complaint._id.toHexString());
    if (!updated) {
        res.status(500).json({ error: "The reviewed complaint could not be loaded." });
        return;
    }
    await createNotification(db, complaint.reporterId, updated, body.data.action === "reject" ? "Report reviewed" : "Department assigned", `${complaint.publicId}: ${historyNote}`);
    res.json(ReviewComplaintResponse.parse(complaintDto(updated)));
});
router.post("/complaints/:id/feedback", async (req, res) => {
    const params = SubmitComplaintFeedbackParams.safeParse(req.params);
    const body = SubmitComplaintFeedbackBody.safeParse(req.body);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const complaint = await findComplaint(db, params.data.id);
    if (!complaint) {
        res.status(404).json({ error: "Complaint not found." });
        return;
    }
    if (complaint.reporterId !== user._id) {
        res.status(403).json({ error: "Only the reporting citizen can leave feedback." });
        return;
    }
    if (complaint.status !== "resolved") {
        res.status(409).json({ error: "Feedback is available after the issue is resolved." });
        return;
    }
    if (complaint.feedback) {
        res.status(409).json({ error: "Feedback has already been submitted for this report." });
        return;
    }
    const now = new Date();
    await db.collection("complaints").updateOne({ _id: complaint._id, feedback: null }, {
        $set: {
            feedback: {
                rating: body.data.rating,
                comment: body.data.comment.trim(),
                createdAt: now,
            },
            updatedAt: now,
        },
    });
    const updated = await findComplaint(db, complaint._id.toHexString());
    if (!updated) {
        res.status(500).json({ error: "Feedback was saved, but the report could not be loaded." });
        return;
    }
    res.json(SubmitComplaintFeedbackResponse.parse(complaintDto(updated)));
});
export default router;
