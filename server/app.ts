import cookieParser = require("express");
import express = require("express");
import cors = require("cors");
require('dotenv').config();
export const app = express();
import { ErrorMiddleware }  from "./middleware/errors";

//Body Parser
app.use(express.json({limit: "50mb"}));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(cors({
    origin: process.env.CORS_ORIGIN,

}));

// testing API
app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Hello World",
    })

})

// unknown route

app.all("*", (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`) as any;
    error.statusCode = 404;
    next(error);
})

app.use(ErrorMiddleware);