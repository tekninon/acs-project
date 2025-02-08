const express = require("express");
const router = express.Router();
const Game = require("../models/Game");

// Créer un nouveau jeu
router.post("/add", async (req, res) => {
  const { name, description } = req.body;
  try {
    const newGame = new Game({ name, description });
    await newGame.save();
    res.status(201).json({ message: "Game added!", game: newGame });
  } catch (error) {
    res.status(500).json({ message: "Error adding game", error });
  }
});

// Récupérer tous les jeux
router.get("/all", async (req, res) => {
  try {
    const games = await Game.find();
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: "Error fetching games", error });
  }
});

module.exports = router;
