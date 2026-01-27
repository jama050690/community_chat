import "./style.css";
const BASE_URL = import.meta.env.VITE_BASE_URL; //host
const BASE_PATH = import.meta.env.VITE_BASE_PATH; // portdan keyin url : production uchun muhim

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const togglePassword = document.getElementById("togglePassword");
  const password = document.getElementById("password");
  const fileInput = document.getElementById("profilePic");
  const preview = document.getElementById("avatarPreview");
  const icon = document.getElementById("avatarIcon");

  // parolni ko'rsatish / yashirish
  if (togglePassword && password) {
    togglePassword.addEventListener("click", () => {
      const type =
        password.getAttribute("type") === "password" ? "text" : "password";
      password.setAttribute("type", type);
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }

  // avatar preview
  if (fileInput && preview && icon) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        preview.src = reader.result;
        preview.classList.remove("hidden");
        icon.classList.add("hidden");
        localStorage.setItem("app_avatar", reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // signup form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    if (
      !data.username ||
      !data.email ||
      !data.password ||
      !data.age ||
      !data.gender
    ) {
      alert("Barcha maydonlar to'ldirilishi kerak!");
      return;
    }

    data.gender = data.gender == "male";

    try {
      const res = await fetch(`${BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          age: data.age,
          gender: data.gender,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Signup xatolik!");
        return;
      }

      // agar avatar localStorage da bo'lsa, saqlash mumkin
      if (localStorage.getItem("app_avatar")) {
        localStorage.setItem("app_avatar", localStorage.getItem("app_avatar"));
      }

      alert(`Xush kelibsiz, ${result.user.username}!`);
      window.location.href = `${BASE_PATH}login`;
    } catch (err) {
      console.error(err);
      alert("Server bilan bog'lanishda xatolik yuz berdi!");
    }
  });
});
