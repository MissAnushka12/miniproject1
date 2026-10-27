/* =====================================================
   SHOPNEST - SHOPKEEPER DASHBOARD
   File: shopkeeper.js
   ===================================================== */

const API = "/api";
const USER_KEY = "shopnestUser";

const $ = (id) => document.getElementById(id);

let currentUser = {};
let shopProfile = {};
let products = [];

let pendingLogoFile = null;
let pendingBannerFile = null;

let cropType = "logo";
let cropSourceImage = null;
let cropZoomValue = 1;
let cropOffsetX = 0;
let cropOffsetY = 0;
let cropBaseScale = 1;
let cropPointerStart = null;

let messageTimer = null;

/* =====================================================
   1. USER / SHOP ID
   ===================================================== */

try {
    currentUser = JSON.parse(
        localStorage.getItem(USER_KEY) || "{}"
    );
} catch (error) {
    currentUser = {};
}

const shopId =
    currentUser._id ||
    currentUser.id ||
    currentUser.shopkeeperId ||
    currentUser.shopkeeper?._id ||
    currentUser.shopkeeper?.id;

function getShopId() {
    return shopId;
}

/* =====================================================
   2. COMMON HELPERS
   ===================================================== */

async function request(url, options = {}) {
    const response = await fetch(url, options);

    const contentType =
        response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "object"
                ? data.message || data.error
                : data;

        throw new Error(
            message || `Request failed (${response.status})`
        );
    }

    return data;
}

function unwrapProfile(data) {
    return (
        data?.shopkeeper ||
        data?.profile ||
        data?.data?.shopkeeper ||
        data?.data?.profile ||
        data?.data ||
        data
    );
}

function showMessage(message, type = "success") {
    let box = $("shopMessage");

    if (!box) {
        box = document.createElement("div");
        box.id = "shopMessage";

        Object.assign(box.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "99999",
            padding: "12px 18px",
            borderRadius: "10px",
            color: "#fff",
            maxWidth: "min(360px, calc(100vw - 40px))",
            boxShadow: "0 5px 20px rgba(0,0,0,.15)",
            fontSize: "14px"
        });

        document.body.appendChild(box);
    }

    box.textContent = message;
    box.style.background =
        type === "error" ? "#dc2626" : "#15803d";
    box.style.display = "block";

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        box.style.display = "none";
    }, 3500);
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? "Not added"
                : String(value);
    }
}

function setValue(id, value) {
    const element = $(id);

    if (element) {
        element.value = value ?? "";
    }
}

function setImage(id, url) {
    const element = $(id);

    if (!element || !url) return;

    element.src = fileUrl(url);
    element.style.display = "block";
}

function fileUrl(path) {
    if (!path) return "";

    if (/^(https?:|data:|blob:)/i.test(path)) {
        return path;
    }

    if (path.startsWith("/")) {
        return path;
    }

    return `/${path}`;
}

function getProfileValue(...keys) {
    for (const key of keys) {
        if (
            shopProfile[key] !== undefined &&
            shopProfile[key] !== null
        ) {
            return shopProfile[key];
        }
    }

    return "";
}

function getModal(id) {
    return $(id);
}

