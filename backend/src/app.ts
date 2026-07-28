import express from "express";
import cors from "cors";
import recommendationRoutes from "./routes/recommendation.routes";
import authRoutes from "./routes/auth.routes";
import meRoutes from "./routes/me.routes";
import playlistRoutes from "./routes/playlist.routes";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", recommendationRoutes);
app.use("/api", meRoutes);
app.use("/api", playlistRoutes);

export default app;
