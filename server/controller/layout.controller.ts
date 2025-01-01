import express from "express";
import ErrorHandler from "../utils/ErrorHandler";
import layoutModel from "../models/layout.model";
import {CatchAsyncError} from "../middleware/catchAsyncError";
import cloudinary from "cloudinary";
import LayoutModel from "../models/layout.model";


//create layout
export const createLayout = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {type} = req.body;

        const isTypeExist = await LayoutModel.findOne({ type })

        if(isTypeExist){
            return next(new ErrorHandler(`${type} already exist`, 400))
        }

        if(type === "Banner") {
            const {image,title, subtitle} = req.body;
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout"
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subtitle,
            }
            await layoutModel.create(banner)
        }

        if(type === "FAQ") {
            const {faq} = req.body;
            const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer
                    }
                })
            )
            await LayoutModel.create({type: "FAQ", faq: faqItems})
        }

        if(type === "Categories") {
            const {categories} = req.body;
            const categoryItems = await Promise.all(
                categories.map(async (item: any) => {
                    return {
                        title: item.title
                    }
                })
            )
            await LayoutModel.create({type: "Categories", categories: categoryItems})
        }

        res.status(200).json({
            success: true,
            message: "Successfully created layout",
        })


    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// {
//     "type": "FAQ",
//     "faq": [
//     {
//         "question": "Why are you doing this project",
//         "answer": "For github and or experience"
//     },
//     {
//         "question": "Why are you doing this project",
//         "answer": "For github"
//     },
//     {
//         "question": "Why are you doing this project",
//         "answer": "For experience"
//     }
// ]
// }
