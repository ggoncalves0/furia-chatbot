const express = require('express');
const http = require('http');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const FURIA_ID = 1867; // ID da FURIA na PandaScore
const PANDASCORE_API_KEY = 'SUA_CHAVE_DE_API_AQUI'; // Obtenha em pandascore.co
const CACHE_TIME = 300000; // 5 minutos

// Configuração
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

let matchesCache = {
    data: getFallbackData(),
    lastUpdated: Date.now(),
    isFallback: true
};

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/games.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/games.html'));
});

// Rota principal com PandaScore
app.get('/api/matches', async (req, res) => {
    try {
        const [upcoming, past] = await Promise.all([
            fetchPandaScoreMatches('upcoming'),
            fetchPandaScoreMatches('past')
        ]);

        const result = {
            upcoming: upcoming.slice(0, 5),
            past: past.slice(0, 10),
            lastUpdated: new Date().toISOString(),
            isFallback: false
        };

        matchesCache = {
            data: result,
            lastUpdated: Date.now(),
            isFallback: false
        };

        res.json(result);
    } catch (error) {
        console.error('Erro na PandaScore:', error.message);
        res.json(matchesCache.data);
    }
});

// Funções da PandaScore
async function fetchPandaScoreMatches(type) {
    const endpoint = type === 'upcoming' 
        ? 'https://api.pandascore.co/csgo/matches/upcoming' 
        : 'https://api.pandascore.co/csgo/matches/past';

    const response = await axios.get(endpoint, {
        params: {
            'filter[opponent_id]': FURIA_ID,
            sort: type === 'upcoming' ? 'begin_at' : '-begin_at',
            per_page: 100
        },
        headers: {
            'Authorization': `Bearer ${PANDASCORE_API_KEY}`
        },
        timeout: 10000
    });

    return response.data.map(match => ({
        id: match.id,
        team1: {
            name: match.opponents[0]?.opponent?.name || 'TBD',
            id: match.opponents[0]?.opponent?.id || 0,
            score: match.results?.find(r => r.team_id === match.opponents[0]?.opponent?.id)?.score || 0
        },
        team2: {
            name: match.opponents[1]?.opponent?.name || 'TBD',
            id: match.opponents[1]?.opponent?.id || 0,
            score: match.results?.find(r => r.team_id === match.opponents[1]?.opponent?.id)?.score || 0
        },
        event: match.league?.name || match.serie?.name || 'Torneio',
        date: match.begin_at ? formatDate(match.begin_at) : 'Data não definida',
        time: match.begin_at ? formatTime(match.begin_at) : 'Horário não definido',
        status: type === 'upcoming' ? 'Upcoming' : 'Completed',
        maps: match.games?.map(game => ({
            name: game.map?.name || 'Mapa desconhecido',
            score: `${game.results[0]?.score || 0}-${game.results[1]?.score || 0}`
        })) || []
    }));
}

// Funções auxiliares
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function getFallbackData() {
    const now = new Date();
    return {
        upcoming: [{
            team1: { name: 'FURIA', id: FURIA_ID },
            team2: { name: 'The MongolZ'},
            event: 'PGL Astana 2025',
            date: '10/05/2025',
            time: '05:00',
            status: 'Upcoming'
        }],
        past: [{
            team1: { name: 'FURIA', id: FURIA_ID, score: 0 },
            team2: { name: ' The MongolZ', id: 4608, score: 2 },
            event: 'IEM Katowice',
            date: '09/04/2025', 
            status: 'Completed',
            maps: [
                { name: 'Mirage', score: '9-13' },
                { name: 'Nuke', score: '11-13' },
            ]
        }],
        lastUpdated: now.toISOString(),
        isFallback: true
    };
}

// Inicia o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`- Acesse: http://localhost:${PORT}`);
    console.log(`- API de partidas: http://localhost:${PORT}/api/matches`);
});