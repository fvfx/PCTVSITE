const mediaContainer = document.getElementById('media-container');
const deviceInfoElement = document.getElementById('device-info');
let mediaData = [];
let normalMedia = [];
let sequentialMedia = [];
let intercalatedMedia = [];
let currentIndex = 0;
let sequentialCounts = {};
let intercalatedCounts = {};
let timeoutId;  // Variável para armazenar o ID do timeout
let internetConnected = true; // Variável para rastrear o status da conexão com a internet

// Função para gerar um identificador único mais curto
function generateShortUUID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uuid = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        uuid += chars[randomIndex];
    }
    return uuid;
}

// Obter ou definir o identificador do dispositivo no armazenamento local
let deviceIdentifier = localStorage.getItem('deviceIdentifier');
if (!deviceIdentifier) {
    deviceIdentifier = generateShortUUID();
    localStorage.setItem('deviceIdentifier', deviceIdentifier);
}

// Buscar dados de geolocalização
function fetchGeolocation() {
    fetch('https://ipinfo.io/json?token=fefcbc0ea76800') // Usando seu token real
        .then(response => response.json())
        .then(data => {
            const location = `${data.city}, ${data.region}`;
            deviceInfoElement.textContent = `ID: ${deviceIdentifier}, Localização: ${location}`;
        })
        .catch(error => {
            console.error('Erro ao buscar dados de geolocalização:', error);
            deviceInfoElement.textContent = `ID: ${deviceIdentifier}, Localização: Desconhecida`;
        });
}

// Buscar dados de geolocalização inicialmente
fetchGeolocation();

/**
 * Função para carregar o item de mídia atual
 */
function loadMedia() {
    if (mediaData.length === 0) return;

    const currentMedia = mediaData[currentIndex];
    mediaContainer.innerHTML = ''; // Limpar mídia anterior

    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.path;
        mediaContainer.appendChild(img);
    } else if (currentMedia.type === 'video') {
        if (!internetConnected && (currentMedia.path.includes('youtube.com') || currentMedia.path.includes('youtu.be') || currentMedia.path.includes('vimeo.com'))) {
            // Pular o vídeo se não houver conexão com a internet
            loadNextMedia();
            return;
        }
        if (currentMedia.path.includes('youtube.com') || currentMedia.path.includes('youtu.be')) {
            const videoId = extractYouTubeId(currentMedia.path);
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1`;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; encrypted-media';
            iframe.allowFullscreen = true;
            mediaContainer.appendChild(iframe);
        } else if (currentMedia.path.includes('vimeo.com')) {
            const videoId = extractVimeoId(currentMedia.path);
            const iframe = document.createElement('iframe');
            iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&mute=1&title=0&byline=0&portrait=0`;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen';
            iframe.allowFullscreen = true;
            mediaContainer.appendChild(iframe);
        } else {
            const video = document.createElement('video');
            video.src = currentMedia.path;
            video.autoplay = true;
            video.loop = false;
            video.muted = true; // Remova o mute se quiser som
            video.controls = false;
            video.style.display = 'block';

            video.addEventListener('canplay', () => {
                video.play();
            });

            mediaContainer.appendChild(video);
        }
    }

    // Limpar timeout anterior antes de definir um novo
    clearTimeout(timeoutId);
    timeoutId = setTimeout(loadNextMedia, currentMedia.duration * 1000);

    currentIndex = (currentIndex + 1) % mediaData.length;
}

/**
 * Função para carregar o próximo item de mídia
 */
function loadNextMedia() {
    currentIndex = (currentIndex + 1) % mediaData.length;
    loadMedia();
}

/**
 * Função para extrair o ID do vídeo do YouTube a partir da URL
 * @param {string} url - A URL do vídeo do YouTube
 * @returns {string|null} - O ID do vídeo do YouTube
 */
