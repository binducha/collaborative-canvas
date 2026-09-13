const socket = io();




socket.on("connect", function () {

    console.log("Socket connected successfully!");

    console.log("My socket ID:", socket.id);

});



socket.on("drawing-start", function (data) {

    remoteDrawingStart(data);

});



socket.on("drawing", function (data) {

    drawRemote(data);

});



socket.on("drawing-end", function (data) {

    remoteDrawingEnd(data);

});



socket.on("users-update", function (users) {

    updateOnlineUsers(users);

});

socket.on("cursor-move", function (data) {
    updateRemoteCursor(data);
});

socket.on("cursor-remove", function (data) {
    removeRemoteCursor(data.userId);
});
socket.on("drawing-state", function (data) {
    redrawCanvas(data.operations);
});

socket.on("history-update", function (data) {
    redrawCanvas(data.operations);
});