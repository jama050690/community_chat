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

// const BASE_URL = "/api/com_chat";
const BASE_URL = import.meta.env.VITE_BASE_URL; //host
const BASE_PATH = import.meta.env.VITE_BASE_PATH; // portdan keyin url : production uchun muhim

// Online userlarni saqlash uchun Set
const onlineUsers = new Set();
let typingTimeout;

document.addEventListener("DOMContentLoaded", async () => {
  // LOGIN CHECK
  if (!user && !window.location.pathname.includes("login")) {
    console.log("redirecting to: " + `${BASE_PATH}login.html`);
    window.location.href = `${BASE_PATH}login.html`;
    return;
  }

  if (whoAmI) whoAmI.textContent = user;

  if (userAvatar && avatar) {
    userAvatar.src = avatar;
  }

  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = `${BASE_PATH}login.html`;
  });

  // =========================
  // SOCKET.IO CHAT
  // =========================

  const server = io(import.meta.env.VITE_BASE_URL, {
    path: import.meta.env.VITE_SOCKET_URL,
    // withCredentials: true,
  });
  console.log(`test socket url: ${BASE_URL}${import.meta.env.VITE_SOCKET_URL}`);

  // User online bo'lganini serverga xabar berish
  server.on("connect", () => {
    console.log("Socket ulandi! User:", user);
    server.emit("USER_ONLINE", user);
    onlineUsers.add(user); // O'zimizni ham qo'shamiz
    console.log("Online users:", Array.from(onlineUsers));
    renderOnlineUsers();
    updateMyStatus(true); // Online statusni yangilash
  });

  // Socket uzilganda
  server.on("disconnect", () => {
    console.log("Socket uzildi!");
    updateMyStatus(false); // Offline statusni yangilash
  });

  // Serverdan hozirgi online userlar ro'yxatini olish
  server.on("ONLINE_USERS_LIST", (users) => {
    users.forEach((u) => onlineUsers.add(u.username));
    renderOnlineUsers();
  });

  // Boshqa userlarning online/offline statusini kuzatish
  server.on("USER_STATUS_CHANGED", (data) => {
    console.log(
      `${data.username} ${data.online ? "online" : "offline"} bo'ldi`,
    );

    if (data.online) {
      onlineUsers.add(data.username);
    } else {
      onlineUsers.delete(data.username);
    }
    renderOnlineUsers();
  });

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
  //   loadOwnerStatus();
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

  const avatarImg = document.createElement("img");
  avatarImg.src = msg.avatar || "/images/no_profile_picture.webp";
  avatarImg.className = "w-8 h-8 rounded-full object-cover flex-shrink-0";

  const bubble = document.createElement("div");
  bubble.className = `px-4 py-2 rounded-2xl ${
    isOwnMessage
      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
      : "bg-white text-gray-800 shadow-md rounded-bl-md"
  }`;

  const username = document.createElement("p");
  username.className = `text-xs font-medium mb-1 ${isOwnMessage ? "text-indigo-200" : "text-indigo-600"}`;
  username.textContent = msg.username;

  const created = msg.createdAt || msg.created_at;
  const time = created
    ? new Date(created).toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const text = document.createElement("p");
  text.className = "text-sm";
  text.textContent = `${msg.message} ${time}`;

  bubble.appendChild(username);
  bubble.appendChild(text);
  bubbleWrapper.appendChild(avatarImg);
  bubbleWrapper.appendChild(bubble);
  messageDiv.appendChild(bubbleWrapper);

  typing.textContent = "";
  messagesUL.appendChild(messageDiv);
  messagesUL.scrollTop = messagesUL.scrollHeight;
}

// message time
function fetchMessageHistory() {
  fetch(`${BASE_URL}/api/messages`)
    .then((res) => res.json())
    .then((data) => {
      // console.log("FIRST MESSAGE:", data[0]);

      let date = null;

      const months = [
        "Yanvar",
        "Fevral",
        "Mart",
        "Mprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ];

      data.forEach((msg) => {
        const created = msg.createdAt || msg.created_at;
        const msgDate = new Date(created).toDateString();

        if (date !== msgDate) {
          date = msgDate;

          const d = new Date(created);
          const dateP = document.createElement("p");
          dateP.className =
            "text-center text-xs text-black my-2 rounded-2xl bg-grey-300";
          dateP.textContent = `${months[d.getMonth()]} ${d.getDate()}`;

          messagesUL.appendChild(dateP);
        }

        renderMsg(msg);
      });
    })
    .catch(console.error);
}

// ================= ONLINE USERS =================

// O'z statusini yangilash (header da)
function updateMyStatus(isOnline) {
  const statusEl = document.getElementById("myStatus");
  if (statusEl) {
    if (isOnline) {
      statusEl.textContent = "• online";
      statusEl.className = "text-green-300 text-xs ml-1";
    } else {
      statusEl.textContent = "• offline";
      statusEl.className = "text-red-300 text-xs ml-1";
    }
  }
}

// Online userlarni ekranga chiqarish
function renderOnlineUsers() {
  console.log("renderOnlineUsers chaqirildi, size:", onlineUsers.size);
  const container = document.getElementById("onlineUsers");
  if (!container) {
    console.log("onlineUsers container topilmadi!");
    return;
  }

  container.innerHTML = "";

  if (onlineUsers.size === 0) {
    container.innerHTML =
      '<span class="text-gray-400">Hech kim online emas</span>';
    return;
  }

  onlineUsers.forEach((username) => {
    const badge = document.createElement("span");
    badge.className = `inline-flex items-center gap-1 px-2 py-1 rounded-full ${
      username === user
        ? "bg-green-100 text-green-700"
        : "bg-indigo-100 text-indigo-700"
    }`;
    badge.innerHTML = `
      <span class="w-2 h-2 bg-green-500 rounded-full"></span>
      ${username}${username === user ? " (siz)" : ""}
    `;
    container.appendChild(badge);
  });
}

// ================= STATUS =================

// Vaqtni formatlash funksiyasi
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "hozirgina";
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 7) return `${diffDays} kun oldin`;

  return date.toLocaleDateString("uz-UZ");
}

// User statusini olish
async function getUserStatus(username) {
  try {
    const res = await fetch(`${BASE_URL}/api/users/${username}/status`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Status olishda xato:", err);
    return null;
  }
}

// O'z statusini ko'rsatish
async function loadOwnerStatus() {
  const status = await getUserStatus(user);
  const el = document.getElementById("ownerStatus");
  if (el && status) {
    el.textContent = status.online
      ? "online"
      : formatTime(status.lastOnlineTime);
  }
}

// Boshqa user statusini ko'rsatish
async function loadUserStatus(username) {
  const el = document.getElementById("chatStatus");
  if (!el) return;

  try {
    const status = await getUserStatus(username);

    if (!status || !status.lastOnlineTime) {
      el.textContent = "";
      return;
    }

    el.textContent = status.online
      ? "online"
      : formatTime(status.lastOnlineTime);
  } catch {
    el.textContent = "";
  }
}
