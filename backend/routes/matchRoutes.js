// backend/routes/matchRoutes.js
import express from 'express';
import hltvService from '../services/hltvService.js';

const router = express.Router();

// Próximos jogos da FURIA
router.get('/matches/upcoming', async (req, res) => {
  try {
    const matches = await hltvService.getUpcomingMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar jogos' });
  }
});

// Placar ao vivo
router.get('/matches/live', async (req, res) => {
  try {
    const liveMatch = await hltvService.getLiveScores();
    res.json(liveMatch || { status: 'Nenhum jogo ativo' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar placar' });
  }
});

export default router;