function openModal(id) {
    const modal = getModal(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = getModal(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    const anyModalOpen = document.querySelector(
        ".modal.open, .modal.active"
    );

    if (!anyModalOpen) {
        document.body.classList.remove("modal-open");
    }
}

/* =====================================================
   3. LOAD AND RENDER SHOP PROFILE
   ===================================================== */

async function loadProfile() {
    if (!getShopId()) {
        showMessage(
            "Shop ID nahi mila. Please dobara login karo.",
            "error"
        );
        return;
    }

    try {
        const result = await request(
            `${API}/shopkeeper/${encodeURIComponent(getShopId())}`
        );

        shopProfile = unwrapProfile(result) || {};

        renderProfile(shopProfile);
    } catch (error) {
        console.error("Profile loading error:", error);

        showMessage(
            error.message || "Shop profile load nahi hua.",
            "error"
        );
    }
}

function renderProfile(shop) {
    if (!shop) return;

    const shopName = getProfileValue("shopName", "name");
    const username = getProfileValue("username");
    const ownerName = getProfileValue("ownerName");
    const category = getProfileValue("category");
    const address = getProfileValue("shopAddress", "address");
    const description = getProfileValue(
        "description",
        "shopDescription"
    );
    const phone = getProfileValue("phone");
    const whatsapp = getProfileValue("whatsapp");

    // Profile header
    setText("shopName", shopName || "Your Shop");
    setText(
        "username",
        username ? `@${username}` : "@username"
    );

    // Shop details
    setText("ownerName", ownerName);
    setText("category", category);
    setText("shopAddress", address);
    setText("shopDescription", description);
    setText("phone", phone);
    setText("whatsapp", whatsapp);

    // Profile detail username
    setText(
        "detailUsername",
        username ? `@${username}` : "@username"
    );

    // Profile statistics
    setText("postCount", shop.postCount ?? products.length);
    setText("followerCount", shop.followerCount ?? 0);
    setText("followingCount", shop.followingCount ?? 0);

    // Dashboard statistics
    setText("productCount", shop.productCount ?? products.length);
    setText("orderCount", shop.orderCount ?? 0);
    setText("salesCount", shop.salesCount ?? 0);
    setText("viewCount", shop.viewCount ?? 0);

    // Shop logo
    const logo = getProfileValue(
        "shopPicture",
        "shopLogo",
        "logo"
    );

    if (logo) {
        setImage("shopLogo", logo);
    }

    // Shop banner
    const banner = getProfileValue(
        "shopBanner",
        "banner",
        "bannerPicture",
        "coverImage"
    );

    if (banner) {
        setImage("shopBanner", banner);

        const bannerBackground = $("bannerBg");

        if (bannerBackground) {
            bannerBackground.style.backgroundImage =
                `url("${fileUrl(banner)}")`;

            bannerBackground.style.backgroundSize = "cover";
            bannerBackground.style.backgroundPosition = "center";
        }
    }

    // Fill edit profile form
    setValue("editShopName", shopName);
    setValue("editOwnerName", ownerName);
    setValue("editUsername", username);
    setValue("editCategory", category);
    setValue("editAddress", address);
    setValue("editDescription", description);
    setValue("editPhone", phone);
    setValue("editWhatsapp", whatsapp);
}

/* =====================================================
   4. EDIT PROFILE MODAL
   ===================================================== */

function openEditProfile() {
    renderProfile(shopProfile);
    openModal("editProfileModal");
}

function closeEditProfile() {
    closeModal("editProfileModal");
}

$("editProfileBtn")?.addEventListener(
    "click",
    openEditProfile
);

$("closeEditProfile")?.addEventListener(
    "click",
    closeEditProfile
);

$("cancelEditProfile")?.addEventListener(
    "click",
    closeEditProfile
);

$("editProfileModal")?.addEventListener("click", (event) => {
    if (event.target === $("editProfileModal")) {
        closeEditProfile();
    }
});

/* =====================================================
   5. IMAGE CROP EDITOR
   ===================================================== */

function getCropViewport() {
    return $("cropViewport");
}

function getCropImage() {
    return $("cropImage");
}

function getCropDimensions() {
    const viewport = getCropViewport();

    if (!viewport) {
        return { width: 0, height: 0 };
    }

    return {
        width: viewport.clientWidth,
        height: viewport.clientHeight
    };
}

function setCropMode(type) {
    cropType = type;

    const viewport = getCropViewport();

    if (viewport) {
        viewport.classList.toggle(
            "crop-circle",
            type === "logo"
        );

        viewport.classList.toggle(
            "crop-banner",
            type === "banner"
        );
    }

    $("cropLogoTab")?.classList.toggle(
        "active",
        type === "logo"
    );

    $("cropBannerTab")?.classList.toggle(
        "active",
        type === "banner"
    );

    const zoomInput = $("cropZoom");

    if (zoomInput) {
        zoomInput.min = "1";
        zoomInput.max = "3";
        zoomInput.step = "0.05";
        zoomInput.value = "1";
    }

    cropZoomValue = 1;
    cropOffsetX = 0;
    cropOffsetY = 0;

    updateCropImage();
}

function updateCropImage() {
    const image = getCropImage();
    const viewport = getCropViewport();

    if (!image || !viewport || !cropSourceImage) return;

    if (!image.naturalWidth || !image.naturalHeight) return;

    const { width, height } = getCropDimensions();

    if (!width || !height) return;

    cropBaseScale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight
    );

    const scale = cropBaseScale * cropZoomValue;

    const renderedWidth = image.naturalWidth * scale;
    const renderedHeight = image.naturalHeight * scale;

    // Keep the image covering the complete crop area.
    const minX = width - renderedWidth;
    const minY = height - renderedHeight;

    cropOffsetX = Math.min(
        0,
        Math.max(minX, cropOffsetX)
    );

    cropOffsetY = Math.min(
        0,
        Math.max(minY, cropOffsetY)
    );

    Object.assign(image.style, {
        position: "absolute",
        width: `${renderedWidth}px`,
        height: `${renderedHeight}px`,
        maxWidth: "none",
        maxHeight: "none",
        left: `${cropOffsetX}px`,
        top: `${cropOffsetY}px`,
        transform: "none",
        objectFit: "fill",
        userSelect: "none",
        pointerEvents: "none"
    });
}

function startCrop(file, type) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showMessage(
            "Please image file select karo.",
            "error"
        );
        return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        showMessage(
            "Image 5 MB se chhoti honi chahiye.",
            "error"
        );
        return;
    }

    cropType = type;

    const image = getCropImage();

    if (!image) {
        showMessage(
            "Crop editor HTML mein nahi mila.",
            "error"
        );
        return;
    }

    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
        cropSourceImage = image;

        cropZoomValue = 1;
        cropOffsetX = 0;
        cropOffsetY = 0;

        setCropMode(type);

        // Wait for the modal to become visible before measuring it.
        openModal("cropModal");

        requestAnimationFrame(() => {
            updateCropImage();
        });
    };

    image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        showMessage(
            "Image load nahi ho payi.",
            "error"
        );
    };

    image.src = objectUrl;
}

