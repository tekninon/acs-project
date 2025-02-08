const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const gameRoutes = require("./routes/gameRoutes");
const playerRoutes = require("./routes/playerRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");



const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/acs")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Routes placeholder
app.get("/", (req, res) => {
  res.send("ACS API is running!");
});


// API
app.use("/api/players", playerRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/tournaments", tournamentRoutes);



// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
