import { Request, Response } from "express";
import ai from "../configs/ai.js";

export const listModels = async (req: Request, res: Response) => {
  try {
    const models = await ai.models.list();

    console.log(models);

    res.json(models);

  } catch (error:any) {
    res.status(500).json({
      message:error.message
    })
  }
};