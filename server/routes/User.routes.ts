import express from "express";
import { getThumnailbyId, getUsersThumbnails } from "../controllers/UserController.js";
import protect from "../middleware/auth.js";

const UserRouter = express.Router();


UserRouter.get('/thumbnails', protect, getUsersThumbnails)
UserRouter.get('/thumbnail/:id', protect, getThumnailbyId)

export default UserRouter;