$("editLogo")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
        startCrop(file, "logo");
    }
});

$("editBanner")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
        startCrop(file, "banner");
    }
});

$("cropLogoTab")?.addEventListener("click", () => {
    setCropMode("logo");
});

$("cropBannerTab")?.addEventListener("click", () => {
    setCropMode("banner");
});

$("cropZoom")?.addEventListener("input", (event) => {
    cropZoomValue = Number(event.target.value) || 1;
    updateCropImage();
});

/* Drag image to reposition it inside the crop viewport. */

const cropViewport = getCropViewport();

cropViewport?.addEventListener("pointerdown", (event) => {
    if (!cropSourceImage) return;

    cropPointerStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offsetX: cropOffsetX,
        offsetY: cropOffsetY
    };

    cropViewport.setPointerCapture?.(event.pointerId);
});

cropViewport?.addEventListener("pointermove", (event) => {
    if (!cropPointerStart) return;

    cropOffsetX =
        cropPointerStart.offsetX +
        (event.clientX - cropPointerStart.x);

    cropOffsetY =
        cropPointerStart.offsetY +
        (event.clientY - cropPointerStart.y);

    updateCropImage();
});

function stopCropDrag() {
    cropPointerStart = null;
}

cropViewport?.addEventListener("pointerup", stopCropDrag);
cropViewport?.addEventListener("pointercancel", stopCropDrag);
cropViewport?.addEventListener(
    "lostpointercapture",
    stopCropDrag
);

