
/* =====================================================
   SHOPNEST - SERVER.JS
   Node.js + Express + MongoDB
   ===================================================== */

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Shopkeeper = require("./models/Shopkeeper");

const app = express();
const PORT = process.env.PORT || 8081;
const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/shopnest";

// -----------------------------------------------------
// 1. MIDDLEWARE
// -----------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// -----------------------------------------------------
// 2. MULTER IMAGE UPLOAD
// Accepts different image field names
// -----------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = /^\.(jpg|jpeg|png|webp)$/.test(ext)
            ? ext
            : ".jpg";

        const uniqueName =
            Date.now() + "-" +
            Math.round(Math.random() * 1e9) +
            safeExt;

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }
    }
});

// -----------------------------------------------------
// 3. USER MODEL
// Defined here to avoid requiring a separate User file
// -----------------------------------------------------

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: ""
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        location: {
            type: String,
            default: ""
        },
        language: {
            type: String,
            default: "Hindi"
        },
        role: {
            type: String,
            default: "user"
        }
    },
    { timestamps: true }
);

const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

// -----------------------------------------------------
// 4. PRODUCT MODEL
// Defined here to avoid requiring a separate Product file
// -----------------------------------------------------

const productSchema = new mongoose.Schema(
    {
        shopkeeperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shopkeeper",
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        category: {
            type: String,
            default: ""
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        },
        image: {
            type: String,
            default: ""
        },
        images: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

const Product =
    mongoose.models.Product ||
    mongoose.model("Product", productSchema);

// -----------------------------------------------------
// 5. HELPER FUNCTIONS
// -----------------------------------------------------

function safeUser(user) {
    const data = user.toObject ? user.toObject() : { ...user };
    delete data.password;
    return data;
}

function getUploadedFile(req, ...fieldNames) {
    const files = req.files || [];

    return files.find(file =>
        fieldNames.includes(file.fieldname)
    );
}

function uploadedPath(file) {
    return file ? `/uploads/${file.filename}` : "";
}

function removeUploadedFile(filePath) {
    if (!filePath || !filePath.startsWith("/uploads/")) {
        return;
    }

    const fullPath = path.join(__dirname, filePath);

    fs.unlink(fullPath, err => {
        if (err && err.code !== "ENOENT") {
            console.error("File deletion error:", err.message);
        }
    });
}

function validId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// -----------------------------------------------------
// 6. HEALTH CHECK
// -----------------------------------------------------

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "ShopNest API is running"
    });
});

// -----------------------------------------------------
// 7. USER REGISTRATION
// POST /api/register/user
// -----------------------------------------------------

app.post("/api/register/user", async (req, res) => {
    try {
        const { name, phone, password, location, language } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Phone number and password are required."
            });
        }

        const existingUser = await User.findOne({
            phone: String(phone).trim()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This phone number is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            phone: String(phone).trim(),
            password: hashedPassword,
            location,
            language
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: safeUser(user)
        });
    } catch (error) {
        console.error("User registration error:", error);

        res.status(500).json({
            success: false,
            message: "User registration failed."
        });
    }
});

// -----------------------------------------------------
// 8. SHOPKEEPER REGISTRATION
// POST /api/register/shopkeeper
// -----------------------------------------------------

app.post(
    "/api/register/shopkeeper",
    upload.any(),
    async (req, res) => {
        try {
            const {
                ownerName,
                shopName,
                username,
                password,
                category,
                shopAddress,
                description,
                phone,
                whatsapp
            } = req.body;

            if (
                !ownerName ||
                !shopName ||
                !username ||
                !password
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Owner name, shop name, username and password are required."
                });
            }

            const normalizedUsername =
                String(username).trim().toLowerCase();

            const existingShopkeeper =
                await Shopkeeper.findOne({
                    username: normalizedUsername
                });

            if (existingShopkeeper) {
                return res.status(409).json({
                    success: false,
                    message: "Username is already taken."
                });
            }

            const logo = getUploadedFile(
                req,
                "shopPicture",
                "shopLogo",
                "logo"
            );

            const banner = getUploadedFile(
                req,
                "shopBanner",
                "banner",
                "bannerPicture"
            );

            const hashedPassword = await bcrypt.hash(password, 10);

            const shopkeeper = await Shopkeeper.create({
                ownerName,
                shopName,
                username: normalizedUsername,
                password: hashedPassword,
                category,
                shopAddress,
                description,
                phone,
                whatsapp,
                shopPicture: uploadedPath(logo),
                shopBanner: uploadedPath(banner),
                role: "shopkeeper"
            });

            res.status(201).json({
                success: true,
                message: "Shopkeeper registered successfully.",
                shopkeeper: safeUser(shopkeeper)
            });
        } catch (error) {
            console.error("Shopkeeper registration error:", error);

            res.status(500).json({
                success: false,
                message: "Shopkeeper registration failed."
            });
        }
    }
);

