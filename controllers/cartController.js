import userModel from "../models/userModel.js";

//add to cart
const addToCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = userData.cartData || {};
        if(!cartData[req.body.itemId])
        {
            cartData[req.body.itemId] = 1;
        }
        else
        {
            cartData[req.body.itemId] += 1;
        }
        await userModel.findByIdAndUpdate(req.body.userId, {cartData: cartData});
        res.json({success: true, message: "Thêm vào giỏ hàng thành công"});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: "Lỗi khi thêm vào giỏ hàng"});
    }
}

//remove from cart
const removeFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = userData.cartData || {};
        if(cartData[req.body.itemId] > 0){
            cartData[req.body.itemId] -= 1;
        }
        await userModel.findByIdAndUpdate(req.body.userId, {cartData: cartData});
        res.json({success: true, message: "Xóa khỏi giỏ hàng thành công"});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: "Lỗi khi xóa khỏi giỏ hàng"});
    }
}
//fetch cart
const getCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = userData.cartData;
        res.json({success: true, cartData});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: "Lỗi khi lấy giỏ hàng"});
    }
}

//clear cart
const clearCart = async (req, res) => {
    try {
        await userModel.findByIdAndUpdate(req.body.userId, {cartData: {}});
        res.json({success: true, message: "Xóa giỏ hàng thành công"});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: "Lỗi khi xóa giỏ hàng"});
    }
}

export {addToCart, removeFromCart, getCart, clearCart};
