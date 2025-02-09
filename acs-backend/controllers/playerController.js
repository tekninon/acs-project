const Player = require("../models/Player");

// Ajouter un joueur
exports.addPlayer = async (req, res) => {
  const { name, tier, gameId } = req.body;
  try {
    const newPlayer = new Player({ name, tier, gameId });
    await newPlayer.save();
    res.status(201).json({ message: "Player added!", player: newPlayer });
  } catch (error) {
    res.status(500).json({ message: "Error adding player", error });
  }
};

// Récupérer tous les joueurs
exports.getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().populate("gameId", "name");
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Error fetching players", error });
  }
};

// Récupérer les joueurs par jeu
exports.getPlayersByGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const players = await Player.find({ gameId }).populate("gameId", "name");
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Error fetching players for game", error });
  }
};

// Mettre à jour un joueur
exports.updatePlayer = async (req, res) => {
  const { playerId } = req.params;
  const { name, tier } = req.body;
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      playerId,
      { name, tier },
      { new: true, runValidators: true }
    );
    if (!updatedPlayer) {
      return res.status(404).json({ message: "Player not found." });
    }
    res.status(200).json({ message: "Player updated successfully.", player: updatedPlayer });
  } catch (error) {
    res.status(500).json({ message: "Error updating player", error });
  }
};

// Classement des joueurs
exports.getRanking = async (req, res) => {
  try {
    const ranking = await Player.aggregate([
      {
        $group: {
          _id: "$name",
          totalScore: { $sum: "$score" },
          gamesPlayed: { $addToSet: "$gameId" },
        },
      },
      {
        $project: {
          name: "$_id",
          totalScore: 1,
          gamesCount: { $size: "$gamesPlayed" },
        },
      },
      { $sort: { totalScore: -1 } },
    ]);
    res.status(200).json(ranking);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ranking", error });
  }
};