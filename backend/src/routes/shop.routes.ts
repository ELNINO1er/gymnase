import { Router } from "express";
import { getProducts, createProduct, updateProduct, deleteProduct, createSale, getSales, getSaleStats } from "../controllers/shop.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : voir les produits
router.get("/products", getProducts);

// Admin
router.use(authGuard);
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/sales", createSale);
router.get("/sales", getSales);
router.get("/sales/stats", getSaleStats);

export default router;