// -----------------------------------------------------
// 9. LOGIN
// POST /api/login
// User: phone + password
// Shopkeeper: username + password
// -----------------------------------------------------

app.post("/api/login", async (req, res) => {
    try {
        const { username, phone, password } = req.body;

        const identifier = String(
            username || phone || ""
        ).trim();

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/phone and password are required."
            });
        }

        // First check shopkeeper username
        const shopkeeper = await Shopkeeper.findOne({
            username: identifier.toLowerCase()
        });

        if (shopkeeper) {
            const matched = await bcrypt.compare(
                password,
                shopkeeper.password
            );

            if (!matched) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            return res.json({
                success: true,
                message: "Shopkeeper login successful.",
                user: safeUser(shopkeeper),
                shopkeeper: safeUser(shopkeeper),
                role: "shopkeeper"
            });
        }

        // Then check user phone
        const user = await User.findOne({
            phone: identifier
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/phone or password."
            });
        }

        const matched = await bcrypt.compare(
            password,
            user.password
        );

        if (!matched) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/phone or password."
            });
        }

        res.json({
            success: true,
            message: "Login successful.",
            user: safeUser(user),
            role: "user"
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// -----------------------------------------------------
// 10. GET SHOPKEEPER PROFILE
// GET /api/shopkeeper/:id
// -----------------------------------------------------

app.get("/api/shopkeeper/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid shopkeeper ID."
            });
        }

        const shopkeeper = await Shopkeeper.findById(id)
            .select("-password");

        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found."
            });
        }

        const productCount = await Product.countDocuments({
            shopkeeperId: shopkeeper._id
        });

        res.json({
            success: true,
            shopkeeper: {
                ...shopkeeper.toObject(),
                productCount,
                postCount: productCount
            }
        });
    } catch (error) {
        console.error("Get shopkeeper error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load shopkeeper profile."
        });
    }
});

// -----------------------------------------------------
// 11. UPDATE SHOPKEEPER PROFILE
// PATCH /api/shopkeeper/:id
// Supports multipart/form-data image uploads
// -----------------------------------------------------

app.patch(
    "/api/shopkeeper/:id",
    upload.any(),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!validId(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid shopkeeper ID."
                });
            }

            const shopkeeper =
                await Shopkeeper.findById(id);

            if (!shopkeeper) {
                return res.status(404).json({
                    success: false,
                    message: "Shopkeeper not found."
                });
            }

            const allowedFields = [
                "ownerName",
                "shopName",
                "username",
                "category",
                "shopAddress",
                "description",
                "phone",
                "whatsapp"
            ];

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    shopkeeper[field] = req.body[field];
                }
            }

            if (req.body.username) {
                shopkeeper.username =
                    String(req.body.username)
                        .trim()
                        .toLowerCase();
            }

            const logo = getUploadedFile(
                req,
                "shopPicture",
                "shopLogo",
                "logo"
            );

            const banner = getUploadedFile(
                req,
                "shopBanner",
                "banner",
                "bannerPicture"
            );

            if (logo) {
                removeUploadedFile(shopkeeper.shopPicture);
                shopkeeper.shopPicture = uploadedPath(logo);
            }

            if (banner) {
                removeUploadedFile(shopkeeper.shopBanner);
                shopkeeper.shopBanner = uploadedPath(banner);
            }

            await shopkeeper.save();

            res.json({
                success: true,
                message: "Shop profile updated successfully.",
                shopkeeper: safeUser(shopkeeper)
            });
        } catch (error) {
            console.error("Update profile error:", error);

            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "That username is already taken."
                });
            }

            res.status(500).json({
                success: false,
                message: "Could not update shop profile."
            });
        }
    }
);

// -----------------------------------------------------
// 12. GET SHOP PRODUCTS
// GET /api/shopkeeper/:id/products
// -----------------------------------------------------

app.get(
    "/api/shopkeeper/:id/products",
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!validId(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid shopkeeper ID."
                });
            }

            const products = await Product.find({
                shopkeeperId: id
            }).sort({ createdAt: -1 });

            res.json({
                success: true,
                products
            });
        } catch (error) {
            console.error("Get products error:", error);

            res.status(500).json({
                success: false,
                message: "Could not load products."
            });
        }
    }
);

// -----------------------------------------------------
// 13. ADD PRODUCT
// POST /api/shopkeeper/:id/products
// Accepts multipart/form-data
// -----------------------------------------------------

