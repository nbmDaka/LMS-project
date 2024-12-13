import UserModel from "../models/user.model";

require('dotenv').config();
import express from 'express';
import userModel, {IUser} from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import {CatchAsyncError} from "../middleware/catchAsyncError";
import jwt, {Secret} from "jsonwebtoken";
import ejs from "ejs"
import sendMail from "../utils/sendMail";
import path from "path";
import {sendToken} from "../utils/jwt";


//register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {name, email, password} = req.body;

        const isEmailExist = await userModel.findOne({email})
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exist", 400))
        }

        const user: IRegistrationBody = {
            name,
            email,
            password,
        };

        const activationToken = createActivationToken(user)

        const activationCode = activationToken.activationCode

        const data = {user: {name: user.name}, activationCode}
        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data
            });

            res.status(201).json({
                success: true,
                message: `Please check your email ${user.email} to activate your account`,
                activationToken: activationToken.token
            })

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET as Secret, {expiresIn: "5m"});

    return {token, activationCode};
};

// Activate user

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {activation_token, activation_code} = req.body as IActivationRequest

        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser; activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid Activation Code", 400))
        }

        const {name, email, password} = newUser.user;

        const existUser = await userModel.findOne({email});

        if (existUser) {
            return next(new ErrorHandler("User already exist", 400))
        }

        const user = await UserModel.create({
            name,
            email,
            password
        });

        res.status(201).json({
            success: true,
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

// LogIn User

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {email, password} = req.body as ILoginRequest;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400))
        }
        const user = await userModel.findOne({email}).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 404))
        }

        const isPasswordMatch = await user.comparePassword(password)

        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 404))
        }

        sendToken(user, 200, res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// logout user

export const logoutUser = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        res.cookie("access_token", "", {maxAge: 1});
        res.status(200).json({success: true, message: "Logged out successfully"});
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})