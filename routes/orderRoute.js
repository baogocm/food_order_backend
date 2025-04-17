import express from "express";
import authMiddleware from "../middleware/auth.js";
import {placeOrder, updateOrderStatus, userOrders, list_order, update_order_admin, get_order_detail} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Route dành cho người dùng (cần xác thực)
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/update-status", authMiddleware, updateOrderStatus);
orderRouter.get("/user-orders", authMiddleware, userOrders);

// Route dành cho admin (không yêu cầu xác thực)
orderRouter.get("/admin/orders", list_order);
orderRouter.get("/admin/order/:orderId", get_order_detail);
orderRouter.put("/admin/order/:orderId", update_order_admin);

export default orderRouter;
