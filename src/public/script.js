const getById = (id) => {
  return document.getElementById(id);
};

const password = getById("password");
const confirmPassword = getById("confirm-password");
const form = getById("form");
const container = getById("container");
const loader = getById("loader");
const button = getById("submit");
const error = getById("error");
const success = getById("success");

container.style.display = "none";
error.style.display = "none";
success.style.display = "none";

let token, user;
const passwordRegEx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

window.addEventListener("DOMContentLoaded", async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  token = params.token;
  user = params.user;

  const res = await fetch("/auth/verifyToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      token,
      _id: user,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    loader.innerText = error.message || error;
    return;
  }

  loader.style.display = "none";
  container.style.display = "block";
});

const displayError = (errorText) => {
  success.style.display = "none";
  error.innerText = errorText;
  error.style.display = "block";
};

const displaySuccess = (successText) => {
  error.style.display = "none";
  success.innerText = successText;
  success.style.display = "block";
};

const submitHandler = async (e) => {
  e.preventDefault();

  const userPassword = password.value;

  if (!userPassword.trim()) {
    return displayError("Password is required");
  }
  if (!passwordRegEx.test(userPassword)) {
    return displayError(
      "Password Must Contain al teast 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character"
    );
  }

  if (userPassword !== confirmPassword.value) {
    return displayError("Passwords don't match");
  }

  button.disabled = true;
  button.innerText = "Please wait";

  const res = await fetch("/auth/password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      token,
      _id: user,
      password: userPassword,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    return displayError(error.message || error);
  }

  button.disabled = false;
  button.innerText = "Reset Password";

  password.value = "";
  confirmPassword.value = "";

  displaySuccess("Your password updated successfully");
};

form.addEventListener("submit", submitHandler);
