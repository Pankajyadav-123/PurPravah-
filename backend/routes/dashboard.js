import { Router } from "express";
import { GetDashboardSummaryResponse, GetDepartmentPerformanceResponse, } from "../schemas/api.schema.js";
import { getCurrentUser, requireAuth } from "../lib/current-user.js";
import { getDatabase } from "../lib/mongo.js";
import { complaintDto, } from "../schemas/smart-nagarik.schema.js";
const router = Router();
router.use(requireAuth);
const departments = [
    "roads",
    "electricity",
    "sanitation",
    "water",
    "general",
];
router.get("/dashboard/summary", async (req, res) => {
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    if (user.role === "department_staff" && !user.department) {
        res.status(403).json({ error: "Your account is not assigned to a department." });
        return;
    }
    const baseFilter = user.role === "citizen"
        ? { reporterId: user._id }
        : user.role === "department_staff"
            ? { department: user.department }
            : {};
    const complaints = db.collection("complaints");
    const [total, needsReview, assigned, inProgress, resolved, recent, resolution] = await Promise.all([
        complaints.countDocuments(baseFilter),
        complaints.countDocuments({
            ...baseFilter,
            status: "under_verification",
        }),
        complaints.countDocuments({ ...baseFilter, status: "assigned" }),
        complaints.countDocuments({ ...baseFilter, status: "in_progress" }),
        complaints.countDocuments({ ...baseFilter, status: "resolved" }),
        complaints
            .find(baseFilter)
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray(),
        complaints
            .aggregate([
            {
                $match: {
                    ...baseFilter,
                    status: "resolved",
                    resolvedAt: { $type: "date" },
                },
            },
            {
                $group: {
                    _id: null,
                    average: {
                        $avg: {
                            $divide: [
                                { $subtract: ["$resolvedAt", "$createdAt"] },
                                3_600_000,
                            ],
                        },
                    },
                },
            },
        ])
            .next(),
    ]);
    res.json(GetDashboardSummaryResponse.parse({
        total,
        pending: assigned + needsReview,
        inProgress,
        resolved,
        needsReview,
        averageResolutionHours: resolution?.average ?? 0,
        recent: recent.map(complaintDto),
    }));
});
router.get("/departments/performance", async (req, res) => {
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    if (user.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
    }
    const complaints = db.collection("complaints");
    const performance = await Promise.all(departments.map(async (department) => {
        const filter = { department };
        const [total, pending, inProgress, resolved, resolution] = await Promise.all([
            complaints.countDocuments(filter),
            complaints.countDocuments({
                ...filter,
                status: { $in: ["under_verification", "assigned"] },
            }),
            complaints.countDocuments({ ...filter, status: "in_progress" }),
            complaints.countDocuments({ ...filter, status: "resolved" }),
            complaints
                .aggregate([
                {
                    $match: {
                        ...filter,
                        status: "resolved",
                        resolvedAt: { $type: "date" },
                    },
                },
                {
                    $group: {
                        _id: null,
                        average: {
                            $avg: {
                                $divide: [
                                    { $subtract: ["$resolvedAt", "$createdAt"] },
                                    3_600_000,
                                ],
                            },
                        },
                    },
                },
            ])
                .next(),
        ]);
        return {
            department,
            total,
            pending,
            inProgress,
            resolved,
            averageResolutionHours: resolution?.average ?? 0,
        };
    }));
    res.json(GetDepartmentPerformanceResponse.parse(performance));
});
export default router;
