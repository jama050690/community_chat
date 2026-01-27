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

const BASE_URL = "/api/com_chat";

let typingTimeout = null;

document.addEventListener("DOMContentLoaded", async () => {
  // LOGIN CHECK
  if (!user && !window.location.pathname.includes("login")) {
    console.log("redirecting to: " + `${import.meta.env.BASE_URL}login`);
    window.location.href = `${import.meta.env.BASE_URL}login`;
    return;
  }

  if (whoAmI) whoAmI.textContent = user;

  if (userAvatar && avatar) {
    userAvatar.src = avatar;
  }

  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = `${import.meta.env.BASE_URL}login`;
  });

  // =========================
  // SOCKET.IO CHAT
  // =========================
  const server = io(BASE_URL);

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
    data.username = data.user;
    renderMsg(data);
    typing.textContent = "";
  });

  server.on("TYPING", (typingUser) => {
    console.log(typingUser, user, typingUser !== user);

    if (typingUser !== user) {
      typing.textContent = `${typingUser} yozmoqda...`;
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        typing.textContent = "";
      }, 1000);
    }
  });

  fetchMessageHistory();
});

/**
 * Message ni ekranga chiqarish
 * @param {} msg
 */
function renderMsg(msg) {
  const isOwnMessage = msg.username === user;

  const messageDiv = document.createElement("div");
  messageDiv.className = `flex ${isOwnMessage ? "justify-end" : "justify-start"}`;

  const bubbleWrapper = document.createElement("div");
  bubbleWrapper.className = `flex items-end gap-2 max-w-[80%] ${isOwnMessage ? "flex-row-reverse" : ""}`;

  // Avatar
  const avatarImg = document.createElement("img");
  avatarImg.src = msg.avatar || "/images/no_profile_picture.webp";
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
  username.textContent = msg.username;

  // Message text
  const text = document.createElement("p");
  text.className = "text-sm";
  text.textContent = msg.message;

  bubble.appendChild(username);
  bubble.appendChild(text);
  bubbleWrapper.appendChild(avatarImg);
  bubbleWrapper.appendChild(bubble);
  messageDiv.appendChild(bubbleWrapper);

  typing.textContent = "";
  messagesUL.appendChild(messageDiv);
  messagesUL.scrollTop = messagesUL.scrollHeight;
}

function fetchMessageHistory() {
  // messagesUL
  const messages = fetch(`${BASE_URL}/api/messages`)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      data.forEach((msg) => renderMsg(msg, msg.user));
    })
    .catch((err) => console.error(err));
}
