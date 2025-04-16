import express from "express";
import authMiddleware from "../middleware/auth.js";
import {placeOrder, updateOrderStatus} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/update-status", authMiddleware, updateOrderStatus);

export default orderRouter;
