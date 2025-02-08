const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const Player = require("../models/Player");

// Créer un tournoi
router.post("/add", async (req, res) => {
  const { name, gameId, playerIds } = req.body; // Ajout de `playerIds`
  
  try {
    const newTournament = new Tournament({ name, gameId, players: playerIds });
    await newTournament.save();
    res.status(201).json({ message: "Tournoi créé avec succès !", tournament: newTournament });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du tournoi", error });
  }
});


// Récupérer tous les tournois
router.get("/all", async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("gameId", "name")
      .populate("teams.players", "name tier");
    res.status(200).json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tournaments", error });
  }
});

// Ajouter des joueurs à un tournoi
router.post("/register-players/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerIds } = req.body; // Liste des joueurs inscrits

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournoi introuvable" });
    }

    tournament.players = playerIds;
    await tournament.save();

    res.status(200).json({ message: "Joueurs inscrits avec succès", tournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'inscription des joueurs", error });
  }
});


// Endpoint pour générer les équipes
router.post("/generate-teams/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    let { numberOfTeams } = req.body;

    if (!numberOfTeams || isNaN(numberOfTeams)) {
      numberOfTeams = 2;
    } else {
      numberOfTeams = parseInt(numberOfTeams, 10);
    }

    // Récupérer le tournoi
    const tournament = await Tournament.findById(tournamentId).populate("players");
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    if (!tournament.players.length) return res.status(400).json({ message: "Aucun joueur inscrit à ce tournoi." });


    // Grouper les joueurs par tier
    const tierMap = {};
    tournament.players.forEach((player) => {
      if (!tierMap[player.tier]) tierMap[player.tier] = [];
      tierMap[player.tier].push(player);
    });

    // Mélanger les joueurs dans chaque tier
    function shuffle(arr) {
      return arr.sort(() => Math.random() - 0.5);
    }
    for (const tier in tierMap) {
      tierMap[tier] = shuffle(tierMap[tier]);
    }

    // Initialiser les équipes
    const teamsArray = Array.from({ length: numberOfTeams }, () => []);

    // Nombre maximal de joueurs par équipe
    const maxPlayersPerTeam = Math.ceil( tournament.players.length / numberOfTeams);

    // Répartir les joueurs
    const tiers = Object.keys(tierMap).sort((a, b) => a - b); // Trier les tiers dans l'ordre croissant
    let distributedCount = 0; // Compteur de joueurs distribués
    const totalPlayers = tournament.players.length;

    while (distributedCount < totalPlayers) {
      for (let i = 0; i < numberOfTeams; i++) {
        if (distributedCount >= totalPlayers) break;

        // Ajouter un joueur d'un tier élevé (T1, T2, ...)
        for (let t = 0; t < tiers.length / 2; t++) {
          const highTier = tiers[t];
          if (tierMap[highTier] && tierMap[highTier].length > 0) {
            if (teamsArray[i].length < maxPlayersPerTeam) {
              teamsArray[i].push(tierMap[highTier].shift()._id);
              distributedCount++;
              break;
            }
          }
        }

        // Ajouter un joueur d'un tier faible (T5, T4, ...)
        for (let t = tiers.length - 1; t >= tiers.length / 2; t--) {
          const lowTier = tiers[t];
          if (tierMap[lowTier] && tierMap[lowTier].length > 0) {
            if (teamsArray[i].length < maxPlayersPerTeam) {
              teamsArray[i].push(tierMap[lowTier].shift()._id);
              distributedCount++;
              break;
            }
          }
        }
      }
    }

    // Transformer en format { teamNumber, players }
    const newTeams = teamsArray.map((playersArr, index) => ({
      teamNumber: index + 1,
      players: playersArr
    }));

    // Mettre à jour le tournoi
    tournament.teams = newTeams;
    await tournament.save();

    // Peupler pour la réponse
    const populatedTournament = await Tournament.findById(tournamentId)
      .populate("teams.players", "name tier");

    res.status(200).json({
      message: "Équipes générées avec succès",
      tournament: populatedTournament
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la génération des équipes", error });
  }
});


router.post("/update-teams/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { teams } = req.body;
    
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Remplacer la structure "teams" du document
    // Note : "teams" arrive avec { teamNumber, players: [ { _id, name, tier }, ... ] }
    // Si votre schema attend des ObjectId, on convertit :
    const updatedTeams = teams.map((team) => ({
      teamNumber: team.teamNumber,
      players: team.players.map(p => p._id || p) // Convertit en _id
    }));

    tournament.teams = updatedTeams;
    await tournament.save();

    // Renvoyer la version peuplée
    const populated = await Tournament.findById(tournamentId)
      .populate("teams.players", "name tier");

    res.status(200).json({
      message: "Teams updated successfully",
      tournament: populated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating teams", error });
  }
});

