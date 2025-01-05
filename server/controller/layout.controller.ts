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


// Edit layout
export const editLayout = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {type} = req.body;

        if(type === "Banner") {
            const BannerData: any = await LayoutModel.findOne({ type: "Banner" })
            const {image,title, subtitle} = req.body;
            if(BannerData){
                await cloudinary.v2.uploader.destroy(BannerData.image.public_id);
            }
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout"
            });
            const banner = {
                type: "Banner",
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subtitle,
            }
            await layoutModel.findByIdAndUpdate(BannerData._id,{banner})
        }

        if(type === "FAQ") {
            const {faq} = req.body;
            const faqItem = await layoutModel.findOne({type: "FAQ"})
            const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer
                    }
                })
            )
            await LayoutModel.findByIdAndUpdate(faqItem?._id,{type: "FAQ", faq: faqItems})
        }

        if(type === "Categories") {
            const {categories} = req.body;
            const categoriesItem = await layoutModel.findOne({type: "Categories"})

            const categoryItems = await Promise.all(
                categories.map(async (item: any) => {
                    return {
                        title: item.title
                    }
                })
            )

            console.log(categoryItems)
            await LayoutModel.create(categoriesItem?._id,{type: "Categories", categories: categoryItems})
        }

        res.status(200).json({
            success: true,
            message: "Successfully updated layout",
        })
    } catch(error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

//get layout by type
export const getLayoutByType = CatchAsyncError(async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const {type} = req.body
        const layout = await layoutModel.findOne({type});
        res.status(200).json({
            success: true,
            layout
        })

    } catch(error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})