app.post(
    "/api/shopkeeper/:id/products",
    upload.any(),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!validId(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid shopkeeper ID."
                });
            }

            const shopkeeper =
                await Shopkeeper.findById(id);

            if (!shopkeeper) {
                return res.status(404).json({
                    success: false,
                    message: "Shopkeeper not found."
                });
            }

            const { name, description, category, price, stock } =
                req.body;

            if (
                !name ||
                price === undefined ||
                price === "" ||
                !Number.isFinite(Number(price)) ||
                Number(price) < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Valid product name and price are required."
                });
            }

            const imageFiles = req.files || [];
            const imagePaths = imageFiles.map(uploadedPath);

            const product = await Product.create({
                shopkeeperId: id,
                name,
                description,
                category,
                price: Number(price),
                stock: Number(stock) || 0,
                image: imagePaths[0] || "",
                images: imagePaths
            });

            res.status(201).json({
                success: true,
                message: "Product added successfully.",
                product
            });
        } catch (error) {
            console.error("Add product error:", error);

            res.status(500).json({
                success: false,
                message: "Could not add product."
            });
        }
    }
);
// -----------------------------------------------------
// UPDATE PRODUCT
// PATCH /api/shopkeeper/:id/products/:productId
// -----------------------------------------------------

app.patch(
    "/api/shopkeeper/:id/products/:productId",
    upload.any(),
    async (req, res) => {
        try {
            const { id, productId } = req.params;

            if (!validId(id) || !validId(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid shopkeeper or product ID."
                });
            }

            // Confirm product belongs to this shopkeeper
            const product = await Product.findOne({
                _id: productId,
                shopkeeperId: id
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found."
                });
            }

            const body = req.body;

            // Accept different frontend field names
            const name =
                body.name ?? body.title ?? body.productName;

            const price =
                body.price ?? body.productPrice;

            if (name !== undefined) {
                if (!String(name).trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Product name cannot be empty."
                    });
                }

                product.name = String(name).trim();
            }

            if (price !== undefined && price !== "") {
                const numericPrice = Number(price);

                if (
                    !Number.isFinite(numericPrice) ||
                    numericPrice < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Enter a valid product price."
                    });
                }

                product.price = numericPrice;
            }

            if (body.description !== undefined) {
                product.description = body.description;
            }

            if (body.category !== undefined) {
                product.category = body.category;
            }

            if (body.stock !== undefined && body.stock !== "") {
                const numericStock = Number(body.stock);

                if (
                    !Number.isInteger(numericStock) ||
                    numericStock < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Stock must be a non-negative whole number."
                    });
                }

                product.stock = numericStock;
            }

            // Replace product image only if a new image is uploaded
            const imageFiles = req.files || [];
            const imagePaths = imageFiles.map(uploadedPath);

            if (imagePaths.length > 0) {
                const oldImages = [
                    product.image,
                    ...(product.images || [])
                ];

                product.image = imagePaths[0];
                product.images = imagePaths;

                await product.save();

                // Remove old images after successful save
                for (const oldImage of new Set(oldImages)) {
                    if (oldImage && !imagePaths.includes(oldImage)) {
                        removeUploadedFile(oldImage);
                    }
                }
            } else {
                await product.save();
            }

            return res.json({
                success: true,
                message: "Product updated successfully.",
                product
            });

        } catch (error) {
            console.error("Update product error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not update product."
            });
        }
    }
);
// -----------------------------------------------------
// 14. DELETE PRODUCT
// DELETE /api/shopkeeper/:id/products/:productId
// -----------------------------------------------------

app.delete(
    "/api/shopkeeper/:id/products/:productId",
    async (req, res) => {
        try {
            const { id, productId } = req.params;

            if (!validId(id) || !validId(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid shopkeeper or product ID."
                });
            }

            const product = await Product.findOneAndDelete({
                _id: productId,
                shopkeeperId: id
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found."
                });
            }

            removeUploadedFile(product.image);

            for (const image of product.images || []) {
                removeUploadedFile(image);
            }

            res.json({
                success: true,
                message: "Product deleted successfully."
            });
        } catch (error) {
            console.error("Delete product error:", error);

            res.status(500).json({
                success: false,
                message: "Could not delete product."
            });
        }
    }
);

// -----------------------------------------------------
// 15. GET USER BY ID
// GET /api/user/:id
// -----------------------------------------------------

app.get("/api/user/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load user."
        });
    }
});

// -----------------------------------------------------
// 16. ERROR HANDLER
// -----------------------------------------------------

app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message:
                err.code === "LIMIT_FILE_SIZE"
                    ? "Image must be 5 MB or smaller."
                    : err.message
        });
    }

    if (err.message?.includes("Only JPG")) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// -----------------------------------------------------
// 17. CONNECT DATABASE AND START SERVER
// -----------------------------------------------------

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(
                `ShopNest server running at http://localhost:${PORT}`
            );
        });
    })
    .catch(error => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    });
