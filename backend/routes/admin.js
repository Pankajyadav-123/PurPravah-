import { Router } from "express";
import { AdminListFeedbackResponse, AdminListUsersQueryParams, AdminListUsersResponse, AdminUpdateUserRoleBody, AdminUpdateUserRoleParams, AdminUpdateUserRoleResponse, } from "../schemas/api.schema.js";
import { getCurrentUser, requireAuth } from "../lib/current-user.js";
import { getDatabase } from "../lib/mongo.js";
import { escapeRegExp, userDto } from "../schemas/smart-nagarik.schema.js";
const router = Router();
router.use(requireAuth);
router.get("/admin/feedback", async (req, res) => {
    const db = await getDatabase();
    const currentUser = await getCurrentUser(req, db);
    if (currentUser.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
    }
    const feedback = await db.collection("complaints")
        .find({
        status: "resolved",
        "feedback.rating": { $gte: 1 },
        "feedback.createdAt": { $type: "date" },
    })
        .sort({ "feedback.createdAt": -1 })
        .limit(200)
        .project({
        publicId: 1,
        reporterName: 1,
        category: 1,
        department: 1,
        feedback: 1,
    })
        .toArray();
    res.json(AdminListFeedbackResponse.parse(feedback.map((item) => ({
        publicId: item.publicId,
        reporterName: item.reporterName,
        category: item.category,
        department: item.department ?? null,
        rating: item.feedback.rating,
        comment: item.feedback.comment ?? "",
        createdAt: item.feedback.createdAt.toISOString(),
    }))));
});
router.get("/admin/users", async (req, res) => {
    const parsed = AdminListUsersQueryParams.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const db = await getDatabase();
    const currentUser = await getCurrentUser(req, db);
    if (currentUser.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
    }
    const clauses = [];
    if (parsed.data.role)
        clauses.push({ role: parsed.data.role });
    if (parsed.data.search?.trim()) {
        const search = new RegExp(escapeRegExp(parsed.data.search.trim()), "i");
        clauses.push({ $or: [{ name: search }, { email: search }, { phone: search }] });
    }
    const filter = clauses.length ? { $and: clauses } : {};
    const users = await db
        .collection("users")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
    res.json(AdminListUsersResponse.parse(users.map(userDto)));
});
router.patch("/admin/users/:id/role", async (req, res) => {
    const params = AdminUpdateUserRoleParams.safeParse(req.params);
    const body = AdminUpdateUserRoleBody.safeParse(req.body);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
    }
    const db = await getDatabase();
    const currentUser = await getCurrentUser(req, db);
    if (currentUser.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
    }
    if (body.data.role === "admin" && params.data.id !== currentUser._id) {
        res.status(403).json({ error: "Administrator access is managed through backend environment credentials." });
        return;
    }
    if (body.data.role === "department_staff" &&
        !body.data.department) {
        res.status(400).json({ error: "Choose a department for department staff." });
        return;
    }
    if (body.data.role !== "department_staff" && body.data.department !== null) {
        res.status(400).json({ error: "Only department staff can be assigned to a department." });
        return;
    }
    if (params.data.id === currentUser._id && body.data.role !== "admin") {
        res.status(409).json({ error: "You cannot remove your own administrator access." });
        return;
    }
    const users = db.collection("users");
    const result = await users.updateOne({ _id: params.data.id }, {
        $set: {
            role: body.data.role,
            department: body.data.role === "department_staff" ? body.data.department : null,
            updatedAt: new Date(),
        },
    });
    if (result.matchedCount === 0) {
        res.status(404).json({ error: "User not found." });
        return;
    }
    const updated = await users.findOne({ _id: params.data.id });
    if (!updated) {
        res.status(500).json({ error: "The updated user could not be loaded." });
        return;
    }
    res.json(AdminUpdateUserRoleResponse.parse(userDto(updated)));
});
export default router;
