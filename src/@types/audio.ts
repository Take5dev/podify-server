import { RequestWithFiles } from "@/middleware/fileParser";
import { categoriesTypes } from "@/utils/audio_category";
import { Request } from "express";

export interface CreateAudio extends Request, RequestWithFiles {
  body: {
    title: string;
    about?: string;
    category: categoriesTypes;
  };
}
