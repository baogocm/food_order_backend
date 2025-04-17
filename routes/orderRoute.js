import express from "express";
import authMiddleware from "../middleware/auth.js";
import {placeOrder, updateOrderStatus, deleteOrder, userOrders, list_order} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/update-status", updateOrderStatus);
orderRouter.post("/delete", deleteOrder);
orderRouter.get("/user-orders", authMiddleware, userOrders);
orderRouter.get("/list", list_order);

export default orderRouter;
