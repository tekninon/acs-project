const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: Number, required: true, min: 1, max: 5 },
  score: { type: Number, default: 0 },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    required: true
  }
});

module.exports = mongoose.model("Player", PlayerSchema);
