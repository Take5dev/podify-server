import { Request, RequestHandler } from "express";
import { formidable, File } from "formidable";
// import path from "path";
// import * as fs from "node:fs/promises";

export interface RequestWithFiles extends Request {
  files?: { [key: string]: File };
}

export const parseFiles: RequestHandler = async (
  req: RequestWithFiles,
  res,
  next
) => {
  if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
    return res.status(422).json({ error: "Only Form-data supported" });

  //   const dir = path.join(__dirname, "../public/profiles");
  //   try {
  //     await fs.readdir(dir);
  //   } catch (err) {
  //     await fs.mkdir(dir);
  //   }

  const form = formidable({
    multiples: false,
    // uploadDir: dir,
    // filename(name, ext, part, form) {
    //   return Date.now() + "_" + part.originalFilename;
    // },
  });
  const [fields, files] = await form.parse(req);

  for (let key in fields) {
    const field = fields[key];
    if (field) {
      req.body[key] = field[0];
    }
  }

  for (let key in files) {
    const file = files[key];
    if (!req.files) {
      req.files = {};
    }
    if (file) {
      req.files[key] = file[0];
    }
  }

  next();
};
