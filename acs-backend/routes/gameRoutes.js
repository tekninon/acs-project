const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const gameController = require("../controllers/gameController");

router.post(
  "/add",
  [
    body("name").notEmpty().withMessage("Le nom du jeu est requis."),
    body("description").optional().isString(),
  ],
  gameController.addGame
);

router.get("/all", gameController.getAllGames);

module.exports = router;
