document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // LOGIN CHECK
    // =========================================================

    const savedUser = localStorage.getItem("shopnestUser");

    if (!savedUser) {
        window.location.href = "login.html";
        return;
    }


    let user;

    try {

        user = JSON.parse(savedUser);

    } catch (error) {

        console.error("Invalid user data:", error);

        localStorage.removeItem("shopnestUser");

        window.location.href = "login.html";

        return;
    }


    // =========================================================
    // HEADER ELEMENTS
    // =========================================================

    const profileButton =
        document.getElementById("profileButton");

    const profileDropdown =
        document.getElementById("profileDropdown");

    const headerProfileAvatar =
        document.getElementById("headerProfileAvatar");

    const headerProfileName =
        document.getElementById("headerProfileName");

    const dropdownAvatar =
        document.getElementById("dropdownAvatar");

    const dropdownOwnerName =
        document.getElementById("dropdownOwnerName");

    const dropdownUsername =
        document.getElementById("dropdownUsername");


    // =========================================================
    // PROFILE NAME
    // =========================================================

    const profileName =
        user.ownerName ||
        user.shopName ||
        user.phone ||
        "Profile";


    if (headerProfileName) {

        headerProfileName.textContent =
            profileName;

    }


    if (dropdownOwnerName) {

        dropdownOwnerName.textContent =
            profileName;

    }


    // =========================================================
    // USERNAME
    // =========================================================

    if (dropdownUsername) {

        if (user.username) {

            dropdownUsername.textContent =
                "@" + user.username;

        } else if (user.phone) {

            dropdownUsername.textContent =
                user.phone;

        } else {

            dropdownUsername.textContent =
                "";

        }

    }


    // =========================================================
    // PROFILE IMAGE
    // =========================================================

    function updateProfileImages() {

        if (
            user.shopPicture &&
            user.shopPicture.trim() !== ""
        ) {

            if (headerProfileAvatar) {

                headerProfileAvatar.innerHTML = `
                    <img
                        src="${user.shopPicture}"
                        alt="Profile"
                    >
                `;

            }


            if (dropdownAvatar) {

                dropdownAvatar.innerHTML = `
                    <img
                        src="${user.shopPicture}"
                        alt="Profile"
                    >
                `;

            }

        } else {

            if (headerProfileAvatar) {

                headerProfileAvatar.innerHTML = `
                    <i class="fa-regular fa-user"></i>
                `;

            }


            if (dropdownAvatar) {

                dropdownAvatar.innerHTML = `
                    <i class="fa-regular fa-user"></i>
                `;

            }

        }

    }


    updateProfileImages();


    // =========================================================
    // SHOP PROFILE
    // =========================================================

    updateShopProfile();


    function updateShopProfile() {

        const shopNameCheck =
            document.getElementById("shopNameCheck");

        const ownerNameCheck =
            document.getElementById("ownerNameCheck");

        const categoryCheck =
            document.getElementById("categoryCheck");

        const addressCheck =
            document.getElementById("addressCheck");

        const pictureCheck =
            document.getElementById("pictureCheck");

        const usernameCheck =
            document.getElementById("usernameCheck");


        const displayShopName =
            document.getElementById("displayShopName");

        const displayOwnerName =
            document.getElementById("displayOwnerName");

        const displayCategory =
            document.getElementById("displayCategory");

        const displayAddress =
            document.getElementById("displayAddress");

        const displayPicture =
            document.getElementById("displayPicture");

        const displayUsername =
            document.getElementById("displayUsername");


        // =====================================================
        // GET DATA
        // =====================================================

        const shopName =
            user.shopName || "";

        const ownerName =
            user.ownerName || "";

        const category =
            user.category || "";

        const address =
            user.shopAddress ||
            user.address ||
            "";

        const picture =
            user.shopPicture || "";

        const username =
            user.username || "";


        // =====================================================
        // DISPLAY DATA
        // =====================================================

        if (displayShopName) {

            displayShopName.textContent =
                shopName || "Not added";

        }


        if (displayOwnerName) {

            displayOwnerName.textContent =
                ownerName || "Not added";

        }


        if (displayCategory) {

            displayCategory.textContent =
                category || "Not added";

        }


        if (displayAddress) {

            displayAddress.textContent =
                address || "Not added";

        }


        if (displayPicture) {

            displayPicture.textContent =
                picture
                    ? "Uploaded"
                    : "Not uploaded";

        }


        if (displayUsername) {

            displayUsername.textContent =
                username
                    ? "@" + username
                    : "Not added";

        }


        // =====================================================
        // GREEN CHECKS
        // =====================================================

        setCheck(
            shopNameCheck,
            !!shopName
        );

        setCheck(
            ownerNameCheck,
            !!ownerName
        );

        setCheck(
            categoryCheck,
            !!category
        );

        setCheck(
            addressCheck,
            !!address
        );

        setCheck(
            pictureCheck,
            !!picture
        );

        setCheck(
            usernameCheck,
            !!username
        );


        // =====================================================
        // PROGRESS
        // =====================================================

        const completedFields = [

            shopName,
            ownerName,
            category,
            address,
            picture,
            username

        ];


        const completedCount =
            completedFields.filter(function (value) {

                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                );

            }).length;


        const totalFields = 6;


        const percentage =
            (completedCount / totalFields) * 100;


        const profileProgress =
            document.getElementById("profileProgress");

        const profileProgressText =
            document.getElementById("profileProgressText");


        if (profileProgress) {

            profileProgress.style.width =
                percentage + "%";

        }


        if (profileProgressText) {

            profileProgressText.textContent =
                `${completedCount}/${totalFields} Completed`;

        }


        // =====================================================
        // SHOP ICON
        // =====================================================

        const shopProfileIcon =
            document.getElementById("shopProfileIcon");


        if (shopProfileIcon && picture) {

            shopProfileIcon.innerHTML = `
                <img
                    src="${picture}"
                    alt="Shop"
                >
            `;

        }

    }


    // =========================================================
    // CHECK FUNCTION
    // =========================================================

    function setCheck(element, completed) {

        if (!element) {
            return;
        }


        if (completed) {

            element.classList.add("completed");

        } else {

            element.classList.remove("completed");

        }

    }


    // =========================================================
    // PROFILE DROPDOWN
    // =========================================================

    if (profileButton && profileDropdown) {

        profileButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                profileDropdown.classList.toggle("show");

            }
        );


        profileDropdown.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            function () {

                profileDropdown.classList.remove("show");

            }
        );

    }


    // =========================================================
    // MY PROFILE
    // =========================================================

    const myProfileBtn =
        document.getElementById("myProfileBtn");


    if (myProfileBtn) {

        myProfileBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "profile.html";

            }
        );

    }


    // =========================================================
    // SHOP PROFILE
    // =========================================================

    const shopProfileBtn =
        document.getElementById("shopProfileBtn");


    if (shopProfileBtn) {

        shopProfileBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "shopkeeper.html";

            }
        );

    }


    // =========================================================
    // SEE ALL
    // =========================================================

    const seeAllBtn =
        document.getElementById("seeAllBtn");


    if (seeAllBtn) {

        seeAllBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "shopkeeper.html";

            }
        );

    }


    // =========================================================
    // LOGOUT
    // =========================================================

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function () {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {
                    return;
                }


                localStorage.removeItem(
                    "shopnestUser"
                );


                window.location.href =
                    "login.html";

            }
        );

    }


    // =========================================================
    // WISHLIST
    // =========================================================

    const wishlistBtn =
        document.getElementById("wishlistBtn");


    if (wishlistBtn) {

        wishlistBtn.addEventListener(
            "click",
            function () {

                alert(
                    "Wishlist feature will be added soon."
                );

            }
        );

    }


    // =========================================================
    // CART
    // =========================================================

    const cartBtn =
        document.getElementById("cartBtn");


    if (cartBtn) {

        cartBtn.addEventListener(
            "click",
            function () {

                alert(
                    "Cart feature will be added soon."
                );

            }
        );

    }


    // =========================================================
    // SEARCH
    // =========================================================

    const searchInput =
        document.querySelector(
            ".search-box input"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    const searchText =
                        searchInput.value.trim();


                    if (searchText !== "") {

                        console.log(
                            "Searching for:",
                            searchText
                        );


                        alert(
                            "Product search will be connected with MongoDB soon."
                        );

                    }

                }

            }
        );

    }


    // =========================================================
    // VIEW ALL CATEGORY
    // =========================================================

    const viewAllButtons =
        document.querySelectorAll(
            ".section-title button"
        );


    viewAllButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                alert(
                    "All categories will be added soon."
                );

            }
        );

    });


    // =========================================================
    // PRODUCTS
    // =========================================================

    const productGrid =
        document.getElementById("productGrid");

    const emptyProducts =
        document.getElementById("emptyProducts");


    if (productGrid && emptyProducts) {

        /*
         * Abhi products hard-code nahi honge.
         *
         * Jab shopkeeper MongoDB me product add karega,
         * tab yahan API se products load karenge.
         */

        emptyProducts.style.display =
            "block";

    }


    // =========================================================
    // COMPLETE SHOP PROFILE MODAL
    // =========================================================

    const shopProfileModal =
        document.getElementById(
            "shopProfileModal"
        );


    const closeProfileForm =
        document.getElementById(
            "closeProfileForm"
        );


    const cancelProfileForm =
        document.getElementById(
            "cancelProfileForm"
        );


    /*
     * Agar future me Complete Profile
     * button add hota hai to ye IDs use
     * ki ja sakti hain.
     */

    const completeProfileButtons =
        document.querySelectorAll(
            "#completeProfileBtn, .complete-profile-btn"
        );


    completeProfileButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (shopProfileModal) {

                        shopProfileModal.classList.add(
                            "show"
                        );

                    }

                }
            );

        }
    );


    // =========================================================
    // CLOSE MODAL
    // =========================================================

    if (closeProfileForm) {

        closeProfileForm.addEventListener(
            "click",
            function () {

                if (shopProfileModal) {

                    shopProfileModal.classList.remove(
                        "show"
                    );

                }

            }
        );

    }


    if (cancelProfileForm) {

        cancelProfileForm.addEventListener(
            "click",
            function () {

                if (shopProfileModal) {

                    shopProfileModal.classList.remove(
                        "show"
                    );

                }

            }
        );

    }


    // =========================================================
    // SAVE SHOP PROFILE
    // =========================================================

    const saveProfileForm =
        document.getElementById(
            "saveProfileForm"
        );


    if (saveProfileForm) {

        saveProfileForm.addEventListener(
            "click",
            function () {

                /*
                 * IMPORTANT:
                 * Aapke home.html me Save Profile
                 * button type="button" hai.
                 *
                 * Isliye yahan "click" use kiya gaya hai,
                 * "submit" nahi.
                 */


                const latestSavedUser =
                    localStorage.getItem(
                        "shopnestUser"
                    );


                if (!latestSavedUser) {

                    alert(
                        "Please login first."
                    );


                    window.location.href =
                        "login.html";

                    return;

                }


                let currentUser;


                try {

                    currentUser =
                        JSON.parse(
                            latestSavedUser
                        );

                } catch (error) {

                    console.error(
                        "Invalid user data:",
                        error
                    );


                    localStorage.removeItem(
                        "shopnestUser"
                    );


                    window.location.href =
                        "login.html";

                    return;

                }


                // =================================================
                // DESCRIPTION
                // =================================================

                const descriptionInput =
                    document.getElementById(
                        "profileDescription"
                    );


                const description =
                    descriptionInput
                        ? descriptionInput.value.trim()
                        : "";


                // =================================================
                // PHONE
                // =================================================

                const phoneInput =
                    document.getElementById(
                        "profilePhone"
                    );


                const phone =
                    phoneInput
                        ? phoneInput.value.trim()
                        : "";


                // =================================================
                // WHATSAPP
                // =================================================

                const whatsappInput =
                    document.getElementById(
                        "profileWhatsapp"
                    );


                const whatsapp =
                    whatsappInput
                        ? whatsappInput.value.trim()
                        : "";


                // =================================================
                // SAVE TEXT INFORMATION
                // =================================================

                currentUser.description =
                    description;


                currentUser.phone =
                    phone;


                currentUser.whatsapp =
                    whatsapp;


                // =================================================
                // LOGO
                // =================================================

                const logoInput =
                    document.getElementById(
                        "profileLogo"
                    );


                /*
                 * Agar user ne logo select kiya hai
                 */

                if (
                    logoInput &&
                    logoInput.files &&
                    logoInput.files.length > 0
                ) {

                    const file =
                        logoInput.files[0];


                    /*
                     * File ko Base64/Data URL me
                     * convert kar rahe hain.
                     *
                     * Isse next page par bhi
                     * image display ho jayegi.
                     */

                    const reader =
                        new FileReader();


                    reader.onload =
                        function (event) {

                            currentUser.shopPicture =
                                event.target.result;


                            // Save complete user
                            localStorage.setItem(
                                "shopnestUser",
                                JSON.stringify(
                                    currentUser
                                )
                            );


                            // Update current page data
                            user =
                                currentUser;


                            // Success message
                            alert(
                                "Shop Profile Saved Successfully!"
                            );


                            /*
                             * IMPORTANT:
                             * Save ke baad directly
                             * shopkeeper.html open hoga.
                             */

                            window.location.href =
                                "shopkeeper.html";

                        };


                    reader.onerror =
                        function () {

                            alert(
                                "Logo upload failed. Please try again."
                            );

                        };


                    reader.readAsDataURL(
                        file
                    );


                } else {

                    /*
                     * Agar new logo select nahi kiya
                     * to purana logo preserve rahega.
                     */


                    localStorage.setItem(
                        "shopnestUser",
                        JSON.stringify(
                            currentUser
                        )
                    );


                    // Update current page data
                    user =
                        currentUser;


                    alert(
                        "Shop Profile Saved Successfully!"
                    );


                    /*
                     * IMPORTANT:
                     * Directly shopkeeper.html
                     */

                    window.location.href =
                        "shopkeeper.html";

                }

            }
        );

    }


    // =========================================================
    // END
    // =========================================================

});