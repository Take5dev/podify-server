import { Request } from "express";

export interface UpdateHistory extends Request {
  body: {
    audioId: string;
    progress: number;
    date: Date;
  };
}

export interface DeleteHistory extends Request {
  query: {
    audioIds?: string;
    all?: "yes" | "no";
  };
}
