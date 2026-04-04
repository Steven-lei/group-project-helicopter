import dotenv from "dotenv";
import fs from "fs";
import { Topic } from "../models/Topic.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
dotenv.config();
async function clearDatabase() {
  await User.deleteMany();
  await Topic.deleteMany();

  console.log("Database cleared");
}
async function addUsers() {
  const usersData = JSON.parse(
    fs.readFileSync("./src/data/users.json", { encoding: "utf-8" }),
  );
  const users = usersData.map((u) => new User(u));
  await User.insertMany(users);
  console.log(`${users.length} users inserted into database`);
}
async function addTopics() {
  const topicsData = JSON.parse(
    fs.readFileSync("./src/data/topics.json", { encoding: "utf-8" }),
  );
  const topics = topicsData.map((t) => new Topic(t));
  await Topic.insertMany(topics);
  console.log(`${topics.length} topics  inserted into database`);
}
async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database!");
    await clearDatabase();

    //init users, usually they are administrators
    await addUsers();

    //init topics
    await addTopics();

    console.log(`Database initialization completed!`);
  } catch (error) {
    console.error("Error during database initialization:", error);
  } finally {
    // Ensure disconnection in case of error
    await mongoose.disconnect();
    console.log("Disconnected from database!");
  }
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
