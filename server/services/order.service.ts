import express, {NextFunction, Response} from "express";
import {CatchAsyncError} from "../middleware/catchAsyncError";
import orderModel from "../models/orderModel";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";

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

// get all orders
export const getAllOrdersService = async(res: express.Response) => {
    const orders = await orderModel.find().sort({ createdAt: -1 });

    res.status(201).json({
        success: true,
        orders,
    })
}