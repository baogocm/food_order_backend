import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const {token} = req.headers;
    if(!token){
        return res.json({success: false, message: "Không có token, đăng nhập để tiếp tục"});
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { _id: token_decode.id };
        next();
    } catch (error) {
        return res.json({success: false, message: "Token không hợp lệ"});
    }
}
export default auth;