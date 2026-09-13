# Collaborative Drawing Canvas — Architecture

## 1. Introduction

The Collaborative Drawing Canvas uses a client-server architecture.

The client runs in the browser and is responsible for the user interface and canvas drawing. The server is responsible for managing connected users, receiving drawing events, maintaining the drawing history, and sending updates to other users.

Socket.IO is used as the communication layer between the browser and the Node.js server.

A simple view of the application is:

```text
                    Collaborative Drawing Canvas
                              |
              +---------------+---------------+
              |                               |
              v                               v
          Client                         Node.js Server
        (Browser)                              |
              |                         +------+------+
              |                         |             |
              |                         v             v
              |                     rooms.js   drawing-state.js
              |                     Users       Drawing History
              |                         |             |
              +---------- Socket.IO -----+-------------+
```

## 2. Client Side

The client is divided into a few small JavaScript and frontend files. Each file has a specific responsibility.

### `index.html`

This file contains the main structure of the application.

It includes:

* Drawing canvas
* Brush button
* Eraser button
* Color picker
* Brush-size control
* Undo button
* Redo button
* Online users section

It also loads the Socket.IO client library and the JavaScript files used by the application.

### `style.css`

This file controls the basic appearance of the application.

It is responsible for things such as:

* Page layout
* Toolbar arrangement
* Button styling
* Canvas border
* Canvas size
* Online-user display

### `canvas.js`

Most of the drawing-related work happens in this file.

It handles:

* Starting a drawing
* Continuing a drawing
* Stopping a drawing
* Brush drawing
* Erasing
* Color selection
* Stroke size
* Drawing remote users' strokes
* Remote cursor display
* Canvas resizing
* Redrawing the stored drawing state

The file also keeps track of the previous mouse position so that a line can be drawn between two consecutive points.

### `websocket.js`

This file handles Socket.IO communication on the client side.

It listens for events coming from the server, such as:

```text
drawing-start
drawing
drawing-end
cursor-move
cursor-remove
users-update
drawing-state
history-update
```

It also receives the drawing state and asks the canvas code to redraw it.

### `main.js`

This file handles the online-users display.

When the server sends an updated user list, `main.js` updates the page with:

* Number of online users
* User name
* User color

## 3. Server Side

The server contains three main files.

### `server.js`

This is the main entry point of the backend.

It:

* Creates the Express application
* Creates the HTTP server
* Initializes Socket.IO
* Serves the client files
* Accepts new socket connections
* Receives drawing events
* Broadcasts drawing events
* Handles cursor updates
* Handles Undo and Redo
* Sends drawing state to new users
* Sends updated online-user information

The server acts as the central point through which the connected browsers communicate.

### `rooms.js`

Despite the filename, the current implementation mainly manages connected users rather than separate drawing rooms.

It stores information about connected users, including:

```text
id
number
name
color
```

For example:

```text
User 1 → Red
User 2 → Blue
User 3 → Green
```

When a user disconnects, that user is removed from the list.

### `drawing-state.js`

This file stores the drawing history on the server.

It maintains:

```text
operations
redoOperations
```

`operations` contains the currently active drawing operations.

`redoOperations` temporarily stores operations that were removed using Undo and can be restored using Redo.

## 4. Drawing Data Flow

When a user starts drawing, the browser sends a `drawing-start` event.

The basic flow is:

```text
User starts drawing
        |
        v
canvas.js
        |
        | drawing-start
        v
Socket.IO Server
        |
        | broadcast
        v
Other connected browsers
```

While the user moves the mouse, `drawing` events are sent.

When the mouse is released, a `drawing-end` event is sent.

The server also stores the completed stroke in its drawing history.

## 5. Drawing on the Local Browser

The local user does not wait for the server before seeing their own drawing.

When the mouse moves:

```text
Mouse movement
      |
      v
canvas.js
      |
      +----> Draw locally
      |
      +----> Send event to server
```

This makes the drawing feel immediate.

The previous mouse position is stored and the application draws a line from that position to the current position.

For example:

```text
Previous point
      |
      | line segment
      v
Current point
```

## 6. Remote Drawing

When another user draws, the server broadcasts the drawing information to the other clients.

The receiving client keeps track of the previous point belonging to that remote user.

For example:

```text
Remote User
     |
     | drawing event
     v
Server
     |
     | broadcast
     v
Other Browser
     |
     v
Draw line segment
```

The remote user's previous point is then updated to the newly received point.

## 7. Cursor Synchronization

The application also sends the cursor position while a user moves the mouse over the canvas.

The flow is:

```text
User moves cursor
       |
       v
canvas.js
       |
       | cursor-move
       v
Socket.IO Server
       |
       | broadcast
       v
Other Clients
       |
       v
Remote cursor displayed
```

The server adds the user's assigned color to the cursor information.

When a user disconnects, the server sends `cursor-remove` so the other clients can remove that user's cursor.

## 8. Online User Management

When a new user connects, `rooms.js` creates a user record.

The server then sends the complete user list to all connected clients using:

```text
users-update
```

The browser uses this information to update the online-users section.

The user number is also used to assign a display color.

## 9. New User Joining

When a new browser connects, it needs to know what has already been drawn.

The server sends the current drawing operations to the new client.

The process is:

```text
New Browser
     |
     | Socket.IO connection
     v
Server
     |
     +---- Add user
     |
     +---- Send users-update
     |
     +---- Send drawing-state
                 |
                 v
            New Browser
                 |
                 v
          redrawCanvas()
```

The new browser then recreates the canvas by drawing the stored operations one by one.

## 10. Drawing Operation Format

