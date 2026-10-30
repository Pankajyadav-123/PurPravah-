export const DEPARTMENT_BY_CATEGORY = {
    road_damage: "roads",
    electricity: "electricity",
    garbage: "sanitation",
    water_leakage: "water",
    other: "general",
};
export function complaintDto(complaint) {
    return {
        id: complaint._id.toHexString(),
        publicId: complaint.publicId,
        reporterId: complaint.reporterId,
        reporterName: complaint.reporterName,
        category: complaint.category,
        description: complaint.description,
        address: complaint.address,
        city: complaint.city ?? null,
        village: complaint.village ?? null,
        district: complaint.district ?? null,
        state: complaint.state ?? null,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        photoUrl: complaint.photoUrl,
        resolutionPhotoUrl: complaint.resolutionPhotoUrl ?? null,
        department: complaint.department ?? null,
        status: complaint.status,
        suspectedDuplicate: complaint.suspectedDuplicate,
        reviewNote: complaint.reviewNote ?? null,
        history: complaint.history ?? [],
        feedback: complaint.feedback ?? null,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
    };
}
export function userDto(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        department: user.department ?? null,
        createdAt: user.createdAt,
    };
}
export function notificationDto(notification) {
    return {
        id: notification._id.toHexString(),
        complaintId: notification.complaintId,
        publicId: notification.publicId,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.readAt !== null,
    };
}
export function isCloudinaryImageUrl(value) {
    try {
        const url = new URL(value);
        return (url.protocol === "https:" &&
            url.hostname === "res.cloudinary.com" &&
            url.pathname.includes("/image/upload/"));
    }
    catch {
        return false;
    }
}
export function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function haversineMeters(latitudeA, longitudeA, latitudeB, longitudeB) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const dLatitude = radians(latitudeB - latitudeA);
    const dLongitude = radians(longitudeB - longitudeA);
    const a = Math.sin(dLatitude / 2) ** 2 +
        Math.cos(radians(latitudeA)) *
            Math.cos(radians(latitudeB)) *
            Math.sin(dLongitude / 2) ** 2;
    return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
