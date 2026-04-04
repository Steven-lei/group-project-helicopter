import { Router } from "express";
import { User } from "../models/User.js";
import { Pet } from "../models/Pet.js";
import { ok, fail } from "../utils/response.js";
import { Session } from "../models/Session.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? { email: email } : {};
    const users = await User.find(filter, "_id name email preferredLanguage");
    return ok(res, users);
  } catch (error) {
    return fail(res, error.message || "Failed to get users", 500);
  }
});
router.post("/", async (req, res) => {
  try {
    const { name, email, preferredLanguage } = req.body;
    if (!email) {
      return fail(res, "Email is required", 400);
    }
    const user = new User({
      name: name || null,
      email,
      preferredLanguage: preferredLanguage || "en",
    });
    await user.save();
    return ok(res, user);
  } catch (error) {
    return fail(res, error.message || "Failed to register user", 500);
  }
});
/**
 * GET /api/user
 * Optional query parameters:
 * - userid: string (filter by user ID)
 *
 * Returns a list of users with .
 */
router.get("/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const filter = userid ? { _id: userid } : {};
    const user = await User.find(filter, "_id name email preferredLanguage");
    if (!user) {
      return fail(res, "User not found", 404);
    }
    return ok(res, user);
  } catch (error) {
    return fail(res, error.message || "Failed to get user", 500);
  }
});
router.get("/:userid/pets", async (req, res) => {
  try {
    const { userid } = req.params;
    const filter = userid ? { _id: userid } : {};
    const userExists = await User.exists({ _id: userid });
    if (!userExists) {
      return fail(res, "User not found", 404);
    }
    const pets = await Pet.find({ owner: userid });
    return ok(res, pets);
  } catch (error) {
    return fail(res, error.message || "Failed to get user's pets", 500);
  }
});
router.post("/:userid/pets", async (req, res) => {
  try {
    const { userid } = req.params;
    const { petType } = req.body;
    const userExists = await User.exists({ _id: userid });
    if (!userExists) {
      return fail(res, "User not found", 404);
    }
    const newPet = new Pet({
      petType: petType,
      owner: userid,
    });
    await newPet.save();
    return res.status(201).json(newPet);
  } catch (error) {
    return fail(res, error.message || "Failed to create pet", 500);
  }
});
router.delete("/:userid/pets/:petid", async (req, res) => {
  try {
    const { userid, petid } = req.params;

    const deletedPet = await Pet.findOneAndDelete({
      _id: petid,
      owner: userid,
    });

    if (!deletedPet) {
      return fail(res, "Pet not found or does not belong to this user", 404);
    }

    return ok(res, { message: "Pet successfully removed" });
  } catch (error) {
    return fail(res, error.message || "Failed to remove pet", 500);
  }
});
router.patch("/:userid/pets/:petid", async (req, res) => {
  try {
    const { userid, petid } = req.params;
    console.log("Updating pet", { userid, petid, body: req.body });
    const { petType } = req.body;

    const updatedPet = await Pet.findOneAndUpdate(
      { _id: petid, owner: userid },
      { petType: petType },
      { new: true, runValidators: true },
    );

    if (!updatedPet) {
      return fail(res, "Pet not found", 404);
    }

    return ok(res, updatedPet);
  } catch (error) {
    return fail(res, error.message || "Failed to update pet", 500);
  }
});

router.get("/:userid/sessions", async (req, res) => {
  try {
    const { userid } = req.params;
    const sessions = await Session.find({ userId: userid }).sort({
      createdAt: -1,
    });
    return ok(res, sessions || []);
  } catch (error) {
    return fail(res, error.message || "Failed to get user's sessions", 500);
  }
});
export default router;
