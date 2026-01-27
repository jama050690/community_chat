const form = document.getElementById("loginForm");
const avatar = document.getElementById("avatarPreview");
const password = document.getElementById("password");
const toggle = document.getElementById("togglePassword");
const avatarIconElement = document.getElementById("avatarIcon");
const profilePicInput = document.getElementById("profilePic");
const BASE_URL = "/api/com_chat";
// Rasmni preview qilish va localStorage ga saqlash
if (profilePicInput && avatar && avatarIconElement) {
  profilePicInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        // Preview ko'rsatish
        avatar.src = base64Image;
        avatar.classList.remove("hidden");
        avatarIconElement.classList.add("hidden");
        // localStorage ga saqlash
        localStorage.setItem("tempAvatar", base64Image);
      };
      reader.readAsDataURL(file);
    }
  });

  // Agar localStorage da rasm bo'lsa, uni ko'rsatish
  const savedAvatar = localStorage.getItem("tempAvatar");
  if (savedAvatar) {
    avatar.src = savedAvatar;
    avatar.classList.remove("hidden");
    avatarIconElement.classList.add("hidden");
  }
}

// parolni ko'rsatish / yashirish
if (toggle && password) {
  toggle.addEventListener("click", () => {
    const type =
      password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);
    toggle.classList.toggle("fa-eye-slash");
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Username va password kiritilishi shart!");
    return;
  }

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  // Agar rasm tanlangan bo'lsa, uni ham qo'shamiz
  const file = profilePicInput.files[0];
  if (file) {
    formData.append("profilePic", file);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login xatolik!");
      return;
    }

    // kerakli local storage o'zgaruvchilarni / foydalanuvchi ma`lumotlarni saqlash
    localStorage.setItem("app_user", data.user.username);
    if (data.user.avatar && data.user.avatar !== "null") {
      localStorage.setItem("app_avatar", `${BASE_URL}${data.user.avatar}`);
    } else {
      localStorage.removeItem("app_avatar");
    }
    // Vaqtinchalik avatarni o'chirish (endi serverdan kelgan avatar bor)
    localStorage.removeItem("tempAvatar");
    alert(`Xush kelibsiz, ${data.user.username}!`);
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
    alert("Server bilan bog'lanishda xatolik yuz berdi!");
  }
});
