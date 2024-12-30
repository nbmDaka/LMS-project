import express from "express";
import {redis} from "../utils/redis";
import userModel from "../models/user.model";


// get user by id
export const getUserById = async(id: string, res: express.Response) => {
    const userJson = await redis.get(id)

    if(userJson) {
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user
        });
    }
}

export const getAllUsersService = async(res: express.Response) => {
    const users = await userModel.find().sort({ createdAt: -1 });

    res.status(201).json({
        success: true,
        users,
    })
}

// update user role
export const updateUserRoleService = async(res: express.Response, id: string, role: string) => {
    const user = await userModel.findByIdAndUpdate(id, {role}, {new: true})

    res.status(201).json({
        success: true,
        user,
    })
};