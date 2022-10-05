const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Function to gather team data
const startTeamPipeline = (id, season) => {
    // First extract the required data
        Promise.all([
            axios.get(`https://statsapi.web.nhl.com/api/v1/teams/${id}`),
            axios.get(`https://statsapi.web.nhl.com/api/v1/standings?season${season}`),
            axios.get(`https://statsapi.web.nhl.com/api/v1/schedule?teamId=${id}&season=${season}`)
        ]).then (response => {
            // Transform data received from each endpoint
            console.log('Success!')
            const teamData = response[0].data;
            const processedTeamData = processTeamData(teamData);
            const seasonData = response[1].data;
            const processedSeasonData = processSeasonData(seasonData, id);
            const gameData = response[2].data;
            const processedGameData = processGameData(gameData, id);
            const finalDataObj = Object.assign(processedTeamData, processedSeasonData, processedGameData);
            // Load team data to CSV file
            loadTeamDataToCsv(finalDataObj);
        })
        .catch (error => {
            console.log(error);
        })
}

// Function for player pipeline
const startPlayerPipeline = (id, season) => {
    // Extract data from API endpoints
    Promise.all([
        axios.get(`https://statsapi.web.nhl.com/api/v1/people/${id}`),
        axios.get(`https://statsapi.web.nhl.com/api/v1/people/${id}/stats?stats=statsSingleSeason&season=${season}`)
    ])
    .then((response) => {
        // Transform the data to retain only what is needed
        const playerData = response[0].data;
        const processedPlayerData = processPlayerData(playerData);
        const playerStats = response[1].data;
        const processedPlayerStats = processPlayerStats(playerStats);
        const finalPlayerObj = Object.assign(processedPlayerData, processedPlayerStats);
        // Load relevant data to a CSV file
        loadPlayerDataToCsv(finalPlayerObj);
    })
    .catch(error => {
        console.log(error);
    })
}

startPlayerPipeline(8477474, 20182019);

startTeamPipeline(12, 20182019);

const processTeamData = (teamObj) => {
    return {
        id: dataObj.teams[0].id,
        name: dataObj.teams[0].name,
        venue: dataObj.teams[0].venue.name
    }
}

const processSeasonData = (seasonObj, id) => {
    const teamRecordsArr = dataObj.records[0].teamRecords;
    const teamSeasonStats = teamRecordsArr.filter(rec => rec.team.id === id);
    if (teamSeasonStats.length === 0) {
        console.log('No data for this team in this season.');
        return false;
    } else {
        const avgGoals = Math.round(teamSeasonStats[0].goalsScored / teamSeasonStats[0].gamesPlayed); 
        return {
            gamesPlayed: teamSeasonStats[0].gamesPlayed,
            wins: teamSeasonStats[0].leagueRecord.wins,
            losses: teamSeasonStats[0].leagueRecord.losses,
            points: teamSeasonStats[0].points,
            goalsPerGame: avgGoals
        }
    }
}

const processGameData = (gameObj, id) => {
    const gameDatesArr = dataObj.dates;
    const regularSeasonArr = gameDatesArr.filter(rec => rec.games[0].gameType === 'R');
    const firstGameData = regularSeasonArr[0];
    let opposingTeam = '';
    if (firstGameData.games[0].teams.away.team.id != id) {
        opposingTeam = firstGameData.games[0].teams.away.team.name;
    } else {
        opposingTeam = firstGameData.games[0].teams.home.team.name;
    }
    return {
        firstGameDate: firstGameData.date,
        firstGameOpponent: opposingTeam,
    }
}

const loadTeamDataToCsv = (teamData) => {
    const csvWriter = createCsvWriter({
        path: 'teamData.csv',
        header: [
          {id: 'id', title: 'Team ID'},
          {id: 'name', title: 'Team Name'},
          {id: 'venue', title: 'Team Venue Name'},
          {id: 'gamesPlayed', title: 'Games Played'},
          {id: 'wins', title: 'Wins'},
          {id: 'losses', title: 'Losses'},
          {id: 'points', title: 'Points'},
          {id: 'goalsPerGame', title: 'Goals Per Game'},
          {id: 'firstGameDate', title: 'First Season Game Date'},
          {id: 'firstGameOpponent', title: 'First Season Game Opponent'},
        ]
    });

    const data = [teamData];

    csvWriter.writeRecords(data)
  .then(()=> console.log('Team CSV file was written successfully'));
}

const processPlayerData = (playerObj) => {
    return {
        id: dataObj.people[0].id,
        name: dataObj.people[0].fullName,
        team: dataObj.people[0].currentTeam.name,
        age: dataObj.people[0].currentAge,
        number: dataObj.people[0].primaryNumber,
        position: dataObj.people[0].primaryPosition.name,
        rookie: dataObj.people[0].rookie
    }
}

const processPlayerStats = (statsObj) => {
    const stats = dataObj.stats[0].splits[0].stat;
    return {
        assists: stats.assists,
        goals: stats.goals,
        games: stats.games,
        hits: stats.hits,
        points: stats.points
    }
}

const loadPlayerDataToCsv = (playerData) => {
    const csvWriter = createCsvWriter({
        path: 'playerData.csv',
        header: [
          {id: 'id', title: 'Player ID'},
          {id: 'name', title: 'Player Name'},
          {id: 'team', title: 'Current Team'},
          {id: 'age', title: 'Current Age'},
          {id: 'number', title: 'Player Number'},
          {id: 'position', title: 'Player Position'},
          {id: 'rookie', title: 'Is Player a Rookie?'},
          {id: 'assists', title: 'Assists'},
          {id: 'goals', title: 'Goals'},
          {id: 'games', title: 'Games'},
          {id: 'hits', title: 'Hits'},
          {id: 'points', title: 'Points'},
        ]
    });

    const data = [playerData];

    csvWriter.writeRecords(data)
  .then(()=> console.log('Player CSV file was written successfully'));
} 