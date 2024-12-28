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

        const userId = req.user?._id as string;

        const user  = await userModel.findById(userId);

        const courseExistInUser =user?.courses.some((course:any) => course.courseId.toString() === courseId);

        if(courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        const course = await courseModel.findById(courseId);

        if(!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
            userId: userId,
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

        if(course.purchased) {
            course.purchased += 1;
        }

        await course.save();

        newOrder(data, res, next);



    } catch (error: any) {
        throw new ErrorHandler(error.message, 500);
    }
});