/* Create a cropped image file from the visible crop area. */

function createCroppedFile() {
    return new Promise((resolve, reject) => {
        const image = getCropImage();
        const viewport = getCropViewport();

        if (!image || !viewport || !cropSourceImage) {
            reject(
                new Error("Crop image available nahi hai.")
            );
            return;
        }

        const { width, height } = getCropDimensions();

        if (!width || !height) {
            reject(
                new Error("Crop area ka size nahi mila.")
            );
            return;
        }

        const canvas = document.createElement("canvas");

        // High-resolution output
        const outputWidth = cropType === "logo" ? 600 : 1200;
        const outputHeight = cropType === "logo" ? 600 : 500;

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            reject(new Error("Canvas available nahi hai."));
            return;
        }

        context.drawImage(
            image,
            -cropOffsetX * (outputWidth / width),
            -cropOffsetY * (outputHeight / height),
            image.naturalWidth *
                cropBaseScale *
                cropZoomValue *
                (outputWidth / width),
            image.naturalHeight *
                cropBaseScale *
                cropZoomValue *
                (outputHeight / height)
        );

        const mimeType = "image/jpeg";

        canvas.toBlob((blob) => {
            if (!blob) {
                reject(
                    new Error("Cropped image create nahi hui.")
                );
                return;
            }

            const filename =
                cropType === "logo"
                    ? "shop-logo.jpg"
                    : "shop-banner.jpg";

            resolve(
                new File([blob], filename, {
                    type: mimeType,
                    lastModified: Date.now()
                })
            );
        }, mimeType, 0.92);
    });
}

function previewCroppedFile(file, type) {
    const url = URL.createObjectURL(file);

    if (type === "logo") {
        pendingLogoFile = file;
        setImage("shopLogo", url);
    } else {
        pendingBannerFile = file;
        setImage("shopBanner", url);

        const bannerBackground = $("bannerBg");

        if (bannerBackground) {
            bannerBackground.style.backgroundImage =
                `url("${url}")`;

            bannerBackground.style.backgroundSize = "cover";
            bannerBackground.style.backgroundPosition = "center";
        }
    }
}

$("applyCropBtn")?.addEventListener(
    "click",
    async () => {
        const button = $("applyCropBtn");

        try {
            if (button) {
                button.disabled = true;
                button.textContent = "Applying...";
            }

            const croppedFile = await createCroppedFile();

            previewCroppedFile(croppedFile, cropType);

            closeModal("cropModal");

            showMessage(
                cropType === "logo"
                    ? "Logo preview ready. Save Changes par click karo."
                    : "Banner preview ready. Save Changes par click karo."
            );
        } catch (error) {
            console.error("Crop error:", error);

            showMessage(
                error.message || "Crop failed.",
                "error"
            );
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Apply Crop";
            }
        }
    }
);

function closeCropEditor() {
    closeModal("cropModal");

    const image = getCropImage();

    if (image?.src?.startsWith("blob:")) {
        URL.revokeObjectURL(image.src);
    }

    cropSourceImage = null;
    cropPointerStart = null;
}

$("cancelCropBtn")?.addEventListener(
    "click",
    closeCropEditor
);

$("closeCropModal")?.addEventListener(
    "click",
    closeCropEditor
);

$("cropModal")?.addEventListener("click", (event) => {
    if (event.target === $("cropModal")) {
        closeCropEditor();
    }
});

/* =====================================================
   6. SAVE PROFILE + LOGO + BANNER
   ===================================================== */

$("editProfileForm")?.addEventListener(
    "submit",
    saveProfile
);

