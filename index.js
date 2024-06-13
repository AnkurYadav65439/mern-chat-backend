import express, { json } from 'express'
import dotenv from 'dotenv'
import userRoute from './src/routes/UserRoute.js'
import mongoose from 'mongoose';
import cors from 'cors'
import cookieParser from "cookie-parser"
import { WebSocketServer } from "ws"
import jwt from 'jsonwebtoken'
import Message from './src/models/Message.js';
import messageRoute from './src/routes/MessageRoute.js'
import contactRoute from './src/routes/ContactRoute.js'

const app = express();

dotenv.config();

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(cookieParser());

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB!"));

//health endpoint
app.get("/health", (req, res) => {
    res.json({ message: "ok" })
})

//user routes
app.use("/api/user", userRoute);
app.use("/api/messages", messageRoute);
app.use("/api/contacts", contactRoute);

const server = app.listen(port, () => {
    console.log("server listening at port : ", port);
})

//making ws server
const wss = new WebSocketServer({ server });
wss.on("connection", (connection, req) => {

    // const notifyAboutOnlinePeople = () => {
    //     [...wss.clients].forEach(c => {
    //         c.send(JSON.stringify({
    //             online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
    //         }))
    //     })
    // }

    //(at last) modern and robust way to ping user to check whether its connected still or responsive, notify other users if not
    connection.isAlive = true;   //?need

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            console.log("connection closing ", [...wss.clients].length)
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            console.log("connection terminated, online  will sent ", [...wss.clients].length);
            // notifyAboutOnlinePeople();
            [...wss.clients].forEach(c => {
                c.send(JSON.stringify({
                    online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
                }))
            })
            console.log('dead');
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    //fetch userId , username from cookie and add to connections(for wss.client)
    const cookies = req.headers.cookie;
    if (cookies) {
        //can be multiple cookies with ';' separated
        const tokenCookieString = cookies.split(";").find(str => str.trimStart().startsWith('token'));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                    if (err) throw err;
                    const { id, username } = user;
                    connection.userId = id;
                    connection.username = username;
                })
            }
        }
    }

    connection.on("message", async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text } = messageData;
        if (recipient && text) {
            //saving msg in db
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text
            });
            //sending to that recipient
            [...wss.clients].filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({ text, sender: connection.userId, _id: messageDoc._id })));     //'recipient' can be send too(for messages state uniformity)
        }
    });

    //notify to all clients about all online users
    // notifyAboutOnlinePeople();
    [...wss.clients].forEach(c => {
        c.send(JSON.stringify({
            online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
        }))
    })
    console.log("new connection sending")

    // simpler method to noify when a user is disconnected (advanced is using ping - pong (implemented))
    // connection.on("close", (connection) => {
    //     //notify to all clients about disconnected user(by sendling new list of connected users)
    //     [...wss.clients].forEach(c => {
    //         c.send(JSON.stringify({
    //             online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
    //         }))
    //     })
    // })
})
