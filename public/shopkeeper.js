
/* =====================================================
   SHOPNEST - SHOPKEEPER DASHBOARD
   File: shopkeeper.js
   Fixed: Banner crop, drag, zoom, preview and save
   ===================================================== */

"use strict";

const API = "/api";
const USER_KEY = "shopnestUser";

const $ = (id) => document.getElementById(id);

let currentUser = {};
let shopProfile = {};
let products = [];

let pendingLogoFile = null;
let pendingBannerFile = null;

let pendingLogoPreviewUrl = null;
let pendingBannerPreviewUrl = null;
let cropObjectUrl = null;

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

function getShopId() {
    return (
        currentUser._id ||
        currentUser.id ||
        currentUser.shopkeeperId ||
        currentUser.shopkeeper?._id ||
        currentUser.shopkeeper?.id ||
        shopProfile._id ||
        shopProfile.id ||
        null
    );
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

    if (!element) return;

    element.textContent =
        value === undefined ||
        value === null ||
        value === ""
            ? "Not added"
            : String(value);
}

function setValue(id, value) {
    const element = $(id);

    if (element) {
        element.value = value ?? "";
    }
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

function setImage(id, url) {
    const element = $(id);

    if (!element || !url) return;

    element.src = fileUrl(url);
    element.style.display = "block";
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

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.open, .modal.active")) {
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

    // Use the latest profile object.
    shopProfile = { ...shopProfile, ...shop };

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

    setText("shopName", shopName || "Your Shop");
    setText("username", username ? `@${username}` : "@username");

    setText("ownerName", ownerName);
    setText("category", category);
    setText("shopAddress", address);
    setText("shopDescription", description);
    setText("phone", phone);
    setText("whatsapp", whatsapp);

    setText(
        "detailUsername",
        username ? `@${username}` : "@username"
    );

    setText("postCount", shop.postCount ?? products.length);
    setText("followerCount", shop.followerCount ?? 0);
    setText("followingCount", shop.followingCount ?? 0);

    setText("productCount", shop.productCount ?? products.length);
    setText("orderCount", shop.orderCount ?? 0);
    setText("salesCount", shop.salesCount ?? 0);
    setText("viewCount", shop.viewCount ?? 0);

    // Logo
    const logo = getProfileValue(
        "shopPicture",
        "shopLogo",
        "logo"
    );

    if (logo) {
        setImage("shopLogo", logo);
    }

    // FIX: Render the banner only as a background.
    // Do not display the hidden #shopBanner image on the dashboard.
    const banner = getProfileValue(
        "shopBanner",
        "banner",
        "bannerPicture",
        "coverImage"
    );

    const bannerBackground = $("bannerBg");
    const bannerImage = $("shopBanner");

    if (banner) {
        const bannerURL = fileUrl(banner);

        if (bannerImage) {
            bannerImage.src = bannerURL;
            bannerImage.hidden = true;
            bannerImage.style.display = "none";
        }

        if (bannerBackground) {
            bannerBackground.style.backgroundImage =
                `url("${bannerURL}")`;

            bannerBackground.style.backgroundSize = "cover";
            bannerBackground.style.backgroundPosition = "center";
            bannerBackground.style.backgroundRepeat = "no-repeat";
        }
    } else if (bannerBackground) {
        bannerBackground.style.backgroundImage = "none";
    }

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

$("editProfileBtn")?.addEventListener("click", openEditProfile);
$("closeEditProfile")?.addEventListener("click", closeEditProfile);
$("cancelEditProfile")?.addEventListener("click", closeEditProfile);

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

    $("cropLogoTab")?.classList.toggle("active", type === "logo");
    $("cropBannerTab")?.classList.toggle("active", type === "banner");

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

    if (width <= 0 || height <= 0) return;

    // Cover the full crop viewport without empty space.
    cropBaseScale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight
    );

    const scale = cropBaseScale * cropZoomValue;

    const renderedWidth = image.naturalWidth * scale;
    const renderedHeight = image.naturalHeight * scale;

    // Image offsets are negative when the image is moved left/up.
    const minX = width - renderedWidth;
    const minY = height - renderedHeight;

    cropOffsetX = Math.min(0, Math.max(minX, cropOffsetX));
    cropOffsetY = Math.min(0, Math.max(minY, cropOffsetY));

    Object.assign(image.style, {
        position: "absolute",
        display: "block",
        width: `${renderedWidth}px`,
        height: `${renderedHeight}px`,
        maxWidth: "none",
        maxHeight: "none",
        margin: "0",
        padding: "0",
        border: "0",
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
        showMessage("Please image file select karo.", "error");
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

    const image = getCropImage();

    if (!image) {
        showMessage(
            "Crop editor HTML mein nahi mila.",
            "error"
        );
        return;
    }

    // Revoke the previous crop source URL, if any.
    if (cropObjectUrl) {
        URL.revokeObjectURL(cropObjectUrl);
        cropObjectUrl = null;
    }

    cropType = type;
    cropSourceImage = null;
    cropPointerStart = null;

    const objectUrl = URL.createObjectURL(file);
    cropObjectUrl = objectUrl;

    image.onload = () => {
        cropSourceImage = image;

        cropZoomValue = 1;
        cropOffsetX = 0;
        cropOffsetY = 0;

        // Open first so the crop viewport has measurable dimensions.
        setCropMode(type);
        openModal("cropModal");

        requestAnimationFrame(() => {
            updateCropImage();
        });
    };

    image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        if (cropObjectUrl === objectUrl) {
            cropObjectUrl = null;
        }

        cropSourceImage = null;

        showMessage("Image load nahi ho payi.", "error");
    };

    image.src = objectUrl;
}

$("editLogo")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
        startCrop(file, "logo");
    }

    // Allow selecting the same file again.
    event.target.value = "";
});

