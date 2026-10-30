import { ObjectId } from "mongodb";
export async function createNotification(db, userId, complaint, title, message) {
    const notification = {
        _id: new ObjectId(),
        userId,
        complaintId: complaint._id.toHexString(),
        publicId: complaint.publicId,
        title,
        message,
        createdAt: new Date(),
        readAt: null,
    };
    await db.collection("notifications").insertOne(notification);
}
