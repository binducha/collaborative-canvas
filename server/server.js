const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const {
    addOperation,
    undo,
    redo,
    getOperations
} = require("./drawing-state");


const {
    addUser,
    removeUser,
    getAllUsers
} = require("./rooms");


const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;


// Serve the client folder
app.use(express.static(path.join(__dirname, "../client")));


io.on("connection", (socket) => {

    let currentStroke = [];

    // -----------------------------
// CURSOR POSITION
// -----------------------------

socket.on("cursor-move", function (data) {

    const user = getAllUsers().find(
        function (user) {
            return user.id === socket.id;
        }
    );

    if (!user) {
        return;
    }

    socket.broadcast.emit("cursor-move", {
        userId: socket.id,
        screenX: data.screenX,
        screenY: data.screenY,
        color: user.color
    });
});

    console.log("User connected:", socket.id);

    console.log("Current socket count:", io.sockets.sockets.size);
    // Add this socket as a user
    const user = addUser(socket.id);
    
    console.log("User added:", user);

    io.emit("users-update", getAllUsers());

    socket.emit("drawing-state", {
    operations: getOperations()
});

    


const currentUsers = getAllUsers();

console.log(
    "ONLINE USER COUNT:",
    currentUsers.length
);

console.log(
    "ONLINE USERS:",
    currentUsers
);

io.emit("users-update", currentUsers);


    // --------------------------------
    // DRAWING START
    // --------------------------------

socket.on("drawing-start", function (data) {

    currentStroke = [{
        x: data.x,
        y: data.y
    }];

    currentStroke.color = data.color;
    currentStroke.size = data.size;
    currentStroke.tool = data.tool;

    socket.broadcast.emit("drawing-start", {
        userId: socket.id,
        x: data.x,
        y: data.y,
        color: data.color,
        size: data.size,
        tool: data.tool
    });
});


    // --------------------------------
    // DRAWING
    // --------------------------------

     socket.on("drawing", function (data) {

    currentStroke.push({
        x: data.x,
        y: data.y
    });

    socket.broadcast.emit("drawing", {
        userId: socket.id,
        x: data.x,
        y: data.y,
        color: data.color,
        size: data.size,
        tool: data.tool
    });
});


    // --------------------------------
    // DRAWING END
    // --------------------------------

    socket.on("drawing-end", function () {

    if (currentStroke.length > 0) {

        addOperation({
            userId: socket.id,
            points: currentStroke,
            color: currentStroke.color,
            size: currentStroke.size,
            tool: currentStroke.tool
        });
    }

    currentStroke = [];

    socket.broadcast.emit("drawing-end", {
        userId: socket.id
    });
});

    socket.on("undo", function () {

    undo();

    io.emit("history-update", {
        operations: getOperations()
    });
});

    socket.on("redo", function () {

    redo();

    io.emit("history-update", {
        operations: getOperations()
    });
});


    // --------------------------------
    // DISCONNECT
    // --------------------------------

    socket.on("disconnect", () => {

        socket.broadcast.emit("cursor-remove", {
    userId: socket.id
});

        console.log("User disconnected:", socket.id);


        removeUser(socket.id);
        console.log("Current socket count:", io.sockets.sockets.size);
       
        const currentUsers = getAllUsers();

console.log(
    "ONLINE USER COUNT:",
    currentUsers.length
);

console.log(
    "ONLINE USERS:",
    currentUsers
);

io.emit("users-update", currentUsers);

    });


    socket.on("request-drawing-state", function () {

    socket.emit("drawing-state", {
        operations: getOperations()
    });

});

});


server.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});