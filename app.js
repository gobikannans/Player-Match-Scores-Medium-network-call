const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

const convertPlayerObjToResponseObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjToResponseObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// GET PLAYERS

app.get("/players/", async (request, response) => {
  const playerQuery = `
    SELECT *
    FROM
    player_details;`;

  const allplayer = await db.all(playerQuery);
  response.send(
    allplayer.map((eachPlayer) => convertPlayerObjToResponseObj(eachPlayer))
  );
});

// GET specific player

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT *
    FROM
    player_details
    WHERE
    player_id=${playerId};`;

  const getPlayer = await db.get(playerQuery);
  response.send(convertPlayerObjToResponseObj(getPlayer));
});

// UPDATE player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updateQuery = `
    UPDATE
    player_details
    SET
    player_name='${playerName}'
    WHERE
    player_id=${playerId};`;

  const updatePlayer = await db.run(updateQuery);
  response.send("Player Details Updated");
});

// GET specific match_details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT *
    FROM
    match_details
    WHERE
    match_id=${matchId};`;

  const getMatch = await db.get(matchQuery);
  response.send(convertMatchObjToResponseObj(getMatch));
});

// GET all matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const allMatchQuery = `
    SELECT match_details.match_id,match_details.match,match_details.year
    FROM
    match_details INNER JOIN player_match_score
    ON match_details.match_id=player_match_score.match_id 
    INNER JOIN player_details 
    ON player_match_score.player_id=player_details.player_id 
    WHERE
    player_details.player_id=${playerId};`;

  const allMatches = await db.all(allMatchQuery);
  response.send(
    allMatches.map((eachMatch) => convertMatchObjToResponseObj(eachMatch))
  );
});

// GET player on a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const specificMatchQuery = `
    SELECT player_details.player_id,player_details.player_name
    FROM
    match_details INNER JOIN player_match_score
    ON match_details.match_id=player_match_score.match_id 
    INNER JOIN player_details 
    ON player_match_score.player_id=player_details.player_id 
    WHERE
    match_details.match_id=${matchId};`;

  const specificMatches = await db.all(specificMatchQuery);
  response.send(
    specificMatches.map((eachMatch) => convertPlayerObjToResponseObj(eachMatch))
  );
});

//GET player score on all matches

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM
    player_details INNER JOIN player_match_score
    ON player_match_score.player_id=player_details.player_id 
    WHERE
    player_details.player_id=${playerId};`;

  const playerDetails = await db.get(playerMatchQuery);
  response.send(playerDetails);
});

module.exports = app;
