import {NextFunction, Response} from "express";
import {CatchAsyncError} from "../middleware/catchAsyncError";
import orderModel from "../models/orderModel";
import ErrorHandler from "../utils/ErrorHandler";

// Create new order

export const newOrder = CatchAsyncError(async(data:any,res:Response, next: NextFunction) => {
    try {
        const order = await orderModel.create(data);
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
});