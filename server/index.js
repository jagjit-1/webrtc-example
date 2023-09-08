const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const dotenv = require("dotenv");
const cors = require("cors");
app.use(cors())
dotenv.config();
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        // frontend endpoint
        origin: "http://localhost:5173"
    }
});
app.use(express.json());

const rooms = {};
const users = {};
const { PORT } = process.env;

app.get("/meeting/users/:roomId", (req, res) => {
    const { roomId } = req.params;
    if (!roomId) return res.sendStatus(500)
    return res.status(200).json({ users: rooms[roomId]?.users || [], roomId });
})

io.on("connection", (socket) => {
    console.log("a user connected " + socket.id);
    // event on joining
    socket.on("join", (params) => {
        const roomId = params.roomId || "public";
        users[socket.id] = {
            roomId
        }
        if (!rooms[roomId]) {
            rooms[roomId] = {
                users: []
            }
        }
        if (rooms[roomId].users.find(e => e === socket.id)) return;
        rooms[roomId].users.push(socket.id);
        console.log(`user ${socket.id} joined room ${roomId}`);
    });

    socket.on("disconnect", () => {
        console.log("user left", socket.id)
        const { roomId } = users[socket.id] || {};
        if (!roomId) return
        rooms[roomId].users = rooms[roomId].users.filter(user => user !== socket.id);
        for (const user of rooms[roomId].users) {
            console.log("informing", user);
            socket.to(user).emit("userDisconnect", { sourceUser: socket.id });
        }
        delete users[socket.id];
    })


    // event on leaving
    // socket.on("disconnect", (params) => {
    //     const { roomId } = users[socket.id];
    //     rooms[roomId].users.filter(user => user !== socket.id);
    //     delete users[socket.id];
    // })

    // emit new user's local description to everyone
    socket.on("requestHandshake", ({ description, targetUser }) => {
        console.log("emitting request from ", socket.id, "to ", targetUser)
        socket.to(targetUser).emit("requestHandshake", {
            description: description,
            sourceUser: socket.id
        })


    })
    // emit remote description response to new user
    socket.on("acceptHandshake", ({ targetUser, description }) => {
        console.log("emitting accept from ", socket.id, "to ", targetUser)
        socket.to(targetUser).emit("acceptHandshake", {
            description,
            targetUser,
            sourceUser: socket.id
        });
    })

    socket.on("iceCandidate", ({ targetUser, candidate }) => {
        console.log("emitting candidate from ", socket.id, "to ", targetUser)
        socket.to(targetUser).emit("iceCandidate", {
            candidate,
            sourceUser: socket.id
        })

    });


    socket.on("iceCandidateReply", ({ targetUser, candidate }) => {
        console.log("emitting candidate reply from ", socket.id, "to ", targetUser)
        io.to(targetUser).emit("iceCandidateReply", {
            candidate,
            sourceUser: socket.id
        })

    });

});


server.listen(PORT, () => {
    console.log("Server started on", PORT);
})
