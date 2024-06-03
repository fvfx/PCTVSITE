const mediaContainer = document.getElementById('media-container');
const systemNameDiv = document.getElementById('system-name');

let currentMediaIndex = 0;
let programming = [];
let lastFetchTime = 0;
let sequentialQueue = [];
let intercalatedQueue = [];

// Função para buscar a programação do JSON
async function fetchProgramming() {
    const response = await fetch('programacao.json');
    const data = await response.json();
    return data;
}

// Função para verificar se um arquivo deve ser exibido com base nas datas
function shouldDisplay(media) {
    const now = new Date();
    const dataDeInicio = media.dataDeInicio ? new Date(media.dataDeInicio) : null;
    const dataDeExclusao = media.dataDeExclusao ? new Date(media.dataDeExclusao) : null;

    return (!dataDeInicio || now >= dataDeInicio) && (!dataDeExclusao || now <= dataDeExclusao);
}

// Função para limpar o container e exibir a mídia selecionada
function displayMedia(media) {
    mediaContainer.innerHTML = '';
    const mediaElement = media.type === 'image' ? document.createElement('img') : document.createElement('video');
    mediaElement.src = media.path;

    if (media.type === 'video') {
        mediaElement.autoplay = true;
        mediaElement.controls = false;

        // Lógica para tela cheia
        mediaElement.addEventListener('loadeddata', () => {
            if (mediaElement.requestFullscreen) {
                mediaElement.requestFullscreen();
            } else if (mediaElement.webkitRequestFullscreen) {
                mediaElement.webkitRequestFullscreen();
            } else if (mediaElement.msRequestFullscreen) {
                mediaElement.msRequestFullscreen();
            }
        });
    }

    mediaContainer.appendChild(mediaElement);
}

// Função principal para carregar e exibir a mídia
async function loadMedia() {
    const filteredProgramming = programming.filter(media => shouldDisplay(media) && !media.excludedTVs.includes(systemNameDiv.textContent));

    let nextMedia = null;
    if (sequentialQueue.length > 0) {
        nextMedia = sequentialQueue.shift();
    } else if (intercalatedQueue.length > 0) {
        nextMedia = intercalatedQueue.shift();
    } else {
        nextMedia = filteredProgramming[currentMediaIndex];
        currentMediaIndex = (currentMediaIndex + 1) % filteredProgramming.length;
        
        // Adicionar próximos itens sequenciais e intercalados às filas
        filteredProgramming.forEach((media, index) => {
            if (media.categoria === 'Sequencial' && index > currentMediaIndex && shouldDisplay(media)) {
                sequentialQueue.push(media);
            } else if (media.categoria === 'Intercalada' && index > currentMediaIndex && shouldDisplay(media)) {
                intercalatedQueue.push(media);
            }
        });
    }

    if (nextMedia) {
        displayMedia(nextMedia);
        setTimeout(loadMedia, nextMedia.duration * 1000);
    }
}

// Função para verificar se houve alterações na programação
async function updateProgramming() {
    const currentTime = Date.now();
    if (currentTime - lastFetchTime >= 60000) {
        const newProgramming = await fetchProgramming();

        if (JSON.stringify(newProgramming) !== JSON.stringify(programming)) {
            programming = newProgramming;
            currentMediaIndex = 0;
            sequentialQueue = [];
            intercalatedQueue = [];
            loadMedia();
        }

        lastFetchTime = currentTime;
    }
}

// Função para obter o nome do sistema
function getSystemName() {
    return "NomeDoSistema";
}

// Função para verificar e limpar o cache
function checkAndClearCache() {
    if (window.caches) {
        caches.keys().then(names => {
            for (let name of names) caches.delete(name);
        });
    }
}

// Inicialização da página
async function init() {
    systemNameDiv.textContent = getSystemName();
    programming = await fetchProgramming();
    loadMedia();
    setInterval(updateProgramming, 60000);
    setInterval(checkAndClearCache, 300000);
}

init();