// POST /api/tournaments/record-scores
router.post("/record-scores", async (req, res) => {
  try {
    const { tournamentId, teamScores } = req.body;
    // teamScores est un tableau d'objets du type : [{ teamNumber: 1, score: 10 }, ...]

    // On récupère le tournoi avec les équipes
    const tournament = await Tournament.findById(tournamentId).populate("teams.players", "_id");
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Pour chaque teamNumber, on récupère les joueurs et on met à jour leur score
    for (const { teamNumber, score } of teamScores) {
      // Trouver l'équipe correspondante
      const team = tournament.teams.find(t => t.teamNumber === teamNumber);
      if (!team) continue; // si pas trouvé, on ignore

      // Récupérer les _id des joueurs de cette équipe
      const playerIds = team.players.map(p => p._id);

      // Mettre à jour le score de chaque joueur : 
      // Ici, on suppose qu'on veut *ajouter* le score (score cumulatif) 
      // Si vous voulez simplement "fixer" le score, utilisez { score } au lieu de $inc.
      await Player.updateMany(
        { _id: { $in: playerIds } },
        { $inc: { score: score } }
      );
    }

    return res.status(200).json({ message: "Scores enregistrés avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement des scores", error });
  }
});

// Marquer un tournoi comme terminé
router.post("/finish/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { winnerTeamNumber } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    if (!tournament.teams.some(team => team.teamNumber === winnerTeamNumber)) {
      return res.status(400).json({ message: "Winning team not found in this tournament." });
    }

    tournament.isFinished = true;
    tournament.winnerTeamNumber = winnerTeamNumber;
    await tournament.save();

    res.status(200).json({ message: "Tournament marked as finished!", tournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error finishing tournament", error });
  }
});


// Récupérer les tournois terminés
router.get("/finished", async (req, res) => {
  try {
    const tournaments = await Tournament.find({ isFinished: true })
      .populate("gameId", "name") // Récupérer le nom du jeu
      .populate("teams.players", "name") // Récupérer les joueurs
      .lean();

    // Ajouter les infos sur l'équipe gagnante et son score
    const enrichedTournaments = tournaments.map(tournament => {
      const winningTeam = tournament.teams.find(team => team.teamNumber === tournament.winnerTeamNumber);
      return {
        ...tournament,
        winningTeam,
        winningScore: winningTeam ? winningTeam.players.reduce((sum, player) => sum + (player.score || 0), 0) : 0
      };
    });

    res.status(200).json(enrichedTournaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des tournois terminés", error });
  }
});

// Modifier un tournoi (y compris la mise à jour des joueurs)
router.put("/update/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { name, gameId, playerIds } = req.body; // Ajout de playerIds

    // Vérifier si le tournoi existe
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournoi introuvable" });
    }

    // Vérifier si le tournoi est terminé (on ne doit pas pouvoir le modifier)
    if (tournament.isFinished) {
      return res.status(400).json({ message: "Impossible de modifier un tournoi terminé" });
    }

    // Mise à jour des informations du tournoi
    if (name) tournament.name = name;
    if (gameId) tournament.gameId = gameId;
    if (playerIds) tournament.players = playerIds; // Mettre à jour la liste des joueurs inscrits

    tournament.updatedAt = new Date();
    await tournament.save();

    // Retourner les données mises à jour
    const updatedTournament = await Tournament.findById(tournamentId)
      .populate("gameId", "name")
      .populate("players", "name tier");

    res.status(200).json({ message: "Tournoi mis à jour avec succès", tournament: updatedTournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du tournoi", error });
  }
});


// Supprimer un tournoi
router.delete("/delete/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Vérifier si le tournoi existe
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournoi introuvable" });
    }

    // Vérifier si le tournoi est terminé (on ne doit pas pouvoir le supprimer)
    if (tournament.isFinished) {
      return res.status(400).json({ message: "Impossible de supprimer un tournoi terminé" });
    }

    // Supprimer le tournoi
    await Tournament.findByIdAndDelete(tournamentId);

    res.status(200).json({ message: "Tournoi supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression du tournoi", error });
  }
});



module.exports = router;
