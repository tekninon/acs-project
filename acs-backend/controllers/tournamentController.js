const Tournament = require("../models/Tournament");
const Player = require("../models/Player");

exports.createTournament = async (req, res) => {
  const { name, gameId, playerIds } = req.body;
  try {
    const newTournament = new Tournament({ name, gameId, players: playerIds });
    await newTournament.save();
    res.status(201).json({ message: "Tournoi créé avec succès !", tournament: newTournament });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du tournoi", error });
  }
};

exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("gameId", "name")
      .populate("teams.players", "name tier");
    res.status(200).json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des tournois", error });
  }
};

exports.registerPlayers = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerIds } = req.body;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournoi introuvable" });
    tournament.players = playerIds;
    await tournament.save();
    res.status(200).json({ message: "Joueurs inscrits avec succès", tournament });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription des joueurs", error });
  }
};

exports.generateTeams = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    let { numberOfTeams } = req.body;
    numberOfTeams = numberOfTeams && !isNaN(numberOfTeams) ? parseInt(numberOfTeams, 10) : 2;
    const tournament = await Tournament.findById(tournamentId).populate("players");
    if (!tournament) return res.status(404).json({ message: "Tournoi introuvable" });
    if (!tournament.players.length) return res.status(400).json({ message: "Aucun joueur inscrit" });
    
    const tierMap = {};
    tournament.players.forEach(player => {
      if (!tierMap[player.tier]) tierMap[player.tier] = [];
      tierMap[player.tier].push(player);
    });

    function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
    Object.keys(tierMap).forEach(tier => tierMap[tier] = shuffle(tierMap[tier]));

    const teamsArray = Array.from({ length: numberOfTeams }, () => []);
    const maxPlayersPerTeam = Math.ceil(tournament.players.length / numberOfTeams);
    
    const tiers = Object.keys(tierMap).sort((a, b) => a - b);
    let distributedCount = 0, totalPlayers = tournament.players.length;
    while (distributedCount < totalPlayers) {
      for (let i = 0; i < numberOfTeams; i++) {
        if (distributedCount >= totalPlayers) break;
        for (let t = 0; t < tiers.length / 2; t++) {
          if (tierMap[tiers[t]]?.length && teamsArray[i].length < maxPlayersPerTeam) {
            teamsArray[i].push(tierMap[tiers[t]].shift()._id);
            distributedCount++;
            break;
          }
        }
        for (let t = tiers.length - 1; t >= tiers.length / 2; t--) {
          if (tierMap[tiers[t]]?.length && teamsArray[i].length < maxPlayersPerTeam) {
            teamsArray[i].push(tierMap[tiers[t]].shift()._id);
            distributedCount++;
            break;
          }
        }
      }
    }

    tournament.teams = teamsArray.map((players, index) => ({ teamNumber: index + 1, players }));
    await tournament.save();
    const populatedTournament = await Tournament.findById(tournamentId).populate("teams.players", "name tier");
    res.status(200).json({ message: "Équipes générées", tournament: populatedTournament });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la génération des équipes", error });
  }
};