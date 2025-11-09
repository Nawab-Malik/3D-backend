const express = require("express");
const {
  getProducts,
  getProductById,
  getRelatedProducts,
} = require("../controllers/productcontroller");
const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/:id/related", getRelatedProducts);

module.exports = router;
