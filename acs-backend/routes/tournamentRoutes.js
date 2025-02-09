const express = require("express");
const router = express.Router();
const tournamentController = require("../controllers/tournamentController");

router.post("/add", tournamentController.createTournament);
router.get("/all", tournamentController.getAllTournaments);
router.post("/register-players/:tournamentId", tournamentController.registerPlayers);
router.post("/generate-teams/:tournamentId", tournamentController.generateTeams);

module.exports = router;
