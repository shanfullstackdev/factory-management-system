const API = "http://localhost:5000/api";

function sendOtp() {
  const mobileInput = document.getElementById("mobile");
  const mobile = mobileInput.value.trim();
  const sendBtn = document.getElementById("sendOtpBtn");
  const msg = document.getElementById("msg");

  // Reset messages
  msg.innerText = "";
  msg.className = "";

  if (!mobile) {
    msg.innerText = "Please enter your mobile number";
    msg.className = "error-text";
    mobileInput.focus();
    return;
  }

  // Loading state
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending OTP...";

  fetch(`${API}/employee-auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        msg.innerText = data.message;
        msg.className = "success-text";

        // UI Transition
        sendBtn.style.display = "none";
        mobileInput.disabled = true;

        const otpSection = document.getElementById("otpSection");
        otpSection.style.display = "block";
        document.getElementById("otp").focus();
      }
    })
    .catch(err => {
      console.error(err);
      msg.innerText = "Failed to send OTP. Please try again.";
      msg.className = "error-text";
      sendBtn.disabled = false;
      sendBtn.textContent = "Send OTP";
    });
}

function verifyOtp() {
  const mobile = document.getElementById("mobile").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const verifyBtn = document.getElementById("verifyBtn");
  const msg = document.getElementById("msg");

  msg.innerText = "";
  msg.className = "";

  if (!otp) {
    msg.innerText = "Please enter the OTP";
    msg.className = "error-text";
    return;
  }

  // Loading state
  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying...";

  fetch(`${API}/employee-auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, otp })
  })
    .then(res => res.json())
    .then(data => {
      if (data.employeeId) {
        localStorage.setItem("employeeId", data.employeeId);
        localStorage.setItem("employeeName", data.name);
        localStorage.setItem("employeeRate", data.rate); // Store rate if available

        msg.innerText = "Login Successful! Redirecting...";
        msg.className = "success-text";

        setTimeout(() => {
          window.location.href = "employee-production.html";
        }, 1000);
      } else {
        msg.innerText = data.message || "Invalid OTP";
        msg.className = "error-text";
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify & Login";
      }
    })
    .catch(err => {
      console.error(err);
      msg.innerText = "Verification failed. Please try again.";
      msg.className = "error-text";
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify & Login";
    });
}

// Add Enter key support
document.getElementById("mobile").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendOtp();
  }
});

document.getElementById("otp").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    verifyOtp();
  }
});
// Expose functions globally for inline onclick
window.sendOtp = sendOtp;
window.verifyOtp = verifyOtp;
