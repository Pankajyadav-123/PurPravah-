import { GetProfileResponse, UpdateProfileBody, UpdateProfileResponse, } from "../schemas/api.schema.js";
import { getCurrentUser } from "../lib/current-user.js";
import { getDatabase } from "../lib/mongo.js";
import { userDto } from "../schemas/smart-nagarik.schema.js";
export const getProfile = async (req, res) => {
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    res.json(GetProfileResponse.parse(userDto(user)));
};
export const updateProfile = async (req, res) => {
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const updatedAt = new Date();
    const users = db.collection("users");
    await users.updateOne({ _id: user._id }, {
        $set: {
            name: parsed.data.name.trim(),
            phone: parsed.data.phone.trim(),
            updatedAt,
        },
    });
    const updated = await users.findOne({ _id: user._id });
    if (!updated) {
        res.status(500).json({ error: "Your profile could not be saved." });
        return;
    }
    res.json(UpdateProfileResponse.parse(userDto(updated)));
};
