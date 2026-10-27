/* =====================================================
   SHOPNEST SCRIPT.JS
===================================================== */


/* =====================================================
   ELEMENTS
===================================================== */

const loginBox = document.getElementById("loginBox");
const signupBox = document.getElementById("signupBox");
const homeBox = document.getElementById("homeBox");
const profileBox = document.getElementById("profileBox");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const userTypeBtn = document.getElementById("userTypeBtn");
const shopkeeperTypeBtn =
    document.getElementById("shopkeeperTypeBtn");

const userSignup = document.getElementById("userSignup");
const shopkeeperSignup =
    document.getElementById("shopkeeperSignup");


/* =====================================================
   LOGIN → SIGNUP
===================================================== */

showSignup.addEventListener("click", function (e) {

    e.preventDefault();

    loginBox.classList.add("hidden");
    homeBox.classList.add("hidden");
    profileBox.classList.add("hidden");

    signupBox.classList.remove("hidden");

});


/* =====================================================
   SIGNUP → LOGIN
===================================================== */

showLogin.addEventListener("click", function (e) {

    e.preventDefault();

    signupBox.classList.add("hidden");
    homeBox.classList.add("hidden");
    profileBox.classList.add("hidden");

    loginBox.classList.remove("hidden");

});


/* =====================================================
   USER / SHOPKEEPER SWITCH
===================================================== */

userTypeBtn.addEventListener("click", function () {

    userTypeBtn.classList.add("active");
    shopkeeperTypeBtn.classList.remove("active");

    userSignup.classList.remove("hidden");
    shopkeeperSignup.classList.add("hidden");

});


shopkeeperTypeBtn.addEventListener("click", function () {

    shopkeeperTypeBtn.classList.add("active");
    userTypeBtn.classList.remove("active");

    shopkeeperSignup.classList.remove("hidden");
    userSignup.classList.add("hidden");

});


/* =====================================================
   USER OTP - DEMO
===================================================== */

let demoOTP = null;


/* STEP 1 → SEND OTP */

const sendOtpBtn =
    document.getElementById("sendOtpBtn");


sendOtpBtn.addEventListener("click", function () {

    const phone =
        document.getElementById("userPhone").value.trim();


    if (!/^[0-9]{10}$/.test(phone)) {

        alert(
            "Please enter a valid 10 digit mobile number."
        );

        return;
    }


    demoOTP =
        Math.floor(
            100000 +
            Math.random() * 900000
        ).toString();


    console.log("Demo OTP:", demoOTP);


    document.getElementById("otpMessage").innerText =
        "Demo OTP: " + demoOTP;


    document
        .getElementById("userStep1")
        .classList.add("hidden");


    document
        .getElementById("userStep2")
        .classList.remove("hidden");

});


/* STEP 2 → VERIFY OTP */

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");


verifyOtpBtn.addEventListener("click", function () {

    const otp =
        document.getElementById("userOtp").value.trim();


    if (otp !== demoOTP) {

        alert(
            "Invalid OTP. Please try again."
        );

        return;
    }


    document
        .getElementById("userStep2")
        .classList.add("hidden");


    document
        .getElementById("userStep3")
        .classList.remove("hidden");

});


/* RESEND OTP */

const resendOtpBtn =
    document.getElementById("resendOtpBtn");


resendOtpBtn.addEventListener("click", function () {

    const phone =
        document.getElementById("userPhone").value.trim();


    if (!/^[0-9]{10}$/.test(phone)) {

        alert(
            "Please enter a valid mobile number."
        );

        return;
    }


    demoOTP =
        Math.floor(
            100000 +
            Math.random() * 900000
        ).toString();


    console.log(
        "New Demo OTP:",
        demoOTP
    );


    document.getElementById("otpMessage").innerText =
        "New OTP: " + demoOTP;

});


/* =====================================================
   USER LOCATION
===================================================== */

const getLocationBtn =
    document.getElementById("getLocationBtn");


getLocationBtn.addEventListener("click", function () {

    if (!navigator.geolocation) {

        alert(
            "Location is not supported by your browser."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            document.getElementById(
                "userLocation"
            ).value =
                `Lat: ${latitude}, Long: ${longitude}`;

        },

        function () {

            alert(
                "Unable to get location. Please enter it manually."
            );

        }

    );

});


/* LOCATION → LANGUAGE */

const locationNextBtn =
    document.getElementById("locationNextBtn");


locationNextBtn.addEventListener("click", function () {

    const location =
        document.getElementById(
            "userLocation"
        ).value.trim();


    if (!location) {

        alert(
            "Please enter your location."
        );

        return;
    }


    document
        .getElementById("userStep3")
        .classList.add("hidden");


    document
        .getElementById("userStep4")
        .classList.remove("hidden");

});


/* =====================================================
   USER SIGNUP → BACKEND → MONGODB → HOME
===================================================== */

const userSignupForm =
    document.getElementById("userSignupForm");


userSignupForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        const phone =
            document.getElementById(
                "userPhone"
            ).value.trim();


        const location =
            document.getElementById(
                "userLocation"
            ).value.trim();


        const language =
            document.getElementById(
                "userLanguage"
            ).value;


        if (
            !phone ||
            !location ||
            !language
        ) {

            alert(
                "Please complete all details."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/register/user",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            phone: phone,
                            location: location,
                            language: language
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "User registration failed."
                );

                return;
            }


            console.log(
                "User saved:",
                data
            );


            alert(
                "User account created successfully!"
            );


            window.location.href =
                "home.html";


        } catch (error) {

            console.error(
                "User Signup Error:",
                error
            );


            alert(
                "Backend server se connection nahi ho raha."
            );

        }

    }
);


