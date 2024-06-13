import Message from "../models/Message.js";

const getMessages = async (req, res) => {
    try {
        const selectedUser = req.params.id;
        const userId = req.userId;

        if (!userId || !selectedUser) {
            return res.status(404).json({ message: "No user found" });
        }

        const messages = await Message.find({
            sender: { $in: [userId, selectedUser] },
            recipient: { $in: [userId, selectedUser] }
        }).sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getMessages
}