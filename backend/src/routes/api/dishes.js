import express from "express";
import { authMiddleware } from "../../midware/auth.js";
const router = express.Router();

const dishes = [
  {
    name: "Sichuan (川菜)",
    style: "Spicy and Numbing (麻辣)",
    dishes: [
      {
        id: "sc_001",
        name_en: "Kung Pao Chicken",
        name_zh: "宫保鸡丁",
        ingredients: [
          "Chicken",
          "Peanuts",
          "Dried Chili",
          "Sichuan Peppercorns",
        ],
        popularity: 5,
      },
      {
        id: "sc_002",
        name_en: "Mapo Tofu",
        name_zh: "麻婆豆腐",
        ingredients: ["Tofu", "Minced Beef", "Doubanjiang", "Chili Oil"],
        popularity: 5,
      },
    ],
  },
  {
    name: "Cantonese (粤菜)",
    style: "Fresh and Natural (鲜美)",
    dishes: [
      {
        id: "gd_001",
        name_en: "Dim Sum (Har Gow)",
        name_zh: "虾饺",
        ingredients: ["Shrimp", "Bamboo Shoots", "Wheat Starch Wrapper"],
        popularity: 5,
      },
      {
        id: "gd_002",
        name_en: "Steamed Fish",
        name_zh: "清蒸鱼",
        ingredients: ["Whole Fish", "Ginger", "Scallions", "Soy Sauce"],
        popularity: 4,
      },
    ],
  },
  {
    name: "Beijing (京菜)",
    style: "Royal and Savory (酱香/宫廷)",
    dishes: [
      {
        id: "bj_001",
        name_en: "Peking Duck",
        name_zh: "北京烤鸭",
        ingredients: ["Duck", "Pancakes", "Sweet Bean Sauce", "Cucumber"],
        popularity: 5,
      },
    ],
  },
  {
    name: "Zhejiang (浙菜)",
    style: "Refined and Sweet (精致/清淡)",
    dishes: [
      {
        id: "zj_001",
        name_en: "Dongpo Pork",
        name_zh: "东坡肉",
        ingredients: ["Pork Belly", "Shaoxing Wine", "Sugar", "Soy Sauce"],
        popularity: 4,
      },
    ],
  },
];

//router.get("/", authMiddleware, (req, res) => res.json(dishes));
//router.get("/:id", authMiddleware, (req, res) => {
router.get("/", (req, res) => res.json(dishes));

router.get("/:id", (req, res) => {
  const { id } = req.params;

  let foundDish = null;
  dishes.forEach((category) => {
    const dish = category.dishes.find((d) => d.id === id);
    if (dish) foundDish = dish;
  });

  if (foundDish) {
    res.json(foundDish);
  } else {
    res.status(404).json({ message: "Dish not found" });
  }
});

export default router;
