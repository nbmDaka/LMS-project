import express from "express";
import {editCourse, uploadCourse} from "../controller/course.controller";
import {authorizeRoles, isAuthenticated} from "../middleware/auth";
const courseRoutes = express.Router();

courseRoutes.post("/create-course", isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRoutes.put("/edit-course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);

export default courseRoutes;