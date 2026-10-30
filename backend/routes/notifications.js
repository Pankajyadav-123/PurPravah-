import { ObjectId } from "mongodb";
import { Router } from "express";
import { ListNotificationsResponse, MarkNotificationsReadBody, MarkNotificationsReadResponse, } from "../schemas/api.schema.js";
import { getCurrentUser, requireAuth } from "../lib/current-user.js";
import { getDatabase } from "../lib/mongo.js";
import { notificationDto, } from "../schemas/smart-nagarik.schema.js";
const router = Router();
router.use(requireAuth);
router.get("/notifications", async (req, res) => {
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const notifications = await db
        .collection("notifications")
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
    res.json(ListNotificationsResponse.parse(notifications.map(notificationDto)));
});
router.post("/notifications/read", async (req, res) => {
    const parsed = MarkNotificationsReadBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const ids = parsed.data.ids.map((id) => {
        if (!ObjectId.isValid(id)) {
            return null;
        }
        return new ObjectId(id);
    });
    if (ids.some((id) => id === null)) {
        res.status(400).json({ error: "One or more notification IDs are invalid." });
        return;
    }
    const result = await db.collection("notifications").updateMany({
        userId: user._id,
        readAt: null,
        ...(ids.length > 0 ? { _id: { $in: ids } } : {}),
    }, { $set: { readAt: new Date() } });
    res.json(MarkNotificationsReadResponse.parse({ updated: result.modifiedCount }));
});
export default router;
