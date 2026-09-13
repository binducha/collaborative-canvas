const users = {};
const userColors = [
    "#FF0000",
    "#0000FF",
    "#008000",
    "#800080",
    "#FF8C00",
    "#00A6A6"
];
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


function addUser(socketId) {
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
function removeUser(socketId) {
    if (users[socketId]) {
        delete users[socketId];
    }
}
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