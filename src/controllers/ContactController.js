import User from "../models/User.js";

const getAllContacts = async (req,res) => {
    try {
        const contacts = await User.find({}, { username: 1 });
        res.json(contacts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getAllContacts
}