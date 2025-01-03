require('dotenv').config();
import express from 'express';
import userModel, {IUser} from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import {CatchAsyncError} from "../middleware/catchAsyncError";
import jwt, {JwtPayload, Secret} from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import {accessTokenOptions, refreshTokenOptions, sendToken} from "../utils/jwt";
import {redis} from "../utils/redis";
import {getAllUsersService, getUserById, updateUserRoleService} from "../services/user.service";
import UserModel from "../models/user.model";
import cloudinary from "cloudinary";


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
        const {email, password}: ILoginRequest = req.body;

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
        res.cookie("refresh_token", "", {maxAge: 1});

        const userId = req.user?._id as string;

        redis.del(userId);

        res.status(200).json({success: true, message: "Logged out successfully"});
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

//update access token

// export const updateAccessToken = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//         const refresh_token = req.cookies.refresh_token as string;
//         const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
//
//         const message = 'Could not refresh token';
//
//         if (!decoded) {
//             return next(new ErrorHandler(message, 400));
//         }
//
//         const session = await redis.get(decoded.id as string);
//
//         if (!session) {
//             return next(new ErrorHandler(message, 400));
//         }
//
//         const user = JSON.parse(session);
//
//         const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN as string, {
//             expiresIn: "5m",
//         });
//
//         const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN as string, {
//             expiresIn: "3d",
//         });
//
//         req.user = user;
//
//         res.cookie("access_token", accessToken, accessTokenOptions);
//         res.cookie("refresh_token", refresh_token, refreshTokenOptions);
//
//         res.status(200).json({
//             status: "success",
//             accessToken
//         });
//
//     } catch (error: any) {
//         return next(new ErrorHandler(error.message, 400));
//     }
// });

export const updateAccessToken = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;

        // Check if refresh token exists
        if (!refresh_token) {
            return next(new ErrorHandler("Refresh token not found. Please log in again.", 401));
        }

        let decoded: JwtPayload;

        // Verify the refresh token
        try {
            decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
        } catch (err: any) {
            // Handle expired refresh token
            if (err.name === "TokenExpiredError") {
                const decodedToken = jwt.decode(refresh_token);
                console.log("Decoded refresh token payload:", decodedToken); // Debugging

                if (!decodedToken || typeof decodedToken !== "object" || !("id" in decodedToken)) {
                    console.log("Invalid or malformed refresh token");
                    return next(new ErrorHandler("Invalid refresh token.", 401));
                }

                const expiredUserId = decodedToken.id;
                await redis.del(expiredUserId); // Remove expired session
                return next(new ErrorHandler("Session expired. Please log in again.", 401));
            }

            // Handle other token errors
            return next(new ErrorHandler("Invalid refresh token.", 401));
        }

        // Fetch session from Redis
        const session = await redis.get(decoded.id as string);
        if (!session) {
            return next(new ErrorHandler("Session not found. Please log in again.", 401));
        }

        // Session and refresh token are valid; generate new tokens
        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
            expiresIn: "5m", // Short-lived access token
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
            expiresIn: "3d", // Long-lived refresh token
        });

        // Update Redis session with new refresh token (optional: rotate tokens)
        await redis.set(user._id, JSON.stringify(user), "EX", 3 * 24 * 60 * 60); // Expire in 3 days

        // Send updated tokens to the client
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        res.status(200).json({
            status: "success",
            accessToken,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


// get user info
export const getUserInfo = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const userId = req.user?._id as string;
        await getUserById(userId, res)
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface ISocialAuthBody {
    email: string;
    name: string;
    avatar: string;
}

//social auth

export const socialAuth = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {email, name, avatar} = req.body as ISocialAuthBody;
        const user = await userModel.findOne({email});
        if (!user) {
            const newUser = await userModel.create({email, name, avatar});
            sendToken(newUser, 200, res);
        } else {
            sendToken(user, 200, res);
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user info
interface IUpdateUserInfo {
    name?: string;
    email?: string;
}

export const updateUserInfo = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {name, email} = req.body as IUpdateUserInfo;
        const userId = req.user?._id as string;
        const user = await userModel.findById(userId);

        if (email && user) {
            const isEmailExist = await userModel.findOne({email});
            if (isEmailExist) {
                return next(new ErrorHandler("Email already exist", 400));
            }
            user.email = email;
        }

        if (name && user) {
            user.name = name;
        }

        await user?.save();

        await redis.set(userId, JSON.stringify(user));

        res.status(201).json({
            success: true,
            message: "Updated successfully",
            user
        });

    } catch (error: any) {
        return new ErrorHandler(error.message, 400)
    }
});

// update user password

interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}

export const updatePassword = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {oldPassword, newPassword} = req.body as IUpdatePassword;

        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler("Please write old and new passwords", 400));
        }

        const user = await userModel.findById(req.user?._id as string).select("+password");

        if (user?.password === undefined) {
            return next(new ErrorHandler("Invalid User", 400));
        }

        const isPasswordMatch = await user?.comparePassword(oldPassword);

        if (!isPasswordMatch) {
            return next(new ErrorHandler("Passwords do not match", 400));
        }

        user.password = newPassword;

        await user.save();

        await redis.set(req.user?._id as string, JSON.stringify(user));

        res.status(201).json({
            success: true,
            message: "Updated successfully",

        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IUpdateProfilePicture {
    avatar: string;
}

// update profile picture

export const updateProfilePicture = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { avatar } = req.body as IUpdateProfilePicture;

        const userId = req.user?._id as string;
        const user = await userModel.findById(userId);

        if (avatar && user) {
            if (user?.avatar?.public_id) {
                // First delete the old image
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
            }

            // Upload new image
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
            });

            user.avatar = {
                public_id: myCloud.public_id, // Use `public_id` instead of `_id`
                url: myCloud.secure_url,
            };
        }

        await user?.save();
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

//get all users
export const getAllUsers = CatchAsyncError(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        await getAllUsersService(res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user role --- only admin

export const updateUserRole = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {
       const {id, role} = req.body;
       await updateUserRoleService(res, id, role)
   } catch (error: any) {
       return next(new ErrorHandler(error.message, 400));
   }
});

// delete user --- only admin

export const deleteUser = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {
       const userId = req.params.id

       const user = await userModel.findById(userId);

       if(!user) {
           return next(new ErrorHandler("User not found", 400));
       }

       await user.deleteOne({userId});

       await redis.del(userId);

       res.status(200).json({
           success: true,
           message: "Deleted successfully",
       })

   } catch (error: any) {
       return next(new ErrorHandler(error.message, 400));
   }
});
