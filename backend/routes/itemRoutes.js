const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Item = require("../models/Item");
const auth = require("../middleware/authMiddleware");
const fs = require("fs");

const { getItemById } = require("../controllers/itemController");

// ================= MULTER =================
const upload = multer({ dest: "uploads/" });


// ================= CREATE ITEM =================
router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, category, type, location } = req.body;

    // ✅ VALIDATION
    if (!title || !description || !category || !type || !location) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    let imageUrls = [];

    // ================= IMAGE UPLOAD =================
    if (req.files && req.files.length > 0) {
      try {
        // 🚀 PARALLEL UPLOAD (FAST)
        const uploadPromises = req.files.map(file =>
          cloudinary.uploader.upload(file.path)
            .then(result => result.secure_url)
            .catch(err => {
              console.error("Cloudinary Upload Error:", err);
              return null;
            })
        );

        const results = await Promise.all(uploadPromises);

        // remove failed uploads
        imageUrls = results.filter(url => url !== null);

      } catch (err) {
        console.error("UPLOAD PROCESS ERROR:", err);
      } finally {
        // 🧹 CLEANUP TEMP FILES (NON-BLOCKING)
        req.files.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      }
    }

    // ================= CREATE ITEM =================
    const item = await Item.create({
      title,
      description,
      category,
      type,
      location,
      landmark: req.body.landmark || "",
      date: req.body.date || "",
      time: req.body.time || "",
      images: imageUrls,
      user: req.userId
    });

    // ✅ ALWAYS RETURN RESPONSE
    return res.status(201).json(item);

  } catch (err) {
    console.error("CREATE ITEM ERROR:", err);
    return res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET MY ITEMS =================
router.get("/my", auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json(items);

  } catch (err) {
    console.error("GET MY ITEMS ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET ALL ITEMS (FILTER + SEARCH + PAGINATION) =================
router.get("/", async (req, res) => {
  try {
    let {
      type = "all",
      category = "all",
      search = "",
      sort = "newest",
      page = 1,
      limit = 8
    } = req.query;

    // ✅ SAFE PARSING
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 8;

    let query = {};

    // ================= FILTER =================
    if (type !== "all") {
      query.type = type;
    }

    if (category !== "all") {
      query.category = category;
    }

    // ================= SEARCH =================
    if (search.trim() !== "") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // ================= SORT =================
    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const skip = (page - 1) * limit;

    // ================= QUERY =================
    const items = await Item.find(query)
      .populate("user", "firstName lastName")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Item.countDocuments(query);

    // ✅ CONSISTENT RESPONSE FORMAT
    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error("GET ITEMS ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET SINGLE ITEM =================
// ⚠️ KEEP THIS LAST
router.get("/:id", getItemById);


module.exports = router;