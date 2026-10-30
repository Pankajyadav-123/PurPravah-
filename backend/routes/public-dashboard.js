import { Router } from "express";
import { GetPublicComplaintStatsResponse } from "../schemas/api.schema.js";
import { getDatabase } from "../lib/mongo.js";

const router = Router();

router.get("/public/dashboard/stats", async (_req, res) => {
    const db = await getDatabase();
    const complaints = db.collection("complaints");
    const [stats, recentComplaints] = await Promise.all([
        complaints.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["under_verification", "assigned"]] },
                                1,
                                0,
                            ],
                        },
                    },
                    inProgress: {
                        $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
                    },
                    resolved: {
                        $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
                    },
                    rejected: {
                        $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    pending: 1,
                    inProgress: 1,
                    resolved: 1,
                    rejected: 1,
                },
            },
        ]).next(),
        complaints.find({})
            .project({
                publicId: 1,
                category: 1,
                description: 1,
                village: 1,
                city: 1,
                district: 1,
                state: 1,
                latitude: 1,
                longitude: 1,
                status: 1,
                createdAt: 1,
                resolvedAt: 1,
                "history.status": 1,
                "history.createdAt": 1,
            })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray(),
    ]);

    const totals = stats ?? {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
    };

    res.json(GetPublicComplaintStatsResponse.parse({
        ...totals,
        recentComplaints: recentComplaints.map((complaint) => {
            const resolvedAt = complaint.resolvedAt
                ?? complaint.history?.find((entry) => entry.status === "resolved")?.createdAt
                ?? null;
            const area = complaint.village?.trim() || complaint.city?.trim() || null;
            const hasCoordinates = Number.isFinite(complaint.latitude)
                && Number.isFinite(complaint.longitude)
                && Math.abs(complaint.latitude) <= 90
                && Math.abs(complaint.longitude) <= 180;
            return {
                publicId: complaint.publicId,
                category: complaint.category,
                description: complaint.description,
                area,
                district: complaint.district ?? null,
                state: complaint.state ?? null,
                mapLatitude: hasCoordinates
                    ? Math.round(complaint.latitude * 100) / 100
                    : null,
                mapLongitude: hasCoordinates
                    ? Math.round(complaint.longitude * 100) / 100
                    : null,
                status: complaint.status,
                createdAt: new Date(complaint.createdAt).toISOString(),
                resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
            };
        }),
    }));
});

export default router;
