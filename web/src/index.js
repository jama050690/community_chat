import { io } from "socket.io-client";

const user = localStorage.getItem("app_user");
const avatar = localStorage.getItem("app_avatar");
const whoAmI = document.getElementById("whoAmI");
const userAvatar = document.getElementById("userAvatar");
const logoutBtn = document.getElementById("logout");

// Socket.IO elements
const typing = document.getElementById("typing");
const messagesUL = document.getElementById("messages");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

let typingTimeout = null;

document.addEventListener("DOMContentLoaded", async () => {
  // LOGIN CHECK
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  if (whoAmI) whoAmI.textContent = user;

  if (userAvatar) {
    userAvatar.src =
      avatar && avatar !== "null" && avatar !== "undefined"
        ? avatar
        : "https://via.placeholder.com/40";
  }

  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
  });

  // =========================
  // SOCKET.IO CHAT
  // =========================
  const server = io("http://localhost:3000");

  const sendMessage = () => {
    const msg = messageInput.value.trim();
    if (!msg) return;
    server.emit("NEW_MESSAGE", { user, message: msg, avatar });
    messageInput.value = "";
  };

  messageInput?.addEventListener("keyup", (event) => {
    if (event.code === "Enter") {
      sendMessage();
    }
  });

  messageInput?.addEventListener("keydown", () => {
    server.emit("TYPING", user);
  });

  sendBtn?.addEventListener("click", sendMessage);

  server.on("NEW_MESSAGE", (data) => {
    const isOwnMessage = data.user === user;

    const messageDiv = document.createElement("div");
    messageDiv.className = `flex ${isOwnMessage ? "justify-end" : "justify-start"}`;

    const bubbleWrapper = document.createElement("div");
    bubbleWrapper.className = `flex items-end gap-2 max-w-[80%] ${isOwnMessage ? "flex-row-reverse" : ""}`;

    // Avatar
    const avatarImg = document.createElement("img");
    avatarImg.src = data.avatar || "https://via.placeholder.com/32";
    avatarImg.className = "w-8 h-8 rounded-full object-cover flex-shrink-0";

    // Message bubble
    const bubble = document.createElement("div");
    bubble.className = `px-4 py-2 rounded-2xl ${
      isOwnMessage
        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
        : "bg-white text-gray-800 shadow-md rounded-bl-md"
    }`;

    // Username
    const username = document.createElement("p");
    username.className = `text-xs font-medium mb-1 ${isOwnMessage ? "text-indigo-200" : "text-indigo-600"}`;
    username.textContent = data.user;

    // Message text
    const text = document.createElement("p");
    text.className = "text-sm";
    text.textContent = data.message;

    bubble.appendChild(username);
    bubble.appendChild(text);
    bubbleWrapper.appendChild(avatarImg);
    bubbleWrapper.appendChild(bubble);
    messageDiv.appendChild(bubbleWrapper);

    typing.textContent = "";
    messagesUL.appendChild(messageDiv);
    messagesUL.scrollTop = messagesUL.scrollHeight;
  });

  server.on("TYPING", (typingUser) => {
    if (typingUser !== user) {
      typing.textContent = `${typingUser} yozmoqda...`;
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        typing.textContent = "";
      }, 1000);
    }
  });
});
