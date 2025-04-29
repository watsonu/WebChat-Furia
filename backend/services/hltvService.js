// backend/services/hltvService.js
const axios = require('axios');

const HLTV_API = 'https://hltv-api.vercel.app/api';

module.exports = {
  getUpcomingMatches: async () => {
    try {
      const response = await axios.get(`${HLTV_API}/matches`);
      return response.data.filter(match => 
        match.team1?.name === 'FURIA' || match.team2?.name === 'FURIA'
      );
    } catch (error) {
      console.error('Erro na API HLTV:', error);
      return [];
    }
  },

  getLiveScores: async () => {
    try {
      const response = await axios.get(`${HLTV_API}/livescore`);
      return response.data.find(match => 
        match.team1 === 'FURIA' || match.team2 === 'FURIA'
      );
    } catch (error) {
      console.error('Erro no placar ao vivo:', error);
      return null;
    }
  }
};