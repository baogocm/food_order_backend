import Order from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//placing an order
const placeOrder = async (req, res) => {

  const frontend_url = "http://localhost:5173";

   try {
    const newOrder = new Order({
      userId: req.user._id,
      items: req.body.cartItems,
      amount: req.body.amount,
      address: req.body.address,
      status: "Đang chờ",
      date: new Date(),
      payment: false,
    });
    
    await newOrder.save();
    // Cập nhật giỏ hàng người dùng thành rỗng sau khi đặt hàng
    await userModel.findByIdAndUpdate(req.user._id, {cartData: {}});

    const line_items = req.body.cartItems.map((item)=>{
      return {
        price_data: {
          currency: "vnd",
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      }
    })
    line_items.push({
      price_data: {
        currency: "vnd",
        product_data: {
          name: "Phí vận chuyển",
        },
        unit_amount: 2*100,
      },
      quantity: 1,
    });
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&order_id=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&order_id=${newOrder._id}`,
    })
    res.json({success: true, session_url: session.url});
  } catch (error) {
    console.error("Lỗi đặt hàng:", error);
    res.json({success: false, message:"Error"});
   }
}

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, payment } = req.body;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, payment },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    
    // Đảm bảo xóa giỏ hàng của người dùng
    await userModel.findByIdAndUpdate(req.user._id, { cartData: {} });
    
    res.json({ 
      success: true, 
      message: "Cập nhật trạng thái đơn hàng thành công",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng" });
  }
};

//order's user for frontend
const userOrders = async (req, res) => {
  try {
    console.log("User ID:", req.user._id);
    
    // Tìm tất cả đơn hàng của người dùng, sắp xếp theo thời gian giảm dần (mới nhất lên đầu)
    const orders = await Order.find({ userId: req.user._id })
      .sort({ date: -1 });
    
    console.log("Đơn hàng tìm thấy:", orders.length);
    
    if (!orders || orders.length === 0) {
      return res.json({ success: true, orders: [], message: "Bạn chưa có đơn hàng nào" });
    }
    
    // Log một số thông tin về đơn hàng đầu tiên để debug
    if (orders.length > 0) {
      console.log("Mẫu đơn hàng:", {
        id: orders[0]._id,
        items: orders[0].items,
        hasItems: Array.isArray(orders[0].items),
        itemsLength: Array.isArray(orders[0].items) ? orders[0].items.length : 0
      });
    }
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi khi lấy danh sách đơn hàng" });
  }
};

export {placeOrder, updateOrderStatus, userOrders};
