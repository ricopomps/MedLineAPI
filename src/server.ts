import mongoose from "mongoose";
import dns from "node:dns";
import { httpServer } from "./app";
import env from "./env";
import "./websocket";
dns.setDefaultResultOrder("ipv4first");

const port = env.PORT;

mongoose
  .connect(env.MONGO_CONNECTION_STRING)
  .then(() => {
    console.log("Mongoose connected");
    httpServer.listen(port, () =>
      console.log("Server running on port: " + port)
    );
  })
  .catch(console.error);
