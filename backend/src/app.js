import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { initFireBase } from "../configs/firebase.js";
import router from "./routes/routes.js";
import chalk from "chalk";
import { whitelist } from "../configs/whiltelist.js";
dotenv.config();
const PORT = process.env.PORT ?? 3000;

initFireBase();
var app = express();

console.log("cors allowing from", whitelist);
const corsOption = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOption));
app.use(express.json());
app.use("/", router);

app.listen(PORT, function () {
  console.log(chalk.green(`backend is listening on port ${PORT}!`));
  console.log(
    chalk.green.bold("    ➜    ") +
      chalk.white("Local:    ") +
      chalk.blue(`http://localhost:${PORT}`),
  );
});
