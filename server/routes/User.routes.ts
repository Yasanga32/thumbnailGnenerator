import express from "express";
import { getThumnailbyId, getUsersThumbnails } from "../controllers/UserController.js";

const UserRouter = express.Router();


UserRouter.get('/thumbnails',getUsersThumbnails)
UserRouter.get('/thumbnail/:id',getThumnailbyId)

export default UserRouter;