// models/Tournament.js
const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  teamNumber: { type: Number, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }]
});

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
  teams: [TeamSchema],
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }], // Liste des joueurs disponibles pour ce tournoi
  isFinished: { type: Boolean, default: false },
  winnerTeamNumber: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Tournament", TournamentSchema);
