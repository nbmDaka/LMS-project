import {Response, NextFunction, Request} from 'express';
import {CatchAsyncError} from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import orderModel, {IOrder} from "../models/orderModel";
import userModel from "../models/user.model";
import {courseModel} from "../models/course.model";
import path from "path"
import ejs from "ejs"
import sendMail from "../utils/sendMail";
import notificationModel from "../models/notificationModel";
import {newOrder} from "../services/order.service";


export const createOrder = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const {courseId, payment_info} = req.body as IOrder;

        const user  = await userModel.findById(req.user?._id);
        console.log("Fucking user", req.user)
        console.log("Fucking user 1 ", user)

        const courseExistInUser =user?.courses.some((course:any) => course._id.toString() === courseId);

        if(courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        const course = await courseModel.findById(courseId);

        if(!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
            courseId: courseId,
            payment_info: payment_info
        }


        const mailData = {
            order: {
                _id: course?._id,
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'numeric', day: 'numeric'}),
            }
        }

        const html = await ejs.renderFile(path.join(__dirname, "../mails/order-confirmation.ejs"), mailData);
        // 6.32.10

        try {
            if(user) {
                await sendMail({
                    email: user.email,
                    subject: "Order confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData
                })
            }


        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500))
        }

        user?.courses.push({courseId});

        await user?.save();

        await notificationModel.create({
            userId: user?._id,
            title: "NEW_ORDER",
            message: `New order for ${course.name} has been placed`
        });

        newOrder(data, res, next);

        // 6.41.08
        //fixing mail sending error
        // changing for github
        // adding something


    } catch (error: any) {
        throw new ErrorHandler(error.message, 500);
    }
});