import express from "express";
import {courseModel} from "../models/course.model";
import {CatchAsyncError} from "../middleware/catchAsyncError";
import userModel from "../models/user.model";

export const createCourse = CatchAsyncError(async(data: any, res: express.Response, next: express.NextFunction) => {
   const course = await courseModel.create(data);
   res.status(201).json({
       status: "success",
       course
   });
});

export const getAllCoursesService = async(res: express.Response) => {
    const courses = await courseModel.find().sort({ createdAt: -1 });

    res.status(201).json({
        success: true,
        courses,
    })
}