Each completed stroke is stored as one operation.

A simplified example is:

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

The `points` array contains the path of the stroke.

The other properties tell the client how that stroke should be rendered.

## 11. Undo and Redo

Undo and Redo are handled globally by the server.

This is important because the canvas is shared between all users. If one user performs Undo, the other users should see the same updated canvas.

### Undo

The flow is:

```text
User clicks Undo
       |
       v
Client sends "undo"
       |
       v
Server removes latest operation
       |
       v
Operation is placed in redoOperations
       |
       v
Server sends "history-update"
       |
       v
All clients redraw
```

### Redo

The flow is:

```text
User clicks Redo
       |
       v
Client sends "redo"
       |
       v
Server restores the latest redo operation
       |
       v
Operation returns to operations
       |
       v
Server sends "history-update"
       |
       v
All clients redraw
```

Because the server owns the drawing history, all connected browsers receive the same result.

## 12. WebSocket Protocol

The following Socket.IO events are used in the current implementation:

| Event                   | Direction                       | Purpose                         |
| ----------------------- | ------------------------------- | ------------------------------- |
| `drawing-start`         | Client → Server → Other Clients | Starts a stroke                 |
| `drawing`               | Client → Server → Other Clients | Sends drawing points            |
| `drawing-end`           | Client → Server → Other Clients | Finishes a stroke               |
| `cursor-move`           | Client → Server → Other Clients | Sends cursor position           |
| `cursor-remove`         | Server → Clients                | Removes a disconnected cursor   |
| `users-update`          | Server → Clients                | Updates online users            |
| `drawing-state`         | Server → Client                 | Sends stored drawing operations |
| `request-drawing-state` | Client → Server                 | Requests the current drawing    |
| `undo`                  | Client → Server                 | Requests Undo                   |
| `redo`                  | Client → Server                 | Requests Redo                   |
| `history-update`        | Server → Clients                | Sends the updated history       |

## 13. Canvas Rendering Strategy

The application uses the HTML5 Canvas API directly.

During normal drawing, the complete canvas is not cleared and redrawn for every mouse movement.

Instead, the application stores the previous point and draws only the new segment.

For example:

```text
Point 1 ---- Point 2 ---- Point 3 ---- Point 4
```

When the complete state has to be reconstructed, the canvas is cleared first and the stored operations are drawn again in order.

This approach is used for:

* New users joining
* Undo
* Redo
* Canvas restoration after resizing

## 14. Handling Overlapping Drawings

Two or more users can draw over the same area.

The application does not use a complicated distributed conflict-resolution algorithm.

Instead, every completed stroke is stored as an operation, and the rendering order determines which stroke appears on top.

For example:

```text
First stroke  → rendered first
Second stroke → rendered after it
                         ↓
                 appears on top
```

This is a simple approach suitable for the current project.

More advanced approaches such as CRDTs or Operational Transformation could be considered if the application were expanded into a larger collaborative system.

## 15. Performance Considerations

Drawing can generate many mouse events in a short period of time.

To avoid unnecessary full-canvas redraws during normal drawing, the application only draws the newly created line segment between two points.

The complete drawing history is stored as strokes rather than as a continuously changing screenshot of the canvas.

Full redraws are performed only when the application needs to reconstruct the shared state.

One limitation is that sending every drawing point individually can become expensive for very large numbers of users or very long drawings. Batching or compressing points would be a possible future improvement.

## 16. Current Limitations

The current architecture intentionally keeps the project simple.

Some limitations are:

* Drawing history exists only in server memory.
* Restarting the server removes the drawing history.
* There is no database persistence.
* There is no authentication.
* Separate drawing rooms are not implemented yet.
* Advanced conflict-resolution algorithms are not used.
* A very large drawing history can increase memory usage.
* The current drawing tool is mainly focused on freehand strokes.

## 17. Possible Scaling Approach

The current application uses a single Node.js server.

If the number of users becomes much larger, multiple server instances could be introduced.

A possible architecture would look like:

```text
                     Load Balancer
                          |
             +------------+------------+
             |            |            |
             v            v            v
         Server 1     Server 2     Server 3
             |            |            |
             +------------+------------+
                          |
                          v
                  Shared State Layer
                    /           \
                   v             v
                Redis         Database
```

A larger implementation could use Redis for sharing Socket.IO state between server instances and a database for persistent drawing data.

Other improvements could include:

* Room-based collaboration
* Event batching
* Data compression
* Authentication
* Persistent drawing storage
* Better handling of large drawing histories

## 18. Overall Architecture

The main responsibility of each part can be summarized as:

```text
                    Browser
                       |
              +--------+--------+
              |                 |
              v                 v
          Canvas UI        Socket.IO Client
              |                 |
              +--------+--------+
                       |
                       v
                Node.js Server
                       |
             +---------+---------+
             |                   |
             v                   v
         rooms.js        drawing-state.js
             |                   |
             v                   v
       User Management      Drawing History
             |                   |
             +---------+---------+
                       |
                       v
                Other Browsers
```

The browser handles the drawing interface, while the server keeps the shared information and coordinates communication between users.

## 19. Conclusion

The architecture was kept intentionally simple so that the real-time drawing flow is easy to understand and debug.

The main idea is:

```text
Browser
   |
   | Socket.IO events
   v
Node.js Server
   |
   +---- Connected Users
   |
   +---- Drawing History
   |
   +---- Undo / Redo
   |
   +---- Event Broadcasting
   |
   v
Other Browsers
```

This design is enough for the current assignment and also leaves room for future improvements such as persistent storage, separate rooms, batching, and support for multiple backend servers.
