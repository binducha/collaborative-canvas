// Store currently connected users
const users = {};


// Colors available for users
const userColors = [
    "#FF0000",
    "#0000FF",
    "#008000",
    "#800080",
    "#FF8C00",
    "#00A6A6"
];


// Find the first available user number
function getAvailableUserNumber() {

    let number = 1;

    while (true) {

        const alreadyUsed = Object.values(users).some(
            function (user) {
                return user.number === number;
            }
        );

        if (!alreadyUsed) {
            return number;
        }

        number++;
    }
}


// Add a new user
function addUser(socketId) {

    // If this socket already exists,
    // don't create another user.
    if (users[socketId]) {

        return users[socketId];

    }


    const number = getAvailableUserNumber();


    const color =
        userColors[(number - 1) % userColors.length];


    const user = {

        id: socketId,

        number: number,

        name: `User ${number}`,

        color: color

    };


    users[socketId] = user;


    return user;
}


// Remove a user
function removeUser(socketId) {

    if (users[socketId]) {

        delete users[socketId];

    }

}


// Get all currently connected users
function getAllUsers() {
    return Object.values(users).sort(function (a, b) {
        return a.number - b.number;
    });
}


module.exports = {

    addUser,
    removeUser,
    getAllUsers

};