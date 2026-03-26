import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";
import { GenerateContentConfig } from "@google/genai";
import {
  HarmCategory,
  HarmBlockThreshold
} from "@google/genai";
import ai from "../configs/ai.js";
import path from "node:path";
import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";

const stylePrompts = {
  "Bold & Graphic":
    "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
  "Tech/Futuristic":
    "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
  Minimalist:
    "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
  Photorealistic:
    "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
  Illustrated:
    "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style"
};

const colorSchemeDescriptions = {
  vibrant:
    "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
  sunset:
    "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
  forest:
    "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
  neon:
    "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
  purple:
    "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
  monochrome:
    "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
  ocean:
    "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
  pastel:
    "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic"
};

export const generateThumbnail = async (req: Request, res: Response) => {
  let filePath: string | null = null;

  try {
    const { userId } = req.session;

    // Authentication check
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay
    } = req.body;

    const thumbnail = await Thumbnail.create({
      userId,
      title,
      prompt_used: user_prompt,
      user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      isGenerating: true
    });

    const model = "gemini-3.1-flash-image-preview";

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspect_ratio || "16:9",
        imageSize: "1k"
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    };

    // safer default style
    const selectedStyle = style || "Bold & Graphic";

    let prompt = `Create a ${stylePrompts[selectedStyle as keyof typeof stylePrompts]} for: "${title}".`;

    if (color_scheme) {
      prompt += ` Use a ${colorSchemeDescriptions[
        color_scheme as keyof typeof colorSchemeDescriptions
        ]
        } color scheme.`;
    }

    if (user_prompt) {
      prompt += ` Additional details: ${user_prompt}.`;
    }

    prompt += ` The thumbnail should be ${aspect_ratio || "16:9"
      }, visually stunning, and designed to maximize click-through rate.
    Make it bold, professional, and impossible to ignore.`;

    // Generate image
    const response: any = await ai.models.generateContent({
      model,
      contents: [prompt],
      config: generationConfig
    });

    // Check response
    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Unexpected response");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) {
      throw new Error("Image generation failed");
    }

    const filename = `final-output-${Date.now()}.png`;
    filePath = path.join("images", filename);

    // create folder
    fs.mkdirSync("images", { recursive: true });

    // save image
    fs.writeFileSync(filePath, finalBuffer);

    // upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "image"
    });

    // update db
    thumbnail.image_url = uploadResult.secure_url;
    thumbnail.isGenerating = false;

    await thumbnail.save();

    res.json({
      message: "Thumbnail Generated",
      thumbnail
    });

  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: error.message
    });

  } finally {
    // cleanup file
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.log("File cleanup error:", error);
    }
  }
};


//Controller for thumbnail deltion
export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session;

    const deletedThumbnail = await Thumbnail.findOneAndDelete({ _id: id, userId })

    if (!deletedThumbnail) {
      return res.status(404).json({ message: "Thumbnail not found or unauthorized" })
    }

    res.json({ message: 'Thumbnail deleted successfully' })


  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: error.message
    });
  }
}