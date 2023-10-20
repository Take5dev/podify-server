import { Request } from "express";

export interface CreatePlaylist extends Request {
  body: {
    title: string;
    audioId?: string;
    visibility?: "public" | "private";
  };
}

export interface DeletePlaylist extends Request {
  body: {
    audioId?: string;
    all?: "yes" | "no";
  };
}
