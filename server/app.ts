require('dotenv').config();
import express from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import {ErrorMiddleware} from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRoutes from "./routes/course.route";

//body parser
app.use(express.json({limit: "50mb"}));

// cookie parser
app.use(cookieParser());

// cors => cross origin resourse sharing
app.use(cors({
    origin: process.env.ORIGIN,
}));

app.use("/api/v1", userRouter)

app.use("/api/v1", courseRoutes)

// testing api
app.get("/test", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(200).json({
        status: "success",
        message: "Welcome Backend!",
    })
})

app.all("*", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
})

app.use(ErrorMiddleware);
