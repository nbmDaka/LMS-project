// require('dotenv').config();
// import { Request, Response, NextFunction } from 'express';
// import userModel, {IUser} from "../models/user.model";
// import ErrorHandler from "../utils/ErrorHandler";
// import { CatchAsyncError } from "../middleware/catchAsyncErrors";
// import jwt = require("jsonwebtoken");
//
// interface IRegistrationBody{
//     name: string;
//     email: string;
//     password: string;
//     avatar?: string;
// }
//
// export const registrationUser = CatchAsyncError(async (req,res,next) => {
//     try{
//         const {name, email, password} = req.body;
//
//         const isEmailExist = await userModel.findOne({email:email});
//         if(!isEmailExist){
//             return next(new ErrorHandler("Email already Exist", 400))
//         }
//
//         const user:IRegistrationBody = {
//             name,
//             email,
//             password,
//         };
//
//         const activationToken = createActivationToken(user);
//
//
//     } catch(error: any) {
//         return next(new ErrorHandler(error.message,400))
//     }
// });
//
// interface IActivationToken {
//     token: string;
//     activationCode: string;
// }
//
// export const createActivationToken = (user: IUser): IActivationToken => {
//     const activationCode = Math.floor(1000 + Math.random() * 9000 ).toString();
//
//     const token = jwt.sign({
//         user, activationCode
//     },process.env.ACTIVATION_SECRET,{
//         expiresIn: '5m'
//         });
//     return  {token, activationCode};
// }