$("editBanner")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
        startCrop(file, "banner");
    }

    event.target.value = "";
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

/* =====================================================
   5.1 DRAG IMAGE
   ===================================================== */

const cropViewport = getCropViewport();

cropViewport?.addEventListener("pointerdown", (event) => {
    if (!cropSourceImage) return;

    if (event.button !== undefined && event.button !== 0) {
        return;
    }

    event.preventDefault();

    cropPointerStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offsetX: cropOffsetX,
        offsetY: cropOffsetY
    };

    try {
        cropViewport.setPointerCapture(event.pointerId);
    } catch (error) {
        // Pointer capture may be unavailable in some browsers.
    }
});

cropViewport?.addEventListener("pointermove", (event) => {
    if (!cropPointerStart) return;

    if (
        cropPointerStart.pointerId !== undefined &&
        event.pointerId !== cropPointerStart.pointerId
    ) {
        return;
    }

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
cropViewport?.addEventListener("lostpointercapture", stopCropDrag);

/* =====================================================
   5.2 CREATE CROPPED FILE
   ===================================================== */

function createCroppedFile() {
    return new Promise((resolve, reject) => {
        const image = getCropImage();
        const viewport = getCropViewport();

        if (!image || !viewport || !cropSourceImage) {
            reject(new Error("Crop image available nahi hai."));
            return;
        }

        if (!image.naturalWidth || !image.naturalHeight) {
            reject(new Error("Image abhi load nahi hui."));
            return;
        }

        const { width, height } = getCropDimensions();

        if (width <= 0 || height <= 0) {
            reject(new Error("Crop area ka size nahi mila."));
            return;
        }

        const canvas = document.createElement("canvas");

        let outputWidth;
        let outputHeight;

        if (cropType === "logo") {
            outputWidth = 600;
            outputHeight = 600;
        } else {
            // Keep output ratio exactly the same as the crop viewport.
            outputWidth = 1600;
            outputHeight = Math.max(
                1,
                Math.round(outputWidth * height / width)
            );
        }

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            reject(new Error("Canvas available nahi hai."));
            return;
        }

        // Paint a background first so no transparent/empty area appears.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, outputWidth, outputHeight);

        const scaleX = outputWidth / width;
        const scaleY = outputHeight / height;

        const imageScale = cropBaseScale * cropZoomValue;

        // IMPORTANT:
        // cropOffsetX and cropOffsetY are already negative when dragged.
        // Do NOT negate them; that caused the crop to shift incorrectly.
        const drawX = cropOffsetX * scaleX;
        const drawY = cropOffsetY * scaleY;

        const drawWidth =
            image.naturalWidth * imageScale * scaleX;

        const drawHeight =
            image.naturalHeight * imageScale * scaleY;

        context.save();

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        context.drawImage(
            image,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );

        context.restore();

        const mimeType = "image/jpeg";

        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Cropped image create nahi hui."));
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

/* =====================================================
   5.3 PREVIEW CROPPED IMAGE
   ===================================================== */

function revokePreviewUrl(type) {
    if (type === "logo" && pendingLogoPreviewUrl) {
        URL.revokeObjectURL(pendingLogoPreviewUrl);
        pendingLogoPreviewUrl = null;
    }

    if (type === "banner" && pendingBannerPreviewUrl) {
        URL.revokeObjectURL(pendingBannerPreviewUrl);
        pendingBannerPreviewUrl = null;
    }
}

function previewCroppedFile(file, type) {
    const url = URL.createObjectURL(file);

    if (type === "logo") {
        revokePreviewUrl("logo");

        pendingLogoFile = file;
        pendingLogoPreviewUrl = url;

        setImage("shopLogo", url);
        return;
    }

    revokePreviewUrl("banner");

    pendingBannerFile = file;
    pendingBannerPreviewUrl = url;

    const bannerBackground = $("bannerBg");
    const bannerImage = $("shopBanner");

    // Use the background element for the dashboard banner.
    if (bannerBackground) {
        bannerBackground.style.backgroundImage = `url("${url}")`;
        bannerBackground.style.backgroundSize = "cover";
        bannerBackground.style.backgroundPosition = "center";
        bannerBackground.style.backgroundRepeat = "no-repeat";
    }

    // Keep the separate banner image hidden.
    if (bannerImage) {
        bannerImage.src = url;
        bannerImage.hidden = true;
        bannerImage.style.display = "none";
    }
}

$("applyCropBtn")?.addEventListener("click", async () => {
    const button = $("applyCropBtn");
    const originalText = button?.textContent || "Apply Crop";

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
            button.textContent = originalText;
        }
    }
});

function closeCropEditor() {
    closeModal("cropModal");

    const image = getCropImage();

    if (image) {
        image.onload = null;
        image.onerror = null;
    }

    if (cropObjectUrl) {
        URL.revokeObjectURL(cropObjectUrl);
        cropObjectUrl = null;
    }

    cropSourceImage = null;
    cropPointerStart = null;
}

$("cancelCropBtn")?.addEventListener("click", closeCropEditor);
$("closeCropModal")?.addEventListener("click", closeCropEditor);

$("cropModal")?.addEventListener("click", (event) => {
    if (event.target === $("cropModal")) {
        closeCropEditor();
    }
});

/* =====================================================
   6. SAVE PROFILE + LOGO + BANNER
   ===================================================== */

$("editProfileForm")?.addEventListener("submit", saveProfile);

async function saveProfile(event) {
    event.preventDefault();

    if (!getShopId()) {
        showMessage("Shop ID nahi mila. Please login karo.", "error");
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

    // Must match backend Multer field names.
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

            currentUser = updatedUser;
        } catch (error) {
            console.warn(
                "Could not update local session:",
                error
            );
        }

        pendingLogoFile = null;
        pendingBannerFile = null;

        // Keep preview URLs alive until the server's saved images
        // have loaded and replaced the temporary preview.
        closeEditProfile();

        await loadProfile();

        revokePreviewUrl("logo");
        revokePreviewUrl("banner");

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
    $("addProductForm")?.reset();
    openModal("addProductModal");
}

function closeAddProductModal() {
    closeModal("addProductModal");
}

$("addProductBtn")?.addEventListener("click", openAddProductModal);
$("addProductBtn2")?.addEventListener("click", openAddProductModal);
$("emptyAddProductBtn")?.addEventListener("click", openAddProductModal);

$("closeAddProduct")?.addEventListener("click", closeAddProductModal);
$("cancelAddProduct")?.addEventListener("click", closeAddProductModal);

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
        console.warn("productGrid element HTML mein nahi mila.");
        return;
    }

    grid.replaceChildren();

    if (!items || items.length === 0) {
        if (emptyState) emptyState.style.display = "block";

        grid.style.display = "none";

        setText("productCount", 0);
        setText("postCount", 0);

        return;
    }

    if (emptyState) emptyState.style.display = "none";

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
        } else {
            image.alt = "No product image available";
        }

        image.onerror = () => {
            image.alt = "Product image could not be loaded";
        };

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
            product.price !== undefined &&
            product.price !== null &&
            product.price !== "" &&
            Number.isFinite(amount)
                ? `₹${amount.toLocaleString("en-IN")}`
                : "Price not added";

        const actions = document.createElement("div");
        actions.className = "product-actions";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-product-btn";
        deleteButton.textContent = "🗑 Delete";

        deleteButton.setAttribute(
            "aria-label",
            `Delete ${title.textContent}`
        );

        deleteButton.addEventListener("click", () => {
            deleteProduct(
                product._id || product.id,
                deleteButton
            );
        });

        actions.appendChild(deleteButton);

        content.append(title, description, price, actions);
        card.append(image, content);
        grid.appendChild(card);
    });

    setText("productCount", items.length);
    setText("postCount", items.length);
}

/* =====================================================
   8.1 DELETE PRODUCT
   ===================================================== */

async function deleteProduct(productId, button) {
    if (!getShopId()) {
        showMessage("Please login again.", "error");
        return;
    }

    if (!productId) {
        showMessage(
            "Product ID nahi mila. Product delete nahi hua.",
            "error"
        );
        return;
    }

    const confirmed = window.confirm(
        "Kya tum sach mein is product ko delete karna chahti ho?\n\nYe action undo nahi hoga."
    );

    if (!confirmed) return;

    const originalText = button?.textContent || "🗑 Delete";

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Deleting...";
        }

        const result = await request(
            `${API}/shopkeeper/${encodeURIComponent(getShopId())}/products/${encodeURIComponent(productId)}`,
            { method: "DELETE" }
        );

        await loadProducts();

        showMessage(
            result?.message || "Product deleted successfully!"
        );
    } catch (error) {
        console.error("Delete product error:", error);

        showMessage(
            error.message || "Product delete nahi hua.",
            "error"
        );

        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

/* =====================================================
   9. ADD NEW PRODUCT
   ===================================================== */

$("addProductForm")?.addEventListener("submit", addProduct);

async function addProduct(event) {
    event.preventDefault();

    if (!getShopId()) {
        showMessage("Please login again.", "error");
        return;
    }

    const button = $("saveProductBtn");
    const originalText = button?.textContent || "Save Product";

    const formData = new FormData();

    formData.append(
        "title",
        $("productTitle")?.value.trim() || ""
    );

    formData.append(
        "description",
        $("productDescription")?.value.trim() || ""
    );

    formData.append(
        "price",
        $("productPrice")?.value || ""
    );

    formData.append(
        "category",
        $("productCategory")?.value || ""
    );

    const imageFile = $("productImage")?.files?.[0];

    if (imageFile) {
        // Backend product upload field is "image".
        formData.append("image", imageFile);
    }

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

        $("addProductForm")?.reset();

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
