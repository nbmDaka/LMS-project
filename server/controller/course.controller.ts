import express from "express";
import { CatchAsyncError} from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import {createCourse} from "../services/course.service";
import {courseModel} from "../models/course.model";
import {redis} from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";


// upload course
export const uploadCourse = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {
       const data = req.body;
       const thumbnail = data.thumbnail;
       if(thumbnail){
          const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
              folder: "courses"
          });

          data.thumbnail = {
              public_id: myCloud.public_id,
              url: myCloud.secure_url,
          };
       }

       createCourse(data, res, next);



   } catch (error: any) {
       return next(new ErrorHandler(error.message, 500))
   }
});

export const editCourse = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;

        if(thumbnail){
            await cloudinary.v2.uploader.destroy(thumbnail.public_id);

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        const courseId = req.params.id

        const course = await courseModel.findByIdAndUpdate(courseId, {
            $set: data},
            {new: true}
        );

        res.status(201).json({
            success: true,
            course,
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
});

// get single course --- without purchasing

export const getSingleCourse = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) =>{
    try {

        const courseId = req.params.id

        const isCacheExist = await redis.get(courseId)

        if(isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course,
            })
        }
        else {
        const course = await courseModel.findById(req.params.id).select(
            "-courseData.links -courseData.questions");

        await redis.set(courseId, JSON.stringify(course));

        res.status(200).json({
            success: true,
            course,
        })
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// get all courses --- without purchasing
export const getAllCourses = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) =>{
    try {

        const isCacheExist = await redis.get("allCourses")

        if(isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course,
            })
        } else {

            const courses = await courseModel.find().select(
                "-courseData.links -courseData.questions");

            await redis.set("allCourses", JSON.stringify(courses));

            res.status(200).json({
                success: true,
                courses,
            })
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// get course content  --- only for valid user
export const getCourseByUser = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
   try {
       const userCourseList = req.user?.courses;
       const courseId = req.params.id

       console.log(courseId);

       const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId);

       if(!courseExists) {
           return next(new ErrorHandler("You are not eligible access to this course", 404))
       }

       const course = await courseModel.findById(courseId);
       const content = course?.coursesData;

       res.status(200).json({
           success: true,
           content
       })

   } catch (error: any) {
       return next(new ErrorHandler(error.message, 500))
   }
});

// Add question in course
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {question, courseId, contentId }: IAddQuestionData = req.body;
        const course = await courseModel.findById(courseId);

        if(!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400));
        }

        const  courseContent = course?.coursesData?.find((item: any) =>item._id.equals(contentId))

        if(!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400))
        }

        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: [],
        }
        // add this question to our course content
        courseContent.questions.push(newQuestion);

        //save the updated course
        await course?.save();

        res.status(200).json({
            success: true,
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
});

// add answer in course question

interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {answer, courseId, contentId, questionId}: IAddAnswerData = req.body;

        const course = await courseModel.findById(courseId);

        if(!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400));
        }

        const  courseContent = course?.coursesData?.find((item: any) =>item._id.equals(contentId))

        if(!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400))
        }

        const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId));

        if(!question) {
            return next(new ErrorHandler("Invalid content id", 400))
        }

        //create a new answer object

        const newAnswer: any = {
            user: req.user,
            answer
        }

        // add this answer to our course content
        question.questionReplies?.push(newAnswer);

        await course?.save()

        if(req.user?._id === question.user._id) {
            // create a notification
        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title,

            }

            const html  = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data)

            try {
                await sendMail({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data
                })


            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500))
            }
        }

        res.status(200).json({
            success: true,
            course
        });

    } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
    }
});