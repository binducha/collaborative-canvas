const canvas = document.getElementById("drawingCanvas");

const ctx = canvas.getContext("2d");

const brushButton = document.getElementById("brushButton");
const eraserButton = document.getElementById("eraserButton");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");
const sizeValue = document.getElementById("sizeValue");

let isDrawing = false;

let currentTool = "brush";
let currentColor = "#000000";
let currentSize = 5;

let lastX = 0;
let lastY = 0;


// Stores the previous point of each remote user
const remoteUsers = {};
const remoteCursors = {};

// -----------------------------
// TOOL BUTTONS
// -----------------------------

brushButton.addEventListener("click", function () {

    currentTool = "brush";

});

eraserButton.addEventListener("click", function () {

    currentTool = "eraser";

});

colorPicker.addEventListener("input", function (event) {

    currentColor = event.target.value;

});

sizePicker.addEventListener("input", function (event) {

    currentSize = event.target.value;

    sizeValue.textContent = currentSize;

});


// -----------------------------
// MOUSE EVENTS
// -----------------------------

canvas.addEventListener("mousedown", startDrawing);

canvas.addEventListener("mousemove", draw);

canvas.addEventListener("mouseup", stopDrawing);

canvas.addEventListener("mouseout", stopDrawing);


// -----------------------------
// START DRAWING
// -----------------------------

function startDrawing(event) {

    isDrawing = true;

    lastX = event.offsetX;
    lastY = event.offsetY;

    drawPoint(
        lastX,
        lastY,
        currentColor,
        currentSize,
        currentTool
    );

    socket.emit("drawing-start", {

        x: lastX,
        y: lastY,
        color: currentColor,
        size: currentSize,
        tool: currentTool

    });

}


// -----------------------------
// DRAW
// -----------------------------

function draw(event) {

    if (!isDrawing) {
        return;
    }

    const x = event.offsetX;
    const y = event.offsetY;

    drawLine(
        lastX,
        lastY,
        x,
        y,
        currentColor,
        currentSize,
        currentTool
    );

    lastX = x;
    lastY = y;

    socket.emit("drawing", {

        x: x,
        y: y,
        color: currentColor,
        size: currentSize,
        tool: currentTool

    });

}


// -----------------------------
// STOP DRAWING
// -----------------------------

function stopDrawing() {

    if (!isDrawing) {
        return;
    }

    isDrawing = false;

    socket.emit("drawing-end");

}


// -----------------------------
// DRAW POINT
// -----------------------------

function drawPoint(x, y, color, size, tool) {

    if (tool === "brush") {

        ctx.globalCompositeOperation = "source-over";

        ctx.fillStyle = color;

    }

    if (tool === "eraser") {

        ctx.globalCompositeOperation = "destination-out";

    }

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        size / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// -----------------------------
// DRAW LINE
// -----------------------------

function drawLine(
    startX,
    startY,
    endX,
    endY,
    color,
    size,
    tool
) {

    if (tool === "brush") {

        ctx.globalCompositeOperation = "source-over";

        ctx.strokeStyle = color;

    }

    if (tool === "eraser") {

        ctx.globalCompositeOperation = "destination-out";

    }

    ctx.lineWidth = size;

    ctx.lineCap = "round";

    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(startX, startY);

    ctx.lineTo(endX, endY);

    ctx.stroke();

}


// -----------------------------
// REMOTE USER START
// -----------------------------

function remoteDrawingStart(data) {

    remoteUsers[data.userId] = {

        x: data.x,
        y: data.y

    };

    drawPoint(
        data.x,
        data.y,
        data.color,
        data.size,
        data.tool
    );

}


// -----------------------------
// REMOTE USER DRAW
// -----------------------------

function drawRemote(data) {

    const user = remoteUsers[data.userId];

    if (!user) {
        return;
    }

    drawLine(
        user.x,
        user.y,
        data.x,
        data.y,
        data.color,
        data.size,
        data.tool
    );

    user.x = data.x;
    user.y = data.y;

}


// -----------------------------
// REMOTE USER STOP
// -----------------------------

function remoteDrawingEnd(data) {

    delete remoteUsers[data.userId];

}

// -----------------------------
// REMOTE CURSOR
// -----------------------------

function updateRemoteCursor(data) {

    let cursor = remoteCursors[data.userId];

    if (!cursor) {

        cursor = document.createElement("div");

        cursor.style.position = "fixed";
        cursor.style.pointerEvents = "none";
        cursor.style.zIndex = "1000";
        cursor.style.fontSize = "24px";
        cursor.textContent = "●";

        document.body.appendChild(cursor);

        remoteCursors[data.userId] = cursor;
    }

    cursor.style.left = data.screenX + "px";
    cursor.style.top = data.screenY + "px";
    cursor.style.color = data.color;
}

function removeRemoteCursor(userId) {

    const cursor = remoteCursors[userId];

    if (cursor) {
        cursor.remove();
        delete remoteCursors[userId];
    }
}
canvas.addEventListener("mousemove", sendCursorPosition);

function sendCursorPosition(event) {

    socket.emit("cursor-move", {
        screenX: event.clientX,
        screenY: event.clientY
    });
}

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    socket.emit("request-drawing-state");
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

const undoButton = document.getElementById("undoButton");
const redoButton = document.getElementById("redoButton");

undoButton.addEventListener("click", function () {
    socket.emit("undo");
});

redoButton.addEventListener("click", function () {
    socket.emit("redo");
});



function redrawCanvas(operations) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    operations.forEach(function (operation) {

        const points = operation.points;

        if (points.length === 0) {
            return;
        }

        drawPoint(
            points[0].x,
            points[0].y,
            operation.color,
            operation.size,
            operation.tool
        );

        for (let i = 1; i < points.length; i++) {

            drawLine(
                points[i - 1].x,
                points[i - 1].y,
                points[i].x,
                points[i].y,
                operation.color,
                operation.size,
                operation.tool
            );
        }
    });
}