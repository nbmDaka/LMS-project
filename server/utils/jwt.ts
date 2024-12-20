require('dotenv').config()
import express from 'express';
import { IUser } from '../models/user.model'
import { redis } from "./redis"

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?:boolean;
}

export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
export const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);

// options for cookies
export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};

export const sendToken = (user: IUser, statusCode: number, res: express.Response ) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // upload session to redis
        redis.set(user.id, JSON.stringify(user) as any)

    // parse environment variables to integrate with fallback


    // only set secure to trie in production
    if(process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true;
    }

    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        message: "User authenticated successfully",
        accessToken,
        refreshToken,
    })

}