import "@css/main.css";
import { io } from "socket.io-client";

let id = null;

const server = io("http://localhost:3000");

const typing = document.getElementById("typing");
const messagesUL = document.getElementById("messages");
const messageInput = document.getElementById("message");

messageInput.onkeyup = (event) => {
  if (event.code === "Enter") {
    server.emit("NEW_MESSAGE", messageInput.value);

    messageInput.value = null;
  }
};

messageInput.onkeydown = () => server.emit("TYPING");

server.on("NEW_MESSAGE", (message) => {
  const li = document.createElement("LI");
  li.textContent = message;

  typing.textContent = null;

  messagesUL.appendChild(li);
});

server.on("TYPING", () => {
  typing.textContent = "Typing...";

  clearTimeout(id);

  id = setTimeout(() => {
    typing.textContent = "";
  }, 1_000);
});
