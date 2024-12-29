import express from "express"
import {
    activateUser,
    registrationUser,
    loginUser,
    logoutUser,
    updateAccessToken,
    getUserInfo, socialAuth, updateUserInfo, updatePassword, updateProfilePicture, getAllUsers
} from "../controller/user.controller";
import {isAuthenticated, authorizeRoles} from "../middleware/auth";
const userRouter = express.Router();

userRouter.post("/registration", registrationUser)
userRouter.post("/activate-user", activateUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout", isAuthenticated, logoutUser)
userRouter.get("/refresh", updateAccessToken)
userRouter.get("/user", isAuthenticated,getUserInfo)
userRouter.post("/social-auth", socialAuth)
userRouter.put("/user-info", isAuthenticated, updateUserInfo)
userRouter.put("/user-password", isAuthenticated, updatePassword)
userRouter.put("/user-avatar", isAuthenticated, updateProfilePicture)
userRouter.get("/get-users", isAuthenticated, authorizeRoles("admin"), getAllUsers)

export default userRouter;