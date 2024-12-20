import express from "express";
import {
    addAnswer,
    addQuestion,
    editCourse,
    getAllCourses,
    getCourseByUser,
    getSingleCourse,
    uploadCourse
} from "../controller/course.controller";
import {authorizeRoles, isAuthenticated} from "../middleware/auth";
const courseRoutes = express.Router();

courseRoutes.post("/create-course", isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRoutes.put("/edit-course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);
courseRoutes.get("/get-course/:id", getSingleCourse);
courseRoutes.get("/get-courses", getAllCourses);
courseRoutes.get("/get-course-content/:id", isAuthenticated,  getCourseByUser);
courseRoutes.put("/add-question", isAuthenticated,  addQuestion);
courseRoutes.put("/add-answer", isAuthenticated,  addAnswer);

export default courseRoutes;