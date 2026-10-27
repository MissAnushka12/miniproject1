// ========================================
// SHOPNEST - LOGIN.JS
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:8081/api/login";

    // Login form: loginForm ID preferred
    const loginForm =
        document.getElementById("loginForm") ||
        document.querySelector("form");

    if (!loginForm) {
        console.error("Login form nahi mila. login.html check karo.");
        return;
    }

    // Username / phone input
    const usernameInput =
        loginForm.querySelector(
            '#username, #loginUsername, #phone, #loginPhone, [name="username"], [name="phone"]'
        );

    // Password input
    const passwordInput =
        loginForm.querySelector(
            '#password, #loginPassword, [name="password"]'
        );

    // Show messages
    let messageBox = document.getElementById("loginMessage");

    if (!messageBox) {
        messageBox = document.createElement("p");
        messageBox.id = "loginMessage";
        messageBox.setAttribute("role", "status");
        messageBox.style.marginTop = "12px";
        messageBox.style.fontSize = "14px";
        loginForm.appendChild(messageBox);
    }

    function showMessage(message, isError = true) {
        messageBox.textContent = message;
        messageBox.style.color = isError ? "#d93025" : "#188038";
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!usernameInput || !passwordInput) {
            showMessage(
                "Username/phone aur password fields ke IDs check karo."
            );
            console.error("Login input fields nahi mile.");
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showMessage("Username/phone aur password dono bharo.");
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        showMessage("Login ho raha hai...", false);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.user) {
                throw new Error(
                    data.message || "Login nahi ho paya."
                );
            }

            // Har login par current account ka data save karo
            localStorage.setItem(
                "shopnestUser",
                JSON.stringify(data.user)
            );

            showMessage("Login successful! Redirect ho raha hai...", false);

            // Role ke hisaab se page open karo
            if (data.user.role === "shopkeeper") {
                window.location.href = "shopkeeper.html";
            } else if (data.user.role === "user") {
                window.location.href = "home.html";
            } else {
                localStorage.removeItem("shopnestUser");
                showMessage("Account role valid nahi hai.");
            }

        } catch (error) {
            console.error("ShopNest login error:", error);

            if (error instanceof TypeError) {
                showMessage(
                    "Server se connection nahi ho raha. Backend aur MongoDB check karo."
                );
            } else {
                showMessage(error.message || "Login mein error aaya.");
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
});