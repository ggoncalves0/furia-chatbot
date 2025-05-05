document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const gamesButton = document.getElementById('gamesButton');
    const matchStatus = document.getElementById('matchStatus');

    // Conexão Socket.IO com fallback
    let socket;
    try {
        socket = io();
        console.log('Conectado ao Socket.IO');
    } catch (error) {
        console.error('Erro na conexão Socket.IO:', error);
    }

    // Eventos dos botões
    sendButton.addEventListener('click', sendMessage);
    gamesButton.addEventListener('click', () => window.location.href = 'games.html');
    userInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

    // Eventos Socket.IO
    if (socket) {
        socket.on('connect_error', () => {
            addBotMessage("⚠️ Problemas de conexão. Tentando reconectar...");
        });

        socket.on('match-update', (data) => {
            updateMatchStatus(data);
        });

        socket.on('bot-response', (response) => {
            addBotMessage(response);
        });
    }

    // Função principal para enviar mensagens
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        addUserMessage(message);
        userInput.value = '';
        
        // Resposta imediata do bot (local)
        const immediateResponse = generateImmediateResponse(message);
        if (immediateResponse) {
            addBotMessage(immediateResponse);
        }

        // Se conectado, envia para o servidor para processamento adicional
        if (socket) {
            socket.emit('user-message', { text: message });
        } else {
            // Fallback completo offline
            setTimeout(() => {
                addBotMessage(generateDetailedResponse(message));
            }, 800);
        }
    }

    // Geração de respostas do bot (respostas rápidas)
    function generateImmediateResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        if (lowerMsg.includes('oi') || lowerMsg.includes('olá') || lowerMsg.includes('ola')) {
            return "Olá Furioso! 🚀";
        }
        
        if (lowerMsg.includes('obrigado') || lowerMsg.includes('obrigada')) {
            return "Por nada! Sempre aqui para ajudar! 😊";
        }
        
        if (lowerMsg.includes('obrigado') || lowerMsg.includes('contato')) {
            return "Precisa de mais ajuda? Fale conosco via Whatssap: https://wa.me/5511993404466 😊";
        }
        return null; // Nenhuma resposta imediata
    }

    // Geração de respostas detalhadas
    function generateDetailedResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        // Respostas sobre jogos
        if (lowerMsg.includes('jogo') || lowerMsg.includes('partida') || lowerMsg.match(/pr[oó]xim/)) {
            return `Próximo jogo: FURIA vs The MongolZ dia 10/04/2025, ás 05:00`;
        }
        
        // Respostas sobre time
        if (lowerMsg.includes('time') || lowerMsg.includes('jogador') || lowerMsg.includes('elenco')) {
            return "Nosso time principal: KSCERATO, yuurih, FalleN, YEKINDAR e molodoy! 💪";
        }
        
        // Respostas sobre resultados
        if (lowerMsg.includes('resultado') || lowerMsg.includes('placar') || lowerMsg.includes('último')) {
            return `Último resultado: FURIA 0 - The MongolZ 2`;
        }
        
        // Respostas padrão
        const defaultResponses = [
            "Posso te ajudar com informações sobre jogos e o time da FURIA!",
            "Quer saber sobre próximos jogos ou resultados?",
            "Digite 'jogos' para ver a programação completa!",
            "Vamos FURIA! 🔥 O que você quer saber?"
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Funções auxiliares para geração de dados aleatórios
    function randomTeam() {
        const teams = ['MIBR', 'LOUD', 'Imperial', 'paiN', 'Vitality', 'Natus Vincere'];
        return teams[Math.floor(Math.random() * teams.length)];
    }

    function randomTime() {
        const hours = Math.floor(Math.random() * 12) + 12;
        const mins = Math.random() > 0.5 ? '00' : '30';
        return `${hours}:${mins}`;
    }

    function randomScore() {
        return `${Math.floor(Math.random() * 2) + 1}-${Math.floor(Math.random() * 2)}`;
    }

    function randomMapScore() {
        const maps = ['Mirage', 'Inferno', 'Ancient', 'Overpass', 'Vertigo'];
        return maps.slice(0, Math.floor(Math.random() * 3) + 2)
                  .map(map => `${map} (${Math.floor(Math.random() * 16)}-${Math.floor(Math.random() * 16)})`)
                  .join(', ');
    }


    // Funções para atualização da interface
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
        chatMessages.appendChild(messageDiv);
        scrollChat();
    }

    function addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        messageDiv.innerHTML = `
            <img src="images/bot-icon.png" alt="FURIA Bot" onerror="this.onerror=null;this.src='fallback-icon.png'">
            <div class="message-content"><p>${text}</p></div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollChat();
    }

    function scrollChat() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }



    // Simulação de atualizações de jogo (apenas em desenvolvimento)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setInterval(() => {
            const isLive = Math.random() > 0.5;
            const updateData = {
                isLive,
                teams: `FURIA vs ${randomTeam()}`,
                score: isLive ? randomScore() : '',
                time: isLive ? `${Math.floor(Math.random() * 30)}'` : randomTime()
            };
            
            if (socket) {
                socket.emit('match-update', updateData);
            } else {
                updateMatchStatus(updateData);
            }
        }, 15000);
    }
});