import express from "express";
import {courseModel} from "../models/course.model";
import {CatchAsyncError} from "../middleware/catchAsyncError";

export const createCourse = CatchAsyncError(async(data: any, res: express.Response, next: express.NextFunction) => {
   const course = await courseModel.create(data);
   res.status(201).json({
       status: "success",
       course
   });
});