import userModel from "../models/user.model";
import express from "express";


// get user by id
export const getUserById = async(id: string, res: express.Response) => {
    const user = await userModel.findById(id)
    res.status(201).json({
        success: true,
        user
    })
}