document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorBanner = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit-btn");
  const quickBtns = document.querySelectorAll(".quick-account-btn");

  function showError(msg) {
    if (!errorBanner) return;
    errorBanner.textContent = msg;
    errorBanner.classList.remove("hidden");
  }

  function clearError() {
    if (!errorBanner) return;
    errorBanner.textContent = "";
    errorBanner.classList.add("hidden");
  }

  // Check if session already exists
  const existingSid = localStorage.getItem("campusmate_sid") || sessionStorage.getItem("campusmate_sid");
  if (existingSid) {
    fetch(`/api/auth/me?sid=${encodeURIComponent(existingSid)}`, {
      headers: {
        "Authorization": `Bearer ${existingSid}`,
        "X-Session-ID": existingSid,
      },
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          const target = data.user.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
          window.location.href = `${target}?sid=${encodeURIComponent(existingSid)}`;
        } else {
          localStorage.removeItem("campusmate_sid");
          sessionStorage.removeItem("campusmate_sid");
          localStorage.removeItem("campusmate_user");
          sessionStorage.removeItem("campusmate_user");
        }
      })
      .catch(() => {
        localStorage.removeItem("campusmate_sid");
        sessionStorage.removeItem("campusmate_sid");
      });
  }

  async function performLogin(identifier, password) {
    clearError();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying Credentials...";
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: identifier, identifier, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showError(data.error || "Authentication failed. Please verify institutional email/roll number and password.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign In to Dashboard";
        }
        return;
      }

      // Persist session tokens to survive iframe cookie blocking
      if (data.sid) {
        localStorage.setItem("campusmate_sid", data.sid);
        sessionStorage.setItem("campusmate_sid", data.sid);
      }
      if (data.user) {
        localStorage.setItem("campusmate_user", JSON.stringify(data.user));
        sessionStorage.setItem("campusmate_user", JSON.stringify(data.user));
      }

      const redirectPath = data.redirect || "/student/dashboard";
      const redirectUrl = data.sid ? `${redirectPath}?sid=${encodeURIComponent(data.sid)}` : redirectPath;
      window.location.href = redirectUrl;
    } catch (err) {
      showError("Connection error. Ensure server is online.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In to Dashboard";
      }
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const identifier = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      if (!identifier || !password) {
        showError("Please enter your email / roll number and password .");
        return;
      }
      performLogin(identifier, password);
    });
  }

  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-email");
      const pass = btn.getAttribute("data-pass");
      if (emailInput) emailInput.value = email;
      if (passwordInput) passwordInput.value = pass;
      performLogin(email, pass);
    });
  });
});
