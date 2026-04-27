document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("auth-modal");
  const panel = document.getElementById("auth-modal-panel");
  const closeBtn = document.getElementById("auth-modal-close");

  const loginView = document.getElementById("login-view");
  const registerView = document.getElementById("register-view");

  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");

  const registerTitle = document.getElementById("register-title");
  const registerSubtitle = document.getElementById("register-subtitle");
  const registerTargetInput = document.getElementById("registration-target");
  const registerSubmitBtn = document.getElementById("register-submit-btn");

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  const loginError = document.getElementById("login-error");
  const registerError = document.getElementById("register-error");
  const registerSuccess = document.getElementById("register-success");

  const loginSubmitBtn = document.getElementById("login-submit-btn");

  const triggerButtons = document.querySelectorAll(".open-auth-modal");

  let redirectAfterAuth = "";

  if (!modal) return;

  function lockBody() {
    document.body.classList.add("overflow-hidden");
  }

  function unlockBody() {
    document.body.classList.remove("overflow-hidden");
  }

  function clearMessages() {
    if (loginError) {
      loginError.textContent = "";
      loginError.classList.add("hidden");
    }

    if (registerError) {
      registerError.textContent = "";
      registerError.classList.add("hidden");
    }

    if (registerSuccess) {
      registerSuccess.textContent = "";
      registerSuccess.classList.add("hidden");
    }
  }

  function showLoginError(message) {
    if (!loginError) return;
    loginError.textContent = message;
    loginError.classList.remove("hidden");
  }

  function showRegisterError(message) {
    if (!registerError) return;
    registerError.textContent = message;
    registerError.classList.remove("hidden");
  }

  function showRegisterSuccess(message) {
    if (!registerSuccess) return;
    registerSuccess.textContent = message;
    registerSuccess.classList.remove("hidden");
  }

  function showLoginMode() {
    clearMessages();
    loginView.classList.remove("hidden");
    registerView.classList.add("hidden");
  }

  function showRegisterMode(targetLabel = "") {
    clearMessages();
    loginView.classList.add("hidden");
    registerView.classList.remove("hidden");

    if (targetLabel) {
      registerTitle.textContent = "Register Now";
      registerSubtitle.textContent = `You are registering for: ${targetLabel}`;
      registerSubtitle.classList.remove("hidden");
      registerTargetInput.value = targetLabel;
      registerSubmitBtn.textContent = `Register for ${targetLabel}`;
    } else {
      registerTitle.textContent = "Register Now";
      registerSubtitle.textContent = "";
      registerSubtitle.classList.add("hidden");
      registerTargetInput.value = "";
      registerSubmitBtn.textContent = "Register";
    }
  }

  function openModal(mode = "login", targetLabel = "", redirectPath = "") {
    redirectAfterAuth = redirectPath || "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    lockBody();

    if (mode === "register") {
      showRegisterMode(targetLabel);
    } else {
      showLoginMode();
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    unlockBody();
    clearMessages();
  }

  window.TCMAuthModal = {
    open: openModal,
    close: closeModal,
  };

  triggerButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();

      const mode = this.dataset.modalMode || "login";
      const target = this.dataset.registrationTarget || "";
      const redirectPath = this.dataset.redirectAfterAuth || "";

      openModal(mode, target, redirectPath);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (switchToRegister) {
    switchToRegister.addEventListener("click", function () {
      showRegisterMode();
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener("click", function () {
      showLoginMode();
    });
  }

  modal.addEventListener("click", function (event) {
    if (!panel.contains(event.target)) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearMessages();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!email || !password) {
        showLoginError("Please enter your email and password.");
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = "Signing In...";

      try {
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          showLoginError(data.message || "Login failed.");
          return;
        }

        closeModal();
        window.location.href = redirectAfterAuth || window.location.pathname;
      } catch (error) {
        console.error("Login error:", error);
        showLoginError("Something went wrong. Please try again.");
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Sign In";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearMessages();

      const name = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value.trim();
      const confirmPassword = document.getElementById("register-confirm-password").value.trim();

      if (!name || !email || !password || !confirmPassword) {
        showRegisterError("Please fill in all fields.");
        return;
      }

      if (password !== confirmPassword) {
        showRegisterError("Passwords do not match.");
        return;
      }

      registerSubmitBtn.disabled = true;
      registerSubmitBtn.textContent = "Registering...";

      try {
        const response = await fetch("/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          showRegisterError(data.message || "Registration failed.");
          return;
        }

        showRegisterSuccess("Registration successful. Redirecting...");
        setTimeout(() => {
          closeModal();
          window.location.href = redirectAfterAuth || "/hub/courses";
        }, 800);
      } catch (error) {
        console.error("Signup error:", error);
        showRegisterError("Something went wrong. Please try again.");
      } finally {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = registerTargetInput.value
          ? `Register for ${registerTargetInput.value}`
          : "Register";
      }
    });
  }
});