/* =====================================================
   SHOP IMAGE PREVIEW
===================================================== */

const shopPicture =
    document.getElementById("shopPicture");


const shopImagePreview =
    document.getElementById(
        "shopImagePreview"
    );


shopPicture.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];


        if (!file) {

            shopImagePreview.innerHTML =
                "🏪";

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function (e) {

                shopImagePreview.innerHTML = `
                    <img
                        src="${e.target.result}"
                        alt="Shop Picture"
                    >
                `;

            };


        reader.readAsDataURL(file);

    }
);


/* =====================================================
   SHOPKEEPER LOCATION
===================================================== */

const shopLocationBtn =
    document.getElementById(
        "shopLocationBtn"
    );


shopLocationBtn.addEventListener(
    "click",
    function () {

        if (!navigator.geolocation) {

            alert(
                "Location is not supported by your browser."
            );

            return;
        }


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                document.getElementById(
                    "shopAddress"
                ).value =
                    `Latitude: ${latitude}, Longitude: ${longitude}`;

            },

            function () {

                alert(
                    "Unable to get location. Please enter address manually."
                );

            }

        );

    }
);


/* =====================================================
   SHOPKEEPER SIGNUP
   BACKEND → MONGODB
===================================================== */

const shopkeeperSignupForm =
    document.getElementById(
        "shopkeeperSignupForm"
    );


shopkeeperSignupForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        const ownerName =
            document.getElementById(
                "ownerName"
            ).value.trim();


        const shopName =
            document.getElementById(
                "shopName"
            ).value.trim();


        const username =
            document.getElementById(
                "shopUsername"
            ).value.trim();


        const password =
            document.getElementById(
                "shopPassword"
            ).value;


        const confirmPassword =
            document.getElementById(
                "shopConfirmPassword"
            ).value;


        const category =
            document.getElementById(
                "shopCategory"
            ).value;


        const shopAddress =
            document.getElementById(
                "shopAddress"
            ).value.trim();


        /* PASSWORD MATCH */

        if (
            password !==
            confirmPassword
        ) {

            alert(
                "Password and Confirm Password do not match."
            );

            return;
        }


        /* PASSWORD LENGTH */

        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;
        }


        /* REQUIRED FIELDS */

        if (
            !ownerName ||
            !shopName ||
            !username ||
            !password ||
            !category ||
            !shopAddress
        ) {

            alert(
                "Please fill all required details."
            );

            return;
        }


        /* =================================================
           CREATE FORMDATA
        ================================================= */

        const formData =
            new FormData();


        formData.append(
            "ownerName",
            ownerName
        );


        formData.append(
            "shopName",
            shopName
        );


        formData.append(
            "username",
            username
        );


        formData.append(
            "password",
            password
        );


        formData.append(
            "category",
            category
        );


        formData.append(
            "shopAddress",
            shopAddress
        );


        /* SHOP IMAGE */

        if (
            shopPicture &&
            shopPicture.files.length > 0
        ) {

            formData.append(
                "shopPicture",
                shopPicture.files[0]
            );

        }


        /* =================================================
           SEND DATA TO BACKEND
        ================================================= */

        try {

            console.log(
                "Sending shopkeeper data to backend..."
            );


            const response =
                await fetch(
                    "/api/register/shopkeeper",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            console.log(
                "Backend Response:",
                data
            );


            /* BACKEND ERROR */

            if (!response.ok) {

                alert(
                    data.message ||
                    "Shopkeeper registration failed."
                );

                return;
            }


            /* SUCCESS */

            alert(
                "Shop account created successfully!"
            );


            /* HOME PAGE */

            window.location.href =
                "home.html";


        } catch (error) {

            console.error(
                "Shopkeeper Signup Error:",
                error
            );


            alert(
                "Backend server se connection nahi ho raha. Please check server.js."
            );

        }

    }
);


/* =====================================================
   LOGIN → BACKEND
===================================================== */

const loginForm =
    document.getElementById(
        "loginForm"
    );


loginForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        const username =
            document.getElementById(
                "loginUsername"
            ).value.trim();


        const password =
            document.getElementById(
                "loginPassword"
            ).value;


        if (
            !username ||
            !password
        ) {

            alert(
                "Please enter username and password."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            console.log(
                "Login Response:",
                data
            );


            if (!response.ok) {

                alert(
                    data.message ||
                    "Login failed."
                );

                return;
            }


            /* SAVE LOGIN USER */

            localStorage.setItem(
                "shopnestUser",
                JSON.stringify(data.user)
            );


            alert(
                "Login successful!"
            );


            window.location.href =
                "home.html";


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            alert(
                "Backend server se connection nahi ho raha."
            );

        }

    }
);


/* =====================================================
   HOME BUTTONS
===================================================== */

const goHomeBtn =
    document.getElementById(
        "goHomeBtn"
    );


if (goHomeBtn) {

    goHomeBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "home.html";

        }
    );

}


const profileHomeBtn =
    document.getElementById(
        "profileHomeBtn"
    );


if (profileHomeBtn) {

    profileHomeBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "home.html";

        }
    );

}


/* =====================================================
   FORGOT PASSWORD
===================================================== */

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );


forgotPassword.addEventListener(
    "click",
    function (e) {

        e.preventDefault();

        alert(
            "Password reset feature will be connected with backend."
        );

    }
);