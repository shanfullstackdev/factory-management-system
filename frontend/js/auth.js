const API = "http://localhost:5000/api";

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch(API + "/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message === "Login successful") {
      localStorage.setItem("admin", "true");
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("msg").innerText = data.message;
    }
  })
  .catch(() => {
    document.getElementById("msg").innerText = "Server error";
  });
}
