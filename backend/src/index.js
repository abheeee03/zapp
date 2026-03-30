import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { userRouter } from "./routes/userRouter.js";
import { linkRouter } from "./routes/linkRouter.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/link", linkRouter);

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not set");
}

const PORT = Number(process.env.PORT || 8080);

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`starting server at ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect MongoDB", error);
    process.exit(1);
  }
};

startServer();