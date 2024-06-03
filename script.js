document.addEventListener("DOMContentLoaded", function() {
    let currentIndex = 0;
    let mediaData = [];
    let contentElement = document.getElementById('content');
    let systemNameElement = document.getElementById('system-name');
    let normalMedia = [];
    let sequencialMedia = [];
    let intercaladaMedia = [];
    let currentNormalIndex = 0;
    let sequencialCounters = {};
    let intercaladaCounters = {};

    async function fetchJSON() {
        try {
            const response = await fetch('programacao.json');
            return await response.json();
        } catch (error) {
            console.error("Erro ao carregar o JSON:", error);
            return [];
        }
    }

    async function loadMediaData() {
        mediaData = await fetchJSON();
        categorizeMedia();
        currentNormalIndex = 0;
        sequencialCounters = {};
        intercaladaCounters = {};
        displayNextMedia();
    }

    function categorizeMedia() {
        normalMedia = mediaData.filter(media => media.categoria === "Normal");
        sequencialMedia = mediaData.filter(media => media.categoria === "Sequencial");
        intercaladaMedia = mediaData.filter(media => media.categoria === "Intercalada");
    }

    function displayNextMedia() {
        contentElement.innerHTML = '';
        let media = getNextMedia();

        if (media) {
            displayMedia(media);
            setTimeout(displayNextMedia, media.duration * 1000);
        }
    }

    function getNextMedia() {
        let media = normalMedia[currentNormalIndex];

        if (!media) {
            currentNormalIndex = 0;
            media = normalMedia[currentNormalIndex];
        }

        if (!isValidMedia(media)) {
            currentNormalIndex++;
            return getNextMedia();
        }

        let sequencialItem = getNextSequencialMedia();
        let intercaladaItem = getNextIntercaladaMedia();

        if (sequencialItem && sequencialItem.repeatCount <= intercaladaItem.repeatCount) {
            currentNormalIndex++;
            return sequencialItem;
        }

        if (intercaladaItem) {
            currentNormalIndex++;
            return intercaladaItem;
        }

        currentNormalIndex++;
        return media;
    }

    function displayMedia(media) {
        let mediaElement;
        if (media.type === 'image') {
            mediaElement = document.createElement('img');
            mediaElement.src = media.path;
        } else if (media.type === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.src = media.path;
            mediaElement.autoplay = true;
            mediaElement.muted = true;
        }

        if (mediaElement) {
            // Set width and height to maintain 16:9 aspect ratio
            mediaElement.style.width = '100%';
            mediaElement.style.height = 'auto';
            contentElement.appendChild(mediaElement);
        }
    }

    function getNextSequencialMedia() {
        for (let media of sequencialMedia) {
            if (isValidMedia(media)) {
                const repeatCount = media.repeatCount || 1;
                sequencialCounters[media.path] = (sequencialCounters[media.path] || 0) + 1;
                if (sequencialCounters[media.path] % repeatCount === 0) {
                    return media;
                }
            }
        }
        return null;
    }

    function getNextIntercaladaMedia() {
        for (let media of intercaladaMedia) {
            if (isValidMedia(media)) {
                const repeatCount = media.repeatCount || 1;
                intercaladaCounters[media.path] = (intercaladaCounters[media.path] || 0) + 1;
                if (intercaladaCounters[media.path] % repeatCount === 0) {
                    return media;
                }
            }
        }
        return null;
    }

    function isValidMedia(media) {
        const now = new Date();
        const startDate = media.dataDeInicio ? new Date(media.dataDeInicio) : null;
        const endDate = media.dataDeExclusao ? new Date(media.dataDeExclusao) : null;

        if (startDate && now < startDate) {
            return false;
        }
        if (endDate && now > endDate) {
            return false;
        }

        const systemName = getSystemName();
        if (media.excludedTVs.includes(systemName)) {
            return false;
        }

        return true;
    }

    function getSystemName() {
        return navigator.userAgent;
    }

    function updateSystemName() {
        systemNameElement.textContent = getSystemName();
    }

    setInterval(loadMediaData, 60000);  // Verifica mudanças no JSON a cada 60 segundos
    loadMediaData();  // Carrega a programação inicial
    updateSystemName();
});
