const express = require("express");
const router = express.Router();
const Player = require("../models/Player");

// Ajouter un joueur
router.post("/add", async (req, res) => {
  const { name, tier, gameId } = req.body; 
  try {
    const newPlayer = new Player({ name, tier, gameId });
    await newPlayer.save();
    res.status(201).json({ message: "Player added!", player: newPlayer });
  } catch (error) {
    res.status(500).json({ message: "Error adding player", error });
  }
});

// Récupérer tous les joueurs
router.get("/all", async (req, res) => {
  try {
    const players = await Player.find().populate("gameId", "name");
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Error fetching players", error });
  }
});

// Récupérer les joueurs par jeu
router.get("/by-game/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;
    const players = await Player.find({ gameId }).populate("gameId", "name");
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Error fetching players for game", error });
  }
});

// Classement des joueurs
// router.get("/ranking", async (req, res) => {
//   try {
//     const players = await Player.find().sort({ score: -1 });
//     res.status(200).json(players);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching ranking", error });
//   }
// });

router.get("/ranking", async (req, res) => {
  try {
    const ranking = await Player.aggregate([
      {
        $group: {
          _id: "$name", // Grouper les joueurs par nom
          totalScore: { $sum: "$score" }, // Additionner tous leurs scores
          gamesPlayed: { $addToSet: "$gameId" } // Liste unique des jeux joués
        }
      },
      {
        $project: {
          name: "$_id",
          totalScore: 1,
          gamesCount: { $size: "$gamesPlayed" } // Nombre total de jeux joués
        }
      },
      { $sort: { totalScore: -1 } } // Trier par score décroissant
    ]);

    res.status(200).json(ranking);
  } catch (error) {
    console.error("Erreur lors de la récupération du classement :", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
});


// Mettre à jour le score d'un joueur
router.post("/update-score", async (req, res) => {
  try {
    const { playerId, scoreAdjustment } = req.body;
    
    if (!playerId || scoreAdjustment == null) {
      return res.status(400).json({ message: "playerId and scoreAdjustment are required." });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found." });
    }

    // Mettre à jour le score
    player.score += scoreAdjustment;
    await player.save();

    res.status(200).json({ message: "Player score updated successfully.", player });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating player score", error });
  }
});

// Récupérer le score d'un joueur spécifique
router.get("/:playerId", async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found." });
    }

    res.status(200).json({ name: player.name, score: player.score, tier: player.tier });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching player score", error });
  }
});

// Modifier un joueur
router.put("/update/:playerId", async (req, res) => {
  try {
    const { playerId } = req.params;
    const { name, tier } = req.body;

    // Validation des champs
    if (!name && tier == null) {
      return res.status(400).json({ message: "At least one field (name or tier) must be provided." });
    }

    const updates = {};
    if (name) updates.name = name;
    if (tier != null) updates.tier = tier;

    const updatedPlayer = await Player.findByIdAndUpdate(playerId, updates, {
      new: true, // Retourne le document mis à jour
      runValidators: true, // Applique les validateurs de schéma
    });

    if (!updatedPlayer) {
      return res.status(404).json({ message: "Player not found." });
    }

    res.status(200).json({ message: "Player updated successfully.", player: updatedPlayer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating player", error });
  }
});




module.exports = router;
