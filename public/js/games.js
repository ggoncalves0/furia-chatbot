document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const backButton = document.getElementById('backButton');
    const refreshButton = document.getElementById('refreshButton');
    const upcomingMatchesContainer = document.getElementById('upcomingMatches');
    const pastMatchesContainer = document.getElementById('pastMatches');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');

    // Event Listeners
    backButton.addEventListener('click', () => window.location.href = 'index.html');
    refreshButton.addEventListener('click', loadMatches);
    document.getElementById('retryButton').addEventListener('click', loadMatches);

    // Inicialização
    loadMatches();

    async function loadMatches() {
        try {
            showLoading();
            
            const response = await fetch('/api/matches');
            if (!response.ok) throw new Error('Erro na rede');
            
            const data = await response.json();
            console.log("Dados recebidos:", data); // Para depuração
            
            displayMatches(data);
        } catch (error) {
            console.error("Erro ao carregar partidas:", error);
            showError("Falha ao carregar os jogos. Tente novamente.");
            displayFallbackData();
        } finally {
            hideLoading();
        }
    }

    function displayMatches(data) {
        // Ordena os jogos
        const upcoming = data.upcoming?.sort((a, b) => new Date(a.date) - new Date(b.date)) || [];
        const past = data.past?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];
        
        displayMatchSection(upcoming, upcomingMatchesContainer, 'upcoming', 'Nenhuma partida futura agendada');
        displayMatchSection(past, pastMatchesContainer, 'past', 'Nenhuma partida anterior encontrada');
    }

    function displayMatchSection(matches, container, type, emptyMessage) {
        container.innerHTML = '';
        
        if (!matches || matches.length === 0) {
            container.innerHTML = `<div class="no-matches">${emptyMessage}</div>`;
            return;
        }

        matches.forEach((match, index) => {
            const isHighlighted = (type === 'upcoming' && index === 0);
            const matchElement = createMatchElement(match, type, isHighlighted);
            container.appendChild(matchElement);
        });
    }

    function createMatchElement(match, type, isHighlighted) {
        const element = document.createElement('div');
        element.className = `match-card ${type} ${isHighlighted ? 'highlighted-match' : ''}`;
        
        element.innerHTML = `
            <div class="match-header">
                <span class="event-name">${match.event || 'Torneio'}</span>
                <span class="match-status ${type}">${type === 'upcoming' ? 'EM BREVE' : 'CONCLUÍDO'}</span>
                ${isHighlighted ? '<span class="highlight-badge">PRÓXIMO JOGO</span>' : ''}
            </div>
            <div class="teams-container">
                <div class="team ${match.team1.name.includes('FURIA') ? 'furia-team' : ''}">
                    <span class="team-name">${match.team1.name}</span>
                    ${type === 'past' ? `<span class="team-score">${match.team1.score}</span>` : ''}
                </div>
                <div class="vs">${type === 'upcoming' ? 'vs' : ':'}</div>
                <div class="team ${match.team2.name.includes('FURIA') ? 'furia-team' : ''}">
                    ${type === 'past' ? `<span class="team-score">${match.team2.score}</span>` : ''}
                    <span class="team-name">${match.team2.name}</span>
                </div>
            </div>
            <div class="match-footer">
                <span class="match-date">${match.date}</span>
                ${match.time ? `<span class="match-time">${match.time}</span>` : ''}
            </div>
            ${type === 'past' && match.maps ? `
                <div class="match-details">
                    ${match.maps.map(map => `
                        <div class="map">
                            <span class="map-name">${map.name}</span>
                            <span class="map-score">${map.score}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        return element;
    }

    function displayFallbackData() {
        const now = new Date();
        const fallbackData = {
            upcoming: [{
                team1: { name: 'FURIA', id: 8297 },
                team2: { name: 'Team Liquid', id: 5973 },
                event: 'ESL Pro League',
                time: '19:00',
                date: now.toLocaleDateString('pt-BR'),
                status: 'Upcoming'
            }],
            past: [{
                team1: { name: 'FURIA', id: 8297, score: 2 },
                team2: { name: 'Natus Vincere', id: 4608, score: 1 },
                event: 'IEM Katowice',
                date: now.toLocaleDateString('pt-BR'),
                status: 'Completed',
                maps: [
                    { name: 'Mirage', score: '16-12' },
                    { name: 'Inferno', score: '8-16' },
                    { name: 'Ancient', score: '14-16' }
                ]
            }]
        };
        displayMatches(fallbackData);
    }

    function showLoading() {
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
    }

    function hideLoading() {
        loadingElement.style.display = 'none';
    }

    function showError(message) {
        errorElement.style.display = 'block';
        errorElement.querySelector('.error-message').textContent = message;
    }
});