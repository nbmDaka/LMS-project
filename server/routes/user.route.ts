import express from "express"
import {activateUser, registrationUser, loginUser, logoutUser} from "../controller/user.controller";
const userRouter = express.Router();

userRouter.post("/registration", registrationUser)
userRouter.post("/activate-user", activateUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout", logoutUser)

export default userRouter;