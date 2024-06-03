const mediaContainer = document.getElementById("media-container");
const systemNameDiv = document.getElementById("system-name");

let currentMediaIndex = 0;
let programming = [];
let lastFetchTime = 0;
let sequentialQueue = [];
let intercalatedQueue = [];

// Função para buscar a programação do JSON
async function fetchProgramming() {
    try {
        const response = await fetch("programacao.json");
        if (!response.ok) {
            throw new Error(`Erro ao buscar programação: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erro ao buscar programação:", error);
        return []; // Retornar um array vazio em caso de erro
    }
}

// Função para verificar se um arquivo deve ser exibido com base nas datas
function shouldDisplay(media) {
    const now = new Date();
    const dataDeInicio = media.dataDeInicio ? new Date(media.dataDeInicio) : null;
    const dataDeExclusao = media.dataDeExclusao ? new Date(media.dataDeExclusao) : null;
    return (!dataDeInicio || now >= dataDeInicio) && (!dataDeExclusao || now <= dataDeExclusao);
}

// Função principal para carregar e exibir a mídia
async function loadMedia() {
    // Filtrar a programação com base nas datas e TVs excluídas
    const filteredProgramming = programming.filter(
        media => shouldDisplay(media) && !media.excludedTVs.includes(systemNameDiv.textContent)
    );

    let nextMedia = null;
    let mediaCategory = null;

    if (sequentialQueue.length > 0 && sequentialQueue[0].repeatCount === currentMediaIndex) {
        nextMedia = sequentialQueue.shift();
        mediaCategory = "Sequencial";
    } else if (intercalatedQueue.length > 0 && intercalatedQueue[0].repeatCount === currentMediaIndex) {
        nextMedia = intercalatedQueue.shift();
        mediaCategory = "Intercalada";
    } else if (currentMediaIndex < filteredProgramming.length) { // Verificar se ainda há mídias "Normal"
        nextMedia = filteredProgramming[currentMediaIndex];
        mediaCategory = "Normal";
    }

    if (nextMedia) {
        const mediaElement = nextMedia.type === 'image' ? new Image() : document.createElement('video');

        // Corrigir a codificação da URL da imagem ANTES de atribuir ao src
        const encodedPath = nextMedia.path.replace(/[^a-zA-Z0-9-_.~!*'();:@&=+$,/?#[\]]/g, encodeURIComponent); 
        mediaElement.src = encodedPath;
        mediaElement.style.maxWidth = "100%"; //Garantir responsividade
        mediaElement.style.maxHeight = "100%";

        if (nextMedia.type === 'video') {
            mediaElement.autoplay = true;
            mediaElement.controls = false; // Opcional: remover controles do vídeo
        }

        mediaElement.onload = () => {
            mediaContainer.innerHTML = ''; // Limpar o container
            mediaContainer.appendChild(mediaElement);

            // Agendar a próxima exibição, levando em conta o tipo de mídia
            if (mediaCategory === "Sequencial" || mediaCategory === "Intercalada") {
                // Não incrementa o índice para Sequencial e Intercalada
                setTimeout(loadMedia, nextMedia.duration * 1000);
            } else {
                currentMediaIndex = (currentMediaIndex + 1) % filteredProgramming.length;
                setTimeout(loadMedia, nextMedia.duration * 1000);
            }
        };

        mediaElement.onerror = () => {
            console.error(`Erro ao carregar a mídia: ${nextMedia.path}`);
            loadMedia(); // Pular para a próxima mídia se houver erro
        };
    } else {
        currentMediaIndex = 0; // Reiniciar o índice para a próxima iteração
        loadMedia(); // Reiniciar a programação se não houver mais mídias
    }

    // Atualizar filas sequencial e intercalada apenas para Normal
    if (mediaCategory === "Normal") {
        filteredProgramming.forEach((media, index) => {
            if (media.categoria === 'Sequencial' && shouldDisplay(media) && !sequentialQueue.includes(media)) {
                sequentialQueue.push(media);
            } else if (media.categoria === 'Intercalada' && shouldDisplay(media) && !intercalatedQueue.includes(media)) {
                intercalatedQueue.push(media);
            }
        });
    }
}

// Função para verificar se houve alterações na programação (sem alterações)
async function updateProgramming() {
    const currentTime = Date.now();
    if (currentTime - lastFetchTime >= 60000) { // 60 segundos
        const newProgramming = await fetchProgramming();
        if (JSON.stringify(newProgramming) !== JSON.stringify(programming)) {
            programming = newProgramming;
            currentMediaIndex = 0;
            sequentialQueue = [];
            intercalatedQueue = [];
            loadMedia(); // Recarregar a programação imediatamente
        }
        lastFetchTime = currentTime;
    }
}

// Função para obter o nome do sistema (implementação específica para seu ambiente)
function getSystemName() {
    // ... lógica para obter o nome do sistema ...
    return "NomeDoSistema"; // Substitua pelo nome real
}

// Função para verificar e limpar o cache (implementação específica para seu ambiente)
function checkAndClearCache() {
    // ... lógica para verificar e limpar o cache ...
}

// Inicialização da página (sem alterações)
async function init() {
    programming = await fetchProgramming();
    systemNameDiv.textContent = getSystemName();
    loadMedia();
    setInterval(updateProgramming, 10000); // Verificar a cada 10 segundos
    setInterval(checkAndClearCache, 300000); // Verificar cache a cada 5 minutos
}

init();
