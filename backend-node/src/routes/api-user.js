import { Router } from "express";
import { User } from "../models/User.js";
import { Pet } from "../models/Pet.js";
import { ok, fail } from "../utils/response.js";
import { Session } from "../models/Session.js";
import mongoose from "mongoose";

const router = Router();

const validateIds = (...ids) => {
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`Invalid ID format: ${id}`);
      error.statusCode = 400;
      throw error;
    }
  }
};

router.get("/", async (req, res) => {
  const { email } = req.query;
  const filter = email ? { email: email } : {};
  const users = await User.find(
    filter,
    "_id name email preferredLanguage",
  ).lean();
  return ok(res, users);
});
router.post("/", async (req, res) => {
  const { name, email, preferredLanguage } = req.body;
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }
  const user = new User({
    name: name || null,
    email,
    preferredLanguage: preferredLanguage || "en",
  });
  await user.save();
  return ok(res, user, 201);
});
router.patch("/:userid", async (req, res) => {
  const { userid } = req.params;
  validateIds(userid);
  const { name, preferredLanguage } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    userid,
    { name, preferredLanguage },
    { new: true, runValidators: true },
  ).lean();
  if (!updatedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return ok(res, updatedUser);
});
router.delete("/:userid", async (req, res) => {
  const { userid } = req.params;
  validateIds(userid);
  const deletedUser = await User.findByIdAndDelete(userid).lean();
  if (!deletedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return ok(res, { message: "User successfully deleted" });
});

router.get("/:userid", async (req, res) => {
  const { userid } = req.params;
  validateIds(userid);
  const user = await User.findById(
    userid,
    "_id name email preferredLanguage",
  ).lean();
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return ok(res, user);
});
router.get("/:userid/pets", async (req, res) => {
  const { userid } = req.params;
  validateIds(userid);
  console.log("Fetching pets for user", userid);
  const userExists = await User.exists({ _id: userid });
  if (!userExists) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const pets = await Pet.find({ owner: userid }).lean();
  return ok(res, pets);
});
router.post("/:userid/pets", async (req, res) => {
  const { userid } = req.params;
  const { petType } = req.body;
  validateIds(userid);
  const userExists = await User.exists({ _id: userid });
  if (!userExists) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const newPet = new Pet({
    petType: petType,
    owner: userid,
  });
  await newPet.save();
  return ok(res, newPet, 201);
});
router.delete("/:userid/pets/:petid", async (req, res) => {
  const { userid, petid } = req.params;
  validateIds(userid, petid);
  const deletedPet = await Pet.findOneAndDelete({
    _id: petid,
    owner: userid,
  });

  if (!deletedPet) {
    const error = new Error("Pet not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  return ok(res, { message: "Pet successfully removed" });
});
router.patch("/:userid/pets/:petid", async (req, res) => {
  const { userid, petid } = req.params;
  validateIds(userid, petid);
  const { petType } = req.body;

  const updatedPet = await Pet.findOneAndUpdate(
    { _id: petid, owner: userid },
    { petType: petType },
    { new: true, runValidators: true },
  ).lean();

  if (!updatedPet) {
    const error = new Error("Pet not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  return ok(res, updatedPet);
});

router.get("/:userid/sessions", async (req, res) => {
  const { userid } = req.params;
  validateIds(userid);
  const userExists = await User.exists({ _id: userid });
  if (!userExists) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const sessions = await Session.find({ userId: userid })
    .sort({
      createdAt: -1,
    })
    .lean();
  return ok(res, sessions);
});
export default router;
