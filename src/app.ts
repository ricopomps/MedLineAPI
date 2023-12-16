import cors from "cors";
import "dotenv/config";
import express from "express";
import session from "express-session";
import createHttpError from "http-errors";
import morgan from "morgan";
import passport from "passport";
import "./config/passport";
import sessionConfig from "./config/session";
import env from "./env";
import errorHandler from "./middlewares/errorHandler";
import userRoutes from "./routes/users";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", true);
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use(
  cors({
    origin: env.FRONT_URL,
    credentials: true,
  })
);

app.use(session(sessionConfig));

app.use(passport.authenticate("session"));

// app.use("/users", userRoutes);
app.get("/", (req, res) => res.json({ message: "working" }));
app.use("/users", userRoutes);

app.use((req, res, next) => next(createHttpError(404, "Endpoint not found")));

app.use(errorHandler);

export default app;
