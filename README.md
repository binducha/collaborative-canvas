# Collaborative Drawing Canvas

## About the Project

Collaborative Drawing Canvas is a web application that allows multiple users to draw on the same canvas at the same time.

The main idea behind this project is to make the drawing experience collaborative. When one user draws something, the other connected users can see the drawing almost immediately. Users can also see who is currently online and where the other users are moving their cursors.

The application was developed using HTML5 Canvas on the frontend and Node.js with Socket.IO on the backend.

## Features

The application currently provides the following features:

* Draw using a brush
* Erase parts of the drawing
* Choose different colors
* Change the brush size
* See other users' drawings in real time
* See the cursor position of other users
* View the list of currently connected users
* Automatically assign a name and color to each connected user
* Undo the latest drawing operation globally
* Redo an undone operation globally
* Send the existing canvas state to users who join later
* Restore the drawing when the canvas is resized

## Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* HTML5 Canvas API

### Backend

* Node.js
* Express.js
* Socket.IO

### Tools

* Visual Studio Code
* npm
* Git
* GitHub

No frontend framework such as React or Vue was used. The drawing functionality is also implemented directly using the Canvas API instead of using an external drawing library.

## Project Structure

```text
collaborative-canvas/
│
├── client/
│   ├── index.html
│   ├── style.css
│   ├── canvas.js
│   ├── websocket.js
│   └── main.js
│
├── server/
│   ├── server.js
│   ├── rooms.js
│   └── drawing-state.js
│
├── package.json
├── package-lock.json
├── README.md
└── ARCHITECTURE.md
```

## How It Works

The browser contains the canvas and the drawing controls. Whenever a user starts drawing or moves the mouse while drawing, the client sends the required information to the server through Socket.IO.

The server receives the event and sends it to the other connected users.

In simple terms, the flow is:

```text
User A
   |
   | Drawing event
   v
Node.js + Socket.IO Server
   |
   | Sends event to other users
   v
User B / User C / Other Users
```

The server also keeps the completed drawing operations in memory. Because of this, when a new user opens the application, the server can send the current drawing state to that user.

## Running the Project

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### 2. Open the project folder

```bash
cd collaborative-canvas
```

### 3. Install the required packages

```bash
npm install
```

### 4. Start the server

```bash
npm start
```

After the server starts, open:

```text
http://localhost:3000
```

in a browser.

## Development Mode

During development, the project can also be started using:

```bash
npm run dev
```

This uses Nodemon, so the Node.js server automatically restarts when server-side files are changed.

## Testing With Multiple Users

The easiest way to test the collaborative part is to open the application in two browser windows.

1. Start the server.
2. Open `http://localhost:3000`.
3. Open the same URL in another browser window or tab.
4. Draw something in the first window.
5. Check whether the drawing appears in the second window.
6. Move the mouse over the canvas and check the remote cursor.
7. Check the online-user list.
8. Try changing the color and brush size.
9. Test the eraser.
10. Click Undo and check whether the change is reflected in both windows.
11. Test Redo.
12. Open another window after something has already been drawn and check whether the existing drawing is loaded.

## Socket.IO Events

The application uses several Socket.IO events to communicate between the browser and server.

### Drawing

```text
drawing-start
drawing
drawing-end
```

These events are used while a user is creating a stroke.

### Cursor

```text
cursor-move
cursor-remove
```

These events are used to display and remove the cursors of other users.

### Users

```text
users-update
```

This keeps the online-user section updated.

### Drawing State

```text
drawing-state
request-drawing-state
```

These events are used when the current drawing needs to be sent or requested.

### Undo and Redo

```text
undo
redo
history-update
```

These events are used for the global drawing history.

## Undo and Redo

Undo and Redo are handled on the server instead of separately in each browser.

The server maintains two arrays:

```text
operations
redoOperations
```

When a user finishes a stroke, that stroke is added to `operations`.

When Undo is selected, the latest operation is removed from `operations` and placed into `redoOperations`.

When Redo is selected, the operation is moved back into `operations`.

After either action, the server sends the updated history to all connected users. Each client then redraws the canvas using the new operation list.

This means that Undo and Redo affect the shared canvas rather than only the browser where the button was clicked.

## Drawing State

Each completed stroke is stored as a drawing operation.

A simplified operation looks like this:

```javascript
{
    userId: "...",
    points: [
        { x: 100, y: 150 },
        { x: 105, y: 153 },
        { x: 110, y: 157 }
    ],
    color: "#000000",
    size: 5,
    tool: "brush"
}
```

The points represent the path followed by the mouse while the user was drawing.

When the canvas needs to be reconstructed, these stored operations are drawn again in their original order.

## Handling Multiple Users

Every connected Socket.IO client receives a unique socket ID.

The application also assigns each user:

* A user number
* A display name such as `User 1`
* A display color

For example:

```text
User 1 → Red
User 2 → Blue
User 3 → Green
```

The server keeps track of connected users in `rooms.js`.

## Performance Approach

Mouse movement can produce many events while someone is drawing. Instead of clearing and redrawing the complete canvas for every mouse movement, the application remembers the previous point and draws only the line between the previous point and the current point.

For example:

```text
Previous Point -------- Current Point
```

This keeps normal drawing more efficient.

The complete drawing history is redrawn only when it is actually required, such as when a new user joins, when Undo/Redo changes the history, or when the canvas needs to be restored.

## Conflict Handling

Multiple users can draw at the same time.

The server forwards drawing events to the other connected clients, and completed strokes are stored as separate operations.

If two users draw over the same area, the stroke that is rendered later appears on top of the earlier stroke.

This project uses this simple rendering order instead of implementing more advanced distributed algorithms such as CRDTs or Operational Transformation.

## Known Limitations

This project is mainly focused on demonstrating real-time collaborative drawing, so there are some limitations:

* Drawing history is stored only in server memory.
* Restarting the Node.js server clears the current drawing.
* There is no database used for storing drawings.
* There is no login or authentication system.
* Room-based drawing spaces have not been implemented yet.
* Very large drawing histories could require more memory and network data.
* Advanced conflict-resolution algorithms are not currently implemented.
* The application currently focuses on freehand drawing.

## Browser Compatibility

The application is intended for modern browsers that support HTML5 Canvas and WebSocket-based communication.

The project can be tested using:

* Google Chrome
* Mozilla Firefox
* Safari

## Time Spent

Approximately: `<ADD YOUR ACTUAL TIME HERE>`

## Possible Future Improvements

Some features that could be added later are:

* Saving drawings permanently
* User authentication
* Separate drawing rooms
* Rectangle, circle, and line tools
* Better handling of large drawing histories
* Batching drawing events
* Drawing-data compression
* More advanced conflict resolution
* Support for scaling the application across multiple servers

## Conclusion

This project was built to understand how real-time collaboration works in a browser-based application.

The main focus was not only on drawing with Canvas, but also on understanding how client events can be sent to a server and synchronized with multiple connected users using Socket.IO.
