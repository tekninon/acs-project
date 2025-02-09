const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const playerController = require("../controllers/playerController");

// Ajouter un joueur
router.post(
  "/add",
  [
    body("name").notEmpty().withMessage("Le nom du joueur est requis."),
    body("tier").isInt({ min: 1, max: 5 }).withMessage("Le tier doit être compris entre 1 et 5."),
    body("gameId").notEmpty().withMessage("L'ID du jeu est requis."),
  ],
  playerController.addPlayer
);

// Récupérer tous les joueurs
router.get("/all", playerController.getAllPlayers);

// Récupérer les joueurs par jeu
router.get("/by-game/:gameId", playerController.getPlayersByGame);

// Mettre à jour un joueur
router.put("/update/:playerId", playerController.updatePlayer);

// Classement des joueurs
router.get("/ranking", playerController.getRanking);

module.exports = router;