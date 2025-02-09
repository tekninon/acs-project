const { body, validationResult } = require("express-validator");
const Game = require("../models/Game");

exports.addGame = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  try {
    const newGame = new Game({ name, description });
    await newGame.save();
    res.status(201).json({ message: "Game added!", game: newGame });
  } catch (error) {
    res.status(500).json({ message: "Error adding game", error });
  }
};

exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find();
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: "Error fetching games", error });
  }
};
