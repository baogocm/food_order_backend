import express from "express";
import {addToCart, removeFromCart, getCart} from "../controllers/cartController.js";
import auth from "../middleware/auth.js";   

const router = express.Router();

router.post("/add", auth, addToCart);
router.post("/remove", auth, removeFromCart);
router.post("/get", auth, getCart);

export default router;
