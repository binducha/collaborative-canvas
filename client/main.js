const onlineUsers = document.getElementById("onlineUsers");
function updateOnlineUsers(users) {
    onlineUsers.innerHTML = "";
    const title = document.createElement("strong");
    title.textContent = `Online Users: ${users.length}`;
    onlineUsers.appendChild(title);
    users.forEach(function (user) {
        const userElement = document.createElement("div");
        userElement.textContent =
            `● ${user.name}`;
        userElement.style.color = user.color;
        onlineUsers.appendChild(userElement);
    });
}