import { Router } from "express";
import { getProducts, createProduct, updateProduct, deleteProduct, createSale, getSales, getSaleStats } from "../controllers/shop.controller.js";
import { authGuard, roleGuard } from "../middlewares/auth.js";

const router = Router();

// Public : voir les produits
router.get("/products", getProducts);

router.use(authGuard);

// Membre + admin : achat boutique.
// Le controleur force l'acheteur au membre connecte sauf pour les admins.
router.post("/sales", createSale);

// Admin
router.use(roleGuard("ADMIN", "SUPER_ADMIN"));

router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/sales", getSales);
router.get("/sales/stats", getSaleStats);

export default router;
