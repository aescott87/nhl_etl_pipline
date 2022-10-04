import axios from 'axios';

// Function to gather team data
const startTeamPipeline = () => {
    // First extract the required data
        Promise.all([
            axios.get('https://statsapi.web.nhl.com/api/v1/teams/12'),
            axios.get('https://statsapi.web.nhl.com/api/v1/standings?season20182019'),
            axios.get('https://statsapi.web.nhl.com/api/v1/schedule?teamId=12&season=20182019')
        ]).then (response => {
            const teamData = response[0].data;
            const processedTeamObj = processTeamData(teamData);
            //console.log(JSON.stringify(processedTeamObj));
            const seasonData = response[1].data;
            const processedSeasonData = processSeasonData(seasonData);
            //console.log(JSON.stringify(processedSeasonData));
            const gameData = response[2].data;
            //console.log('All three data points successfully extracted!')
            //console.log(gameData);
            const processedGameData = processGameData(gameData);
            console.log(JSON.stringify(processedGameData));
        })
        .catch (error => {
            console.log(error);
        })
}

startTeamPipeline();

const processTeamData = (dataObj) => {
    return {
        teamId: dataObj.teams[0].id,
        teamName: dataObj.teams[0].name,
        teamVenueName: dataObj.teams[0].venue.name
    }
}

const processSeasonData = (dataObj) => {
    const teamRecordsArr = dataObj.records[0].teamRecords;
    const teamSeasonStats = teamRecordsArr.filter(rec => rec.team.id === 12);
    if (teamSeasonStats.length === 0) {
        console.log('No season data for this team.');
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

const processGameData = (dataObj) => {
    const gameDatesArr = dataObj.dates;
    const regularSeasonArr = gameDatesArr.filter(rec => rec.games[0].gameType === 'R');
    const firstGameData = regularSeasonArr[0];
    //console.log(JSON.stringify(firstGameData));
    let opposingTeam = '';
    if (firstGameData.games[0].teams.away.team.id != 12) {
        opposingTeam = firstGameData.games[0].teams.away.team.name;
    } else {
        opposingTeam = firstGameData.games[0].teams.home.team.name;
    }
    return {
        firstGameDate: firstGameData.date,
        firstGameOpponent: opposingTeam,
    }
}