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

//list order
const list_order = async (req, res) => {
  try {
    // Lấy tham số phân trang từ query nếu có
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Tạo các điều kiện tìm kiếm từ query
    const searchQuery = {};
    
    // Thêm điều kiện tìm kiếm theo trạng thái nếu có
    if (req.query.status) {
      searchQuery.status = req.query.status;
    }
    
    // Thêm điều kiện tìm kiếm theo thanh toán nếu có
    if (req.query.payment === 'true') {
      searchQuery.payment = true;
    } else if (req.query.payment === 'false') {
      searchQuery.payment = false;
    }
    
    // Thêm điều kiện tìm kiếm theo ngày nếu có
    if (req.query.startDate && req.query.endDate) {
      searchQuery.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Đếm tổng số đơn hàng thỏa mãn điều kiện
    const totalOrders = await Order.countDocuments(searchQuery);
    
    // Lấy danh sách đơn hàng
    const orders = await Order.find(searchQuery)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'); // Lấy thêm thông tin người dùng
    
    res.json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi khi lấy danh sách đơn hàng" });
  }
};

// Cập nhật đơn hàng từ admin (không cần đăng nhập)
const update_order_admin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, payment, note } = req.body;
    
    // Tìm và cập nhật đơn hàng
    const updateData = {};
    if (status) updateData.status = status;
    if (payment !== undefined) updateData.payment = payment;
    if (note) updateData.note = note;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    
    res.json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi khi cập nhật đơn hàng" });
  }
};

// Lấy chi tiết một đơn hàng
const get_order_detail = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('userId', 'name email');
    
    if (!order) {
      return res.json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi khi lấy chi tiết đơn hàng" });
  }
};

export {placeOrder, updateOrderStatus, userOrders, list_order, update_order_admin, get_order_detail};
