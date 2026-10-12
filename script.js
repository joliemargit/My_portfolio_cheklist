(function () {
  "use strict";

  function readUsers() {
    try {
      return JSON.parse(localStorage.getItem("portfolioUsers")) || {};
    } catch (e) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem("portfolioUsers", JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      return sessionStorage.getItem("portfolioCurrentUser");
    } catch (e) {
      return null;
    }
  }

  var currentUser = getCurrentUser();
  var authLink = document.getElementById("auth-link");

  if (currentUser && authLink) {
    authLink.textContent = "Logout";
    authLink.setAttribute("href", "index.html");
    authLink.removeAttribute("aria-current");
    authLink.addEventListener("click", function () {
      try {
        sessionStorage.removeItem("portfolioCurrentUser");
      } catch (e) {}
    });
  }

  var welcome = document.getElementById("welcome");
  if (currentUser && welcome) {
    welcome.textContent = "Welcome back, " + currentUser + "!";
    welcome.hidden = false;
  }

  function getErrorMessage(field) {
    var label = field.getAttribute("data-label") || "This field";
    var value = field.value.trim();

    if (!value) {
      return label + " is required.";
    }
    if (field.validity.typeMismatch && field.type === "email") {
      return "Please enter a valid email address, for example name@example.com.";
    }
    if (field.minLength > 0 && value.length < field.minLength) {
      return label + " must be at least " + field.minLength + " characters.";
    }
    if (field.id === "reg-confirm") {
      var password = document.getElementById("reg-password");
      if (password && field.value !== password.value) {
        return "Passwords do not match. Please type the same password again.";
      }
    }
    return "";
  }

  function showFieldError(field, message) {
    var errorBox = document.getElementById(field.id + "-error");
    if (!errorBox) return;

    if (message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
      field.setAttribute("aria-invalid", "true");
    } else {
      errorBox.textContent = "";
      errorBox.hidden = true;
      field.removeAttribute("aria-invalid");
    }
  }

  function validateForm(form) {
    var fields = form.querySelectorAll("[data-label]");
    var firstInvalid = null;

    fields.forEach(function (field) {
      var message = getErrorMessage(field);
      showFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function showStatus(type, message) {
    var box = document.getElementById("form-status");
    if (!box) return;
    box.className = "status is-" + type;
    box.textContent = message;
    box.hidden = false;
  }

  function hideStatus() {
    var box = document.getElementById("form-status");
    if (box) box.hidden = true;
  }

  function setBusy(form, busy, busyText) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (busy) {
      button.setAttribute("data-original-text", button.textContent);
      button.textContent = busyText;
      button.disabled = true;
    } else {
      button.textContent = button.getAttribute("data-original-text") || button.textContent;
      button.disabled = false;
    }
  }

  document.querySelectorAll("form[data-form] [data-label]").forEach(function (field) {
    field.addEventListener("input", function () {
      showFieldError(field, "");
      hideStatus();
    });
  });

  var handlers = {
    contact: function (form) {
      setBusy(form, true, "Sending...");
      showStatus("loading", "Sending your message...");
      setTimeout(function () {
        setBusy(form, false);
        showStatus("success", "Your message was sent. Thank you for contacting me!");
        form.reset();
      }, 1000);
    },

    login: function (form) {
      var username = form.elements.username.value.trim();
      var password = form.elements.password.value;

      setBusy(form, true, "Logging in...");
      showStatus("loading", "Checking your account...");

      setTimeout(function () {
        var users = readUsers();
        var key = username.toLowerCase();

        if (!users[key]) {
          setBusy(form, false);
          showStatus("error", "No account found with that username. Please register first.");
          return;
        }
        if (users[key].password !== password) {
          setBusy(form, false);
          showStatus("error", "Incorrect password. Please try again.");
          return;
        }

        try {
          sessionStorage.setItem("portfolioCurrentUser", users[key].username);
        } catch (e) {}
        showStatus("success", "Login successful. Taking you to the home page...");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 1200);
      }, 700);
    },

    register: function (form) {
      var username = form.elements.username.value.trim();
      var password = form.elements.password.value;

      setBusy(form, true, "Creating account...");
      showStatus("loading", "Creating your account...");

      setTimeout(function () {
        var users = readUsers();
        var key = username.toLowerCase();

        if (users[key]) {
          setBusy(form, false);
          showStatus("error", "That username is already taken. Please choose another one.");
          return;
        }

        try {
          users[key] = { username: username, password: password };
          saveUsers(users);
        } catch (e) {
          setBusy(form, false);
          showStatus("error", "Your browser blocked saving the account. Please turn off private mode and try again.");
          return;
        }

        showStatus("success", "Account created. Taking you to the login page...");
        setTimeout(function () {
          window.location.href = "login.html";
        }, 1200);
      }, 700);
    }
  };

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      hideStatus();

      if (!validateForm(form)) {
        showStatus("error", "Please fix the fields marked with an error and try again.");
        return;
      }
      handlers[form.getAttribute("data-form")](form);
    });
  });
})();