async function saveProfile(event) {
    event.preventDefault();

    if (!getShopId()) {
        showMessage(
            "Shop ID nahi mila. Please login karo.",
            "error"
        );
        return;
    }

    const button = $("saveProfileBtn");
    const originalText = button?.textContent || "Save Changes";

    const formData = new FormData();

    formData.append(
        "shopName",
        $("editShopName")?.value.trim() || ""
    );

    formData.append(
        "ownerName",
        $("editOwnerName")?.value.trim() || ""
    );

    formData.append(
        "username",
        $("editUsername")?.value.trim().replace(/^@/, "") || ""
    );

    formData.append(
        "category",
        $("editCategory")?.value || ""
    );

    formData.append(
        "shopAddress",
        $("editAddress")?.value.trim() || ""
    );

    formData.append(
        "description",
        $("editDescription")?.value.trim() || ""
    );

    formData.append(
        "phone",
        $("editPhone")?.value.trim() || ""
    );

    formData.append(
        "whatsapp",
        $("editWhatsapp")?.value.trim() || ""
    );

    // These names must match the backend Multer fields.
    if (pendingLogoFile) {
        formData.append("shopPicture", pendingLogoFile);
    }

    if (pendingBannerFile) {
        formData.append("shopBanner", pendingBannerFile);
    }

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Saving...";
        }

        const result = await request(
            `${API}/shopkeeper/${encodeURIComponent(getShopId())}`,
            {
                method: "PATCH",
                body: formData
            }
        );

        const updatedProfile = unwrapProfile(result);

        if (
            updatedProfile &&
            typeof updatedProfile === "object"
        ) {
            shopProfile = {
                ...shopProfile,
                ...updatedProfile
            };
        }

        // Update local session with returned profile fields.
        try {
            const storedUser = JSON.parse(
                localStorage.getItem(USER_KEY) || "{}"
            );

            const updatedUser = {
                ...storedUser,
                ...shopProfile
            };

            localStorage.setItem(
                USER_KEY,
                JSON.stringify(updatedUser)
            );
        } catch (error) {
            console.warn(
                "Could not update local session:",
                error
            );
        }

        pendingLogoFile = null;
        pendingBannerFile = null;

        closeEditProfile();

        await loadProfile();

        showMessage("Shop profile successfully updated!");
    } catch (error) {
        console.error("Save profile error:", error);

        showMessage(
            error.message ||
                "Profile save nahi hua. Backend route check karo.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

/* =====================================================
   7. ADD PRODUCT MODAL
   ===================================================== */

function openAddProductModal() {
    const form = $("addProductForm");

    form?.reset();

    openModal("addProductModal");
}

function closeAddProductModal() {
    closeModal("addProductModal");
}

$("addProductBtn")?.addEventListener(
    "click",
    openAddProductModal
);

$("addProductBtn2")?.addEventListener(
    "click",
    openAddProductModal
);

$("emptyAddProductBtn")?.addEventListener(
    "click",
    openAddProductModal
);

$("closeAddProduct")?.addEventListener(
    "click",
    closeAddProductModal
);

$("cancelAddProduct")?.addEventListener(
    "click",
    closeAddProductModal
);

$("addProductModal")?.addEventListener("click", (event) => {
    if (event.target === $("addProductModal")) {
        closeAddProductModal();
    }
});

/* =====================================================
   8. LOAD AND RENDER PRODUCTS
   ===================================================== */

async function loadProducts() {
    if (!getShopId()) return;

    try {
        const result = await request(
            `${API}/shopkeeper/${encodeURIComponent(getShopId())}/products`
        );

        const items = Array.isArray(result)
            ? result
            : result?.products ||
              result?.data?.products ||
              result?.data ||
              [];

        products = Array.isArray(items) ? items : [];

        renderProducts(products);

        setText("productCount", products.length);
        setText("postCount", products.length);
    } catch (error) {
        console.error("Products loading error:", error);

        products = [];
        renderProducts(products);
    }
}

function renderProducts(items) {
    const grid = $("productGrid");
    const emptyState = $("emptyProducts");

    if (!grid) {
        console.warn(
            "productGrid element HTML mein nahi mila."
        );
        return;
    }

    grid.replaceChildren();

    if (!items || items.length === 0) {
        if (emptyState) {
            emptyState.style.display = "block";
        }

        grid.style.display = "none";

        setText("productCount", 0);
        setText("postCount", 0);

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    grid.style.display = "grid";

    items.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const image = document.createElement("img");
        image.className = "product-image";

        image.alt =
            product.title ||
            product.productName ||
            "Product";

        const imagePath =
            product.productImage ||
            product.image ||
            product.imageUrl ||
            product.photo;

        if (imagePath) {
            image.src = fileUrl(imagePath);
        }

        const content = document.createElement("div");
        content.className = "product-info";

        const title = document.createElement("h3");

        title.textContent =
            product.title ||
            product.productName ||
            product.name ||
            "Untitled Product";

        const description = document.createElement("p");

        description.textContent =
            product.description ||
            "No description available";

        const price = document.createElement("p");
        price.className = "product-price";

        const amount = Number(product.price);

        price.textContent =
            Number.isFinite(amount)
                ? `₹${amount.toLocaleString("en-IN")}`
                : "Price not added";

        content.append(title, description, price);

        card.append(image, content);

        grid.appendChild(card);
    });

    setText("productCount", items.length);
    setText("postCount", items.length);
}

/* =====================================================
   9. SUBMIT NEW PRODUCT
   ===================================================== */

$("addProductForm")?.addEventListener(
    "submit",
    addProduct
);

async function addProduct(event) {
    event.preventDefault();

    if (!getShopId()) {
        showMessage("Please login again.", "error");
        return;
    }

    const button = $("saveProductBtn");
    const originalText = button?.textContent || "Save Product";

    const form = $("addProductForm");
    const imageInput = $("productImage");
    const imageFile = imageInput?.files?.[0];

    // Image is required.
    if (!imageFile) {
        showMessage(
            "Please select a product image.",
            "error"
        );

        imageInput?.focus();
        return;
    }

    // Validate file type.
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(imageFile.type)) {
        showMessage(
            "Please select a JPG, PNG, WEBP or GIF image.",
            "error"
        );
        return;
    }

    // Maximum upload size: 5 MB.
    if (imageFile.size > 5 * 1024 * 1024) {
        showMessage(
            "Image size must be 5 MB or smaller.",
            "error"
        );
        return;
    }

    const title = $("productTitle")?.value.trim() || "";
    const description =
        $("productDescription")?.value.trim() || "";
    const price = $("productPrice")?.value || "";
    const category = $("productCategory")?.value || "";

    if (!title || !description || price === "" || !category) {
        showMessage(
            "Please fill all product details.",
            "error"
        );
        return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        showMessage(
            "Please enter a valid product price.",
            "error"
        );
        return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);

    // IMPORTANT:
    // Must match upload.single("image") in server.js.
    formData.append("image", imageFile);

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Adding...";
        }

        const result = await request(
            `${API}/shopkeeper/${encodeURIComponent(getShopId())}/products`,
            {
                method: "POST",
                body: formData
            }
        );

        form?.reset();

        closeAddProductModal();

        await loadProducts();

        showMessage(
            result?.message || "Product successfully added!"
        );
    } catch (error) {
        console.error("Add product error:", error);

        showMessage(
            error.message ||
                "Product add nahi hua. Backend route check karo.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

/* =====================================================
   10. LOGOUT
   ===================================================== */

$("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    window.location.href = "login.html";
});

/* =====================================================
   11. ESCAPE KEY + RESPONSIVE CROP
   ===================================================== */

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeEditProfile();
    closeAddProductModal();
    closeCropEditor();
});

window.addEventListener("resize", () => {
    if (cropSourceImage) {
        updateCropImage();
    }
});

/* =====================================================
   12. INITIALIZE DASHBOARD
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadProducts();
});
