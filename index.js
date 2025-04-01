import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectToDatabase from "./config/connectToDatabase.js";
import authRoutes from "./routes/authRoutes.js";
import corse from "cors";
import postRoutes from "./routes/postRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  corse({
    origin:
      "https://social-app-frontend-git-main-usamaa7meds-projects.vercel.app/",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the socialApp API" });
});

app.listen(process.env.PORT, async (req, res) => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

connectToDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.use((error, req, res, next) => {
  res
    .status(error.statusCode || 500)
    .json({ status: error.statusText || "error", message: error.message });
});
