import express from "express";
import {editCourse, getAllCourses, getSingleCourse, uploadCourse} from "../controller/course.controller";
import {authorizeRoles, isAuthenticated} from "../middleware/auth";
const courseRoutes = express.Router();

courseRoutes.post("/create-course", isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRoutes.put("/edit-course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);
courseRoutes.get("/get-course/:id", isAuthenticated, authorizeRoles("admin"), getSingleCourse);
courseRoutes.get("/get-courses", isAuthenticated, authorizeRoles("admin"), getAllCourses);

export default courseRoutes;