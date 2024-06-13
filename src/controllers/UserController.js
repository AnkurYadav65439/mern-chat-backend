import User from "../models/User.js";
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

const signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existinguser = await User.findOne({ email });

        if (existinguser) {
            return res.status(403).json({ message: "User already exist" });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const username = email.split('@')[0];

        const newuser = User.create({
            email, password: hashedPassword, username
        });

        //want user to direclty login after signup(or just called signin)
        const token = jwt.sign({ id: newuser._id, username: newuser.username }, process.env.JWT_SECRET);

        res.cookie('token', token).status(201).json({ username: newuser.username, id: newuser._id });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Email doesn't exist" });
        }

        const isPasswordCorrect = await bcryptjs.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Wrong credentials" });
        }

        //user email, pw is correct
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);

        res.cookie('token', token, { secure: true, sameSite: 'none' }).status(200).json({ username: user.username, id: user._id });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getCurrentUser = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);

        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ username: currentUser.username, id: currentUser._id });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const logout = async (req, res) => {
    try {
        res.cookie('token', '').status(200).json({ message: 'ok' })   //or clearCookie('token')
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    signup,
    signin,
    getCurrentUser,
    logout
}