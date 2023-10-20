import mongoose from "mongoose";
import { DB_URL } from "@/utils/variables";

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log("DB Connection Failed: ", err);
  });
