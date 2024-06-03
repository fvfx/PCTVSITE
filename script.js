document.addEventListener("DOMContentLoaded", function() {
    let mediaData = [];
    let contentElement = document.getElementById('content');
    let systemNameElement = document.getElementById('system-name');
    let normalMedia = [];
    let sequencialMedia = [];
    let intercaladaMedia = [];
    let currentNormalIndex = 0;
    let sequencialIndex = 0;
    let intercaladaIndex = 0;
    let repeatCounters = {
        sequencial: 0,
        intercalada: 0
    };

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
        sequencialIndex = 0;
        intercaladaIndex = 0;
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
        if (currentNormalIndex >= normalMedia.length) {
            currentNormalIndex = 0;
        }

        let media = normalMedia[currentNormalIndex];
        let sequencialItem = getNextSequencialMedia();
        let intercaladaItem = getNextIntercaladaMedia();

        if (sequencialItem && repeatCounters.sequencial % sequencialItem.repeatCount === 0) {
            repeatCounters.sequencial++;
            return sequencialItem;
        }

        if (intercaladaItem && repeatCounters.intercalada % intercaladaItem.repeatCount === 0) {
            repeatCounters.intercalada++;
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
            contentElement.appendChild(mediaElement);
        }
    }

    function getNextSequencialMedia() {
        if (sequencialIndex >= sequencialMedia.length) {
            sequencialIndex = 0;
        }

        let media = sequencialMedia[sequencialIndex];
        if (isValidMedia(media)) {
            sequencialIndex++;
            return media;
        }

        sequencialIndex++;
        return getNextSequencialMedia();
    }

    function getNextIntercaladaMedia() {
        if (intercaladaIndex >= intercaladaMedia.length) {
            intercaladaIndex = 0;
        }

        let media = intercaladaMedia[intercaladaIndex];
        if (isValidMedia(media)) {
            intercaladaIndex++;
            return media;
        }

        intercaladaIndex++;
        return getNextIntercaladaMedia();
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
