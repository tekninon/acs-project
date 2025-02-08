const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("Game", GameSchema);
