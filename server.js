
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const Shopkeeper = require("./models/Shopkeeper");
const Product = require("./models/Product");

// Agar tumhare project mein User.js nahi hai,
// is import aur user registration/login logic ko apne existing model se match karna.
let User;
try {
  User = require("./models/User");
} catch {
  User = null;
}

const app = express();
const PORT = process.env.PORT || 8081;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopnest";

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, "public");
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(express.static(publicPath));
app.use("/uploads", express.static(uploadsPath));

// ==========================================
// MULTER FILE UPLOAD CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName =
      `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, uniqueName);
  }
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));
    }
  }
});

// ==========================================
// HELPERS
// ==========================================

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function safeShop(shop) {
  if (!shop) return null;

  const data = shop.toObject ? shop.toObject() : { ...shop };
  delete data.password;

  return data;
}

function uploadedPath(file) {
  return file ? `/uploads/${file.filename}` : undefined;
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api", (req, res) => {
  res.json({
    message: "ShopNest API is running",
    success: true
  });
});

// ==========================================
// SHOPKEEPER REGISTRATION
// ==========================================

app.post(
  "/api/register/shopkeeper",
  upload.single("shopPicture"),
  async (req, res) => {
    try {
      const {
        ownerName,
        shopName,
        username,
        password,
        category,
        shopAddress
      } = req.body;

      if (
        !ownerName ||
        !shopName ||
        !username ||
        !password ||
        !category
      ) {
        return res.status(400).json({
          message: "Please fill all required fields."
        });
      }

      const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();

      const existing = await Shopkeeper.findOne({
        username: normalizedUsername
      });

      if (existing) {
        return res.status(409).json({
          message: "This username is already taken."
        });
      }

      const newShop = await Shopkeeper.create({
        ownerName: ownerName.trim(),
        shopName: shopName.trim(),
        username: normalizedUsername,
        password,
        category: category.trim(),
        shopAddress: shopAddress || "",
        shopPicture: uploadedPath(req.file) || "",
        description: "",
        shopBanner: "",
        phone: "",
        whatsapp: ""
      });

      return res.status(201).json({
        message: "Shopkeeper registered successfully.",
        shopkeeper: safeShop(newShop)
      });
    } catch (error) {
      console.error("Shopkeeper registration error:", error);

      return res.status(500).json({
        message: error.code === 11000
          ? "Username already exists."
          : "Shopkeeper registration failed."
      });
    }
  }
);

// ==========================================
// USER REGISTRATION
// Keep this route if your User model exists.
// ==========================================

app.post("/api/register/user", async (req, res) => {
  try {
    if (!User) {
      return res.status(501).json({
        message: "User model is not configured in this project."
      });
    }

    const { name, username, email, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({
        message: "Username/email and password are required."
      });
    }

    const query = [];
    if (email) query.push({ email: email.trim().toLowerCase() });
    if (username) query.push({ username: username.trim().toLowerCase() });

    const existing = query.length
      ? await User.findOne({ $or: query })
      : null;

    if (existing) {
      return res.status(409).json({
        message: "User already exists."
      });
    }

    const newUser = await User.create({
      name: name || "",
      username: username ? username.trim().toLowerCase() : undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      password
    });

    const result = newUser.toObject();
    delete result.password;

    return res.status(201).json({
      message: "User registered successfully.",
      user: result
    });
  } catch (error) {
    console.error("User registration error:", error);

    return res.status(500).json({
      message: "User registration failed. Check your User model fields."
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({
        message: "Username/email and password are required."
      });
    }

    const normalizedUsername = username
      ? username.trim().replace(/^@/, "").toLowerCase()
      : "";

    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    const query = [];

    if (normalizedUsername) query.push({ username: normalizedUsername });
    if (normalizedEmail) query.push({ email: normalizedEmail });

    let account = null;
    let accountRole = "";

    if (!role || role === "shopkeeper") {
      account = await Shopkeeper.findOne({ $or: query });

      if (account) accountRole = "shopkeeper";
    }

    if (!account && (!role || role === "user") && User) {
      account = await User.findOne({ $or: query });

      if (account) accountRole = "user";
    }

    // This comparison assumes your existing models store plain passwords.
    // If your app uses bcrypt, replace this with bcrypt.compare().
    if (!account || account.password !== password) {
      return res.status(401).json({
        message: "Invalid login details."
      });
    }

    const safeAccount = safeShop(account);

    return res.json({
      message: "Login successful.",
      user: {
        ...safeAccount,
        role: accountRole
      },
      role: accountRole
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed."
    });
  }
});

// ==========================================
// GET SHOPKEEPER PROFILE
// ==========================================

app.get("/api/shopkeeper/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid shopkeeper ID."
      });
    }

    const shop = await Shopkeeper.findById(id).select("-password");

    if (!shop) {
      return res.status(404).json({
        message: "Shopkeeper not found."
      });
    }

    return res.json({
      shopkeeper: safeShop(shop)
    });
  } catch (error) {
    console.error("Get shopkeeper error:", error);

    return res.status(500).json({
      message: "Could not load shop profile."
    });
  }
});

// ==========================================
// UPDATE PROFILE + LOGO + BANNER
// ==========================================

app.patch(
  "/api/shopkeeper/:id",
  upload.fields([
    { name: "shopPicture", maxCount: 1 },
    { name: "shopBanner", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({
          message: "Invalid shopkeeper ID."
        });
      }

      const shop = await Shopkeeper.findById(id);

      if (!shop) {
        return res.status(404).json({
          message: "Shopkeeper not found."
        });
      }

      const allowedFields = [
        "shopName",
        "ownerName",
        "username",
        "category",
        "shopAddress",
        "description",
        "phone",
        "whatsapp"
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          shop[field] = req.body[field].trim();
        }
      });

      if (req.body.username !== undefined) {
        shop.username = req.body.username
          .trim()
          .replace(/^@/, "")
          .toLowerCase();

        const duplicate = await Shopkeeper.findOne({
          username: shop.username,
          _id: { $ne: shop._id }
        });

        if (duplicate) {
          return res.status(409).json({
            message: "This username is already taken."
          });
        }
      }

      const files = req.files || {};

      if (files.shopPicture?.[0]) {
        shop.shopPicture = uploadedPath(files.shopPicture[0]);
      }

      if (files.shopBanner?.[0]) {
        shop.shopBanner = uploadedPath(files.shopBanner[0]);
      }

      await shop.save();

      return res.json({
        message: "Shop profile updated successfully.",
        shopkeeper: safeShop(shop)
      });
    } catch (error) {
      console.error("Update profile error:", error);

      return res.status(500).json({
        message: error.code === 11000
          ? "This username is already taken."
          : "Could not update shop profile."
      });
    }
  }
);

// ==========================================
// GET SHOP PRODUCTS
// ==========================================

app.get("/api/shopkeeper/:id/products", async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid shopkeeper ID."
      });
    }

    const shop = await Shopkeeper.findById(id).select("_id");

    if (!shop) {
      return res.status(404).json({
        message: "Shopkeeper not found."
      });
    }

    const products = await Product.find({
      shopkeeperId: shop._id
    }).sort({ createdAt: -1 });

    return res.json({ products });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      message: "Could not load products."
    });
  }
});

// ==========================================
// ADD PRODUCT
// ==========================================

app.post(
  "/api/shopkeeper/:id/products",
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({
          message: "Invalid shopkeeper ID."
        });
      }

      const shop = await Shopkeeper.findById(id).select("_id");

      if (!shop) {
        return res.status(404).json({
          message: "Shopkeeper not found."
        });
      }

      const {
        title,
        description,
        price,
        category,
        details
      } = req.body;

      if (
        !title?.trim() ||
        !description?.trim() ||
        price === undefined ||
        price === "" ||
        !category?.trim()
      ) {
        return res.status(400).json({
          message: "Title, description, price and category are required."
        });
      }

      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          message: "Enter a valid product price."
        });
      }

      let parsedDetails = {};

      if (details) {
        try {
          parsedDetails = JSON.parse(details);
        } catch {
          return res.status(400).json({
            message: "Product details must be valid JSON."
          });
        }
      }

      const product = await Product.create({
        shopkeeperId: shop._id,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: category.trim(),
        image: uploadedPath(req.file) || "",
        details: parsedDetails
      });

      return res.status(201).json({
        message: "Product added successfully.",
        product
      });
    } catch (error) {
      console.error("Add product error:", error);

      return res.status(500).json({
        message: "Could not add product."
      });
    }
  }
);

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Image size must be 5 MB or smaller."
        : error.message
    });
  }

  if (error.message?.includes("Only JPG")) {
    return res.status(400).json({
      message: error.message
    });
  }

  return res.status(500).json({
    message: "Something went wrong on the server."
  });
});

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`ShopNest server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

/* ==========================================
   DELETE PRODUCT
   ========================================== */

app.delete(
  "/api/shopkeeper/:id/products/:productId",
  async (req, res) => {
    try {
      const { id, productId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({
          message: "Invalid shopkeeper or product ID."
        });
      }

      const shop = await Shopkeeper.findById(id).select("_id");

      if (!shop) {
        return res.status(404).json({
          message: "Shopkeeper not found."
        });
      }

      // Only delete a product belonging to this shop.
      const deletedProduct = await Product.findOneAndDelete({
        _id: productId,
        shopkeeperId: shop._id
      });

      if (!deletedProduct) {
        return res.status(404).json({
          message: "Product not found in your shop."
        });
      }

      return res.json({
        success: true,
        message: "Product deleted successfully."
      });
    } catch (error) {
      console.error("Delete product error:", error);

      return res.status(500).json({
        message: "Could not delete product."
      });
    }
  }
);

startServer();