function extractYouTubeId(url) {
    const regExp = /^.*(youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    return (match && match[2]) ? match[2] : null;
}

/**
 * Função para extrair o ID do vídeo do Vimeo a partir da URL
 * @param {string} url - A URL do vídeo do Vimeo
 * @returns {string|null} - O ID do vídeo do Vimeo
 */
function extractVimeoId(url) {
    const regExp = /vimeo.com\/(\d+)/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
}

/**
 * Função para organizar dados de mídia em categorias
 * @param {Array} data - O array de dados de mídia
 */
function organizeMediaData(data) {
    const now = new Date();
    normalMedia = data.filter(item => item.categoria === 'Normal' && shouldDisplayItem(item, now));
    sequentialMedia = data.filter(item => item.categoria === 'Sequencial' && shouldDisplayItem(item, now) && item.repeatCount && item.repeatCount > 0);
    intercalatedMedia = data.filter(item => item.categoria === 'Intercalada' && shouldDisplayItem(item, now) && item.repeatCount && item.repeatCount > 0);
    sequentialCounts = {};
    intercalatedCounts = {};

    sequentialMedia.forEach(item => {
        if (!sequentialCounts[item.repeatCount]) {
            sequentialCounts[item.repeatCount] = [];
        }
        sequentialCounts[item.repeatCount].push(item);
    });

    intercalatedMedia.forEach(item => {
        if (!intercalatedCounts[item.repeatCount]) {
            intercalatedCounts[item.repeatCount] = [];
        }
        intercalatedCounts[item.repeatCount].push(item);
    });

    createPlaybackSequence();
}

/**
 * Função para verificar se um item de mídia deve ser exibido
 * @param {Object} item - O item de mídia
 * @param {Date} now - A data atual
 * @returns {boolean} - Verdadeiro se o item deve ser exibido, falso caso contrário
 */
function shouldDisplayItem(item, now) {
    const isExcluded = item.excludedTVs && item.excludedTVs.includes(deviceIdentifier);
    const isIncluded = item.includedTVs && item.includedTVs.includes(deviceIdentifier);
    const startDate = item.dataDeInicio ? new Date(item.dataDeInicio) : null;
    const endDate = item.dataDeExclusao ? new Date(item.dataDeExclusao) : null;

    if (item.includedTVs && item.includedTVs.length > 0 && !isIncluded) {
        return false;
    }

    if (isExcluded) {
        return false;
    }

    if (startDate && now < startDate) {
        return false;
    }

    if (endDate && now > endDate) {
        return false;
    }

    return true;
}

/**
 * Função para criar a sequência de reprodução para itens de mídia
 */
function createPlaybackSequence() {
    mediaData = [];
    let normalIndex = 0;
    let sequentialIndex = {};
    let intercalatedIndex = {};

    while (normalIndex < normalMedia.length) {
        mediaData.push(normalMedia[normalIndex]);

        Object.keys(sequentialCounts).forEach(count => {
            if (!sequentialIndex[count]) sequentialIndex[count] = 0;
            if ((normalIndex + 1) % count === 0) {
                mediaData.push(...sequentialCounts[count]);
                sequentialIndex[count]++;
            }
        });

        Object.keys(intercalatedCounts).forEach(count => {
            if (!intercalatedIndex[count]) intercalatedIndex[count] = 0;
            if ((normalIndex + 1) % count === 0) {
                const intercalatedItems = intercalatedCounts[count];
                intercalatedItems.forEach((item, index) => {
                    if ((intercalatedIndex[count] + index) % intercalatedItems.length === 0) {
                        mediaData.push(item);
                    }
                });
                intercalatedIndex[count]++;
            }
        });

        normalIndex++;
    }

    startSlideshow();
}

/**
 * Função para buscar dados de mídia a partir de um arquivo JSON
 */
function fetchMediaData() {
    fetch('programacao.json')
        .then(response => response.json())
        .then(data => {
            organizeMediaData(data);
            internetConnected = true; // Redefinir status da conexão com a internet em caso de sucesso
        })
        .catch(error => {
            console.error('Erro ao buscar dados de mídia:', error);
            internetConnected = false; // Atualizar status da conexão com a internet em caso de erro
        });
}

/**
 * Função para iniciar o slideshow
 */
function startSlideshow() {
    loadMedia();
}

// Buscar dados inicialmente e configurar intervalo para atualizar dados a cada 30 segundos
fetchMediaData();
setInterval(fetchMediaData, 30000); // 30000 ms = 30 segundos
