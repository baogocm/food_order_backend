import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

//login
const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "Tài khoản không tồn tại"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.json({success: false, message: "Mật khẩu không đúng"});
        }
        const token = createToken(user._id);
        res.json({success: true, message: "Đăng nhập thành công", token});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"});
    }
}


const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "30d"});
}
//register
const register = async (req, res) => {
    const {name, email, password} = req.body;
    try {
       const exists = await userModel.findOne({email});
       if(exists){
        return res.json({success: false, message: "Da co tai khoan"});
    }
    if(!validator.isEmail(email)){
        return res.json({success: false, message: "Email khong hop le"});
    }
    if(password.length < 8){
        return res.json({success: false, message: "Mat khau phai co it nhat 8 ky tu"});
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
        name,
        email,
        password: hashedPassword
    })
    const user = await newUser.save();
    const token = createToken(user._id);
    res.json({success: true, message: "Tao tai khoan thanh cong", token});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"});
    }
}
export {login, register};
