import {CatchAsyncError} from "../middleware/catchAsyncError";
import express from "express";
import ErrorHandler from "../utils/ErrorHandler";
import {generateLast12MonthData} from "../utils/analytics.generator";
import userModel from "../models/user.model";
import {courseModel} from "../models/course.model";
import orderModel from "../models/orderModel";


// get user analytics
export const getUserAnalytics = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {

       const users = await generateLast12MonthData(userModel);

       res.status(200).json({
           success: true,
           users,
       })

   } catch (error: any) {
       next(new ErrorHandler(error.message, 500))
   }
});

// get courses analytics
export const getCourseAnalytics = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {

       const courses = await generateLast12MonthData(courseModel);

       res.status(200).json({
           success: true,
           courses,
       })

   } catch (error: any) {
       next(new ErrorHandler(error.message, 500))
   }
});

// get order analytics
export const getOrderAnalytics = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {

       const orders = await generateLast12MonthData(orderModel);

       res.status(200).json({
           success: true,
           orders,
       })

   } catch (error: any) {
       next(new ErrorHandler(error.message, 500))
   }
});