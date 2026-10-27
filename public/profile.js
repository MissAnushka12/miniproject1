
/* =========================================
   SHOPNEST - PROFILE.JS
   Profile, Edit Profile, Products, Share, Logout
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:8081";

  // ---------- ELEMENTS ----------
  const get = (id) => document.getElementById(id);

  const editModal = get("editProfileModal");
  const productModal = get("addProductModal");
  const editForm = get("editProfileForm");
  const productForm = get("addProductForm");

  const productGrid = get("productGrid");
  const emptyProducts = get("noProductsMessage");
  const categoryFields = get("categoryFields");

  // ---------- LOGIN / SHOPKEEPER ----------
  let savedUser = null;

  try {
    savedUser = JSON.parse(localStorage.getItem("shopnestUser") || "null");
  } catch (error) {
    console.error("Unable to read saved user:", error);
  }

  const shopkeeperId = savedUser?._id || savedUser?.id;

  if (!shopkeeperId) {
    window.location.href = "login.html";
    return;
  }

  let shopkeeper = null;
  let products = [];

  // ---------- HELPERS ----------
  function showMessage(message) {
    alert(message);
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  function imageUrl(path) {
    if (!path) return "";

    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    return `${API_BASE}/${path.replace(/^\/+/, "")}`;
  }

  function setText(id, value, fallback = "Not provided") {
    const element = get(id);
    if (element) {
      element.textContent = value || fallback;
    }
  }

  function setImage(id, path, placeholderId = null) {
    const img = get(id);
    const placeholder = placeholderId ? get(placeholderId) : null;

    if (!img) return;

    if (path) {
      img.src = imageUrl(path);
      img.hidden = false;

      if (placeholder) placeholder.hidden = true;

      img.onerror = () => {
        img.hidden = true;
        if (placeholder) placeholder.hidden = false;
      };
    } else {
      img.removeAttribute("src");
      img.hidden = true;
      if (placeholder) placeholder.hidden = false;
    }
  }

  async function request(url, options = {}) {
    const response = await fetch(url, options);

    let data = {};
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data.message = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed. Please try again.");
    }

    return data;
  }

  // ---------- LOAD PROFILE ----------
  async function loadProfile() {
    try {
      const data = await request(
        `${API_BASE}/api/shopkeeper/${encodeURIComponent(shopkeeperId)}`
      );

      shopkeeper = data.shopkeeper || data;

      renderProfile();
      fillEditForm();
    } catch (error) {
      console.error("Profile loading error:", error);
      showMessage("Profile load nahi ho paya. Backend server check karein.");
    }
  }

  // ---------- DISPLAY PROFILE ----------
  function renderProfile() {
    if (!shopkeeper) return;

    setText("profileShopName", shopkeeper.shopName, "My Shop");

    setText(
      "profileUsername",
      shopkeeper.username ? `@${shopkeeper.username}` : "",
      "Username not set"
    );

    setText("profileDescription", shopkeeper.description, "No description added yet.");
    setText("profileCategory", shopkeeper.category, "Not selected");
    setText("profileAddress", shopkeeper.shopAddress);
    setText("profileOwner", shopkeeper.ownerName);
    setText("profilePhone", shopkeeper.phone);
    setText("profileWhatsapp", shopkeeper.whatsapp);

    // Also support alternate IDs used on other ShopNest pages.
    setText("shopName", shopkeeper.shopName, "My Shop");
    setText("detailUsername", shopkeeper.username ? `@${shopkeeper.username}` : "");
    setText("shopDescription", shopkeeper.description, "No description added yet.");

    setImage("shopLogo", shopkeeper.shopPicture, "shopLogoPlaceholder");
    setImage("shopBanner", shopkeeper.shopBanner);

    // If banner or logo is missing, keep the corresponding image hidden.
    const banner = get("shopBanner");
    if (banner) banner.hidden = !shopkeeper.shopBanner;
  }

  // ---------- FILL EDIT FORM ----------
  function fillEditForm() {
    if (!shopkeeper) return;

    const values = {
      editShopName: shopkeeper.shopName,
      editOwnerName: shopkeeper.ownerName,
      editUsername: shopkeeper.username,
      editCategory: shopkeeper.category,
      editAddress: shopkeeper.shopAddress,
      editDescription: shopkeeper.description,
      editPhone: shopkeeper.phone,
      editWhatsapp: shopkeeper.whatsapp
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = get(id);
      if (element && value != null) {
        element.value = value;
      }
    });
  }

  // ---------- EDIT PROFILE MODAL ----------
  get("editProfileBtn")?.addEventListener("click", () => {
    fillEditForm();
    openModal(editModal);
  });

  get("closeEditProfile")?.addEventListener("click", () => {
    closeModal(editModal);
  });

  get("cancelEditProfile")?.addEventListener("click", () => {
    closeModal(editModal);
  });

  // ---------- UPDATE PROFILE ----------
  editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = editForm.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const formData = new FormData();

      formData.append("shopName", get("editShopName")?.value.trim() || "");
      formData.append("ownerName", get("editOwnerName")?.value.trim() || "");
      formData.append("username", get("editUsername")?.value.trim() || "");
      formData.append("category", get("editCategory")?.value || "");
      formData.append("shopAddress", get("editAddress")?.value.trim() || "");
      formData.append("description", get("editDescription")?.value.trim() || "");
      formData.append("phone", get("editPhone")?.value.trim() || "");
      formData.append("whatsapp", get("editWhatsapp")?.value.trim() || "");

      const logoFile = get("editLogo")?.files?.[0];
      const bannerFile = get("editBanner")?.files?.[0];

      if (logoFile) formData.append("shopPicture", logoFile);
      if (bannerFile) formData.append("shopBanner", bannerFile);

      const data = await request(
        `${API_BASE}/api/shopkeeper/${encodeURIComponent(shopkeeperId)}`,
        {
          method: "PATCH",
          body: formData
        }
      );

      shopkeeper = data.shopkeeper || data;
      renderProfile();
      fillEditForm();
      closeModal(editModal);

      showMessage("Profile successfully update ho gaya!");
    } catch (error) {
      console.error("Profile update error:", error);
      showMessage(error.message || "Profile update nahi ho paya.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  // ---------- SHARE PROFILE ----------
  get("shareProfileBtn")?.addEventListener("click", async () => {
    const shareUrl = window.location.href;
    const shopName = shopkeeper?.shopName || "ShopNest Shop";
    const shareData = {
      title: shopName,
      text: `Check out ${shopName} on ShopNest!`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showMessage("Profile link copy ho gaya!");
      } else {
        window.prompt("Apna profile link copy karein:", shareUrl);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        window.prompt("Profile link copy karein:", shareUrl);
      }
    }
  });

  // ---------- PRODUCT MODAL ----------
  get("addProductBtn")?.addEventListener("click", () => {
    productForm?.reset();
    buildCategoryFields();
    openModal(productModal);
  });

  get("closeAddProduct")?.addEventListener("click", () => {
    closeModal(productModal);
  });

  get("cancelAddProduct")?.addEventListener("click", () => {
    closeModal(productModal);
  });

  // Support inline close handlers, if used in profile.html.
  window.closeProductModal = () => closeModal(productModal);
  window.closeAddProductModal = () => closeModal(productModal);

  // Close a modal when clicking its backdrop.
  [editModal, productModal].forEach((modal) => {
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  // ---------- CATEGORY-SPECIFIC PRODUCT FIELDS ----------
  function buildCategoryFields() {
    if (!categoryFields) return;

    categoryFields.innerHTML = `
      <div class="form-group">
        <label for="productCategory">Product Category</label>
        <select id="productCategory" name="category" required>
          <option value="">Select category</option>
          <option value="Clothing">Clothing & Fashion</option>
          <option value="Electronics">Electronics</option>
          <option value="Footwear">Footwear</option>
          <option value="Food">Food & Grocery</option>
          <option value="Beauty">Beauty & Personal Care</option>
          <option value="Home">Home & Living</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div id="extraProductDetails"></div>
    `;

    const categorySelect = get("productCategory");
    categorySelect?.addEventListener("change", renderExtraFields);
  }

  function renderExtraFields() {
    const selectedCategory = get("productCategory")?.value || "";
    const container = get("extraProductDetails");

    if (!container) return;

    const fieldSets = {
      Clothing: [
        ["size", "Available Sizes", "e.g. S, M, L, XL"],
        ["color", "Color", "e.g. Blue"],
        ["material", "Material", "e.g. Cotton"]
      ],
      Electronics: [
        ["brand", "Brand", "e.g. Samsung"],
        ["warranty", "Warranty", "e.g. 1 year"],
        ["model", "Model", "Enter model"]
      ],
      Footwear: [
        ["sizes", "Available Sizes", "e.g. 6, 7, 8, 9"],
        ["color", "Color", "Enter color"],
        ["material", "Material", "Enter material"]
      ],
      Food: [
        ["weight", "Weight / Quantity", "e.g. 500 g"],
        ["expiry", "Expiry / Best Before", "If applicable"],
        ["ingredients", "Ingredients", "If applicable"]
      ],
      Beauty: [
        ["brand", "Brand", "Enter brand"],
        ["skinType", "Suitable For", "e.g. All skin types"],
        ["quantity", "Quantity", "e.g. 100 ml"]
      ],
      Home: [
        ["material", "Material", "Enter material"],
        ["dimensions", "Dimensions", "e.g. 30 x 20 cm"],
        ["color", "Color", "Enter color"]
      ],
      Other: [
        ["brand", "Brand / Maker", "Optional"],
        ["specifications", "Specifications", "Optional"]
      ]
    };

    const fields = fieldSets[selectedCategory] || [];

    container.innerHTML = fields.map(([name, label, placeholder]) => `
      <div class="form-group">
        <label for="detail_${name}">${label}</label>
        <input
          type="text"
          id="detail_${name}"
          name="detail_${name}"
          placeholder="${placeholder}"
        />
      </div>
    `).join("");
  }

  // ---------- LOAD PRODUCTS ----------
  async function loadProducts() {
    try {
      const data = await request(
        `${API_BASE}/api/shopkeeper/${encodeURIComponent(shopkeeperId)}/products`
      );

      products = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
          ? data.products
          : [];

      renderProducts();
    } catch (error) {
      console.error("Products loading error:", error);
      products = [];
      renderProducts();
    }
  }

  // ---------- DISPLAY PRODUCTS ----------
  function renderProducts() {
    if (!productGrid) return;

    productGrid.querySelectorAll(".product-card").forEach((card) => card.remove());

    if (emptyProducts) {
      emptyProducts.hidden = products.length > 0;
    }

    products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const image = document.createElement("img");
      image.className = "product-card-image";
      image.alt = product.title || "Product image";
      image.loading = "lazy";

      if (product.image) {
        image.src = imageUrl(product.image);
        image.onerror = () => {
          image.style.display = "none";
        };
      } else {
        image.style.display = "none";
      }

      const content = document.createElement("div");
      content.className = "product-card-content";

      const title = document.createElement("h3");
      title.textContent = product.title || "Untitled Product";

      const description = document.createElement("p");
      description.textContent = product.description || "No description available.";

      const price = document.createElement("p");
      price.className = "product-price";
      price.textContent = `₹${Number(product.price || 0).toLocaleString("en-IN")}`;

      const category = document.createElement("p");
      category.className = "product-category";
      category.textContent = product.category || "Other";

      content.append(title, description, price, category);

      const details = product.details || {};
      const detailEntries = Object.entries(details).filter(
        ([, value]) => value !== "" && value != null
      );

      if (detailEntries.length) {
        const detailList = document.createElement("ul");
        detailList.className = "product-details";

        detailEntries.forEach(([key, value]) => {
          const item = document.createElement("li");
          const readableKey = key.replace(/([A-Z])/g, " $1");

          item.textContent = `${readableKey.charAt(0).toUpperCase()}${readableKey.slice(1)}: ${value}`;
          detailList.appendChild(item);
        });

        content.appendChild(detailList);
      }

      card.append(image, content);
      productGrid.appendChild(card);
    });
  }

  // ---------- ADD PRODUCT ----------
  productForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = get("productTitle")?.value.trim() || "";
    const description = get("productDescription")?.value.trim() || "";
    const price = get("productPrice")?.value || "";
    const category = get("productCategory")?.value || "";
    const imageFile = get("productImage")?.files?.[0];

    if (!title || !price || !category) {
      showMessage("Product title, price aur category fill karein.");
      return;
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      showMessage("Please valid product price enter karein.");
      return;
    }

    if (!imageFile) {
      showMessage("Product ki image select karein.");
      return;
    }

    const details = {};

    categoryFields?.querySelectorAll("input[name^='detail_']").forEach((input) => {
      const value = input.value.trim();
      if (value) {
        details[input.name.replace("detail_", "")] = value;
      }
    });

    const submitButton = productForm.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", String(Number(price)));
      formData.append("category", category);
      formData.append("image", imageFile);

      // The backend must parse this JSON string into a details object.
      formData.append("details", JSON.stringify(details));

      const data = await request(
        `${API_BASE}/api/shopkeeper/${encodeURIComponent(shopkeeperId)}/products`,
        {
          method: "POST",
          body: formData
        }
      );

      if (data.product) {
        products.unshift(data.product);
      } else {
        await loadProducts();
      }

      renderProducts();
      productForm.reset();
      buildCategoryFields();
      closeModal(productModal);

      showMessage("Product successfully add ho gaya!");
    } catch (error) {
      console.error("Add product error:", error);
      showMessage(
        error.message ||
        "Product add nahi hua. Backend API aur image upload settings check karein."
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  // ---------- LOGOUT ----------
  get("logoutBtn")?.addEventListener("click", () => {
    const confirmed = window.confirm("Kya aap logout karna chahte hain?");

    if (confirmed) {
      localStorage.removeItem("shopnestUser");
      window.location.href = "login.html";
    }
  });

  // ---------- START ----------
  buildCategoryFields();
  loadProfile();
  loadProducts();
});
