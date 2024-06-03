document.addEventListener("DOMContentLoaded", function() {
    let currentIndex = 0;
    let currentRepeatCounts = {};
    let mediaData = [];
    let contentElement = document.getElementById('content');
    let systemNameElement = document.getElementById('system-name');
    let normalMedia = [];
    let sequencialMedia = [];
    let intercaladaMedia = [];
    let sequencialIndex = 0;
    let intercaladaIndex = 0;

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
        currentIndex = 0;
        sequencialIndex = 0;
        intercaladaIndex = 0;
        currentRepeatCounts = {};
        categorizeMedia();
        displayNextMedia();
    }

    function categorizeMedia() {
        normalMedia = mediaData.filter(media => media.categoria === "Normal");
        sequencialMedia = mediaData.filter(media => media.categoria === "Sequencial");
        intercaladaMedia = mediaData.filter(media => media.categoria === "Intercalada");
    }

    function displayNextMedia() {
        if (currentIndex >= normalMedia.length) {
            currentIndex = 0;
        }

        const media = normalMedia[currentIndex];

        contentElement.innerHTML = '';
        displayMedia(media);

        let sequencialItem = getNextSequencialMedia();
        if (sequencialItem) {
            setTimeout(() => displayMedia(sequencialItem), media.duration * 1000);
            setTimeout(displayNextMedia, (media.duration + sequencialItem.duration) * 1000);
        } else {
            setTimeout(displayNextMedia, media.duration * 1000);
        }

        let intercaladaItem = getNextIntercaladaMedia();
        if (intercaladaItem) {
            setTimeout(() => displayMedia(intercaladaItem), media.duration * 1000);
            setTimeout(displayNextMedia, (media.duration + intercaladaItem.duration) * 1000);
        } else {
            setTimeout(displayNextMedia, media.duration * 1000);
        }

        currentIndex++;
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
            mediaElement.onended = () => { displayNextMedia(); };
        }

        if (mediaElement) {
            contentElement.appendChild(mediaElement);
        }
    }

    function getNextSequencialMedia() {
        while (sequencialIndex < sequencialMedia.length) {
            const media = sequencialMedia[sequencialIndex];
            const repeatCount = media.repeatCount || 1;
            currentRepeatCounts['Sequencial'] = (currentRepeatCounts['Sequencial'] || 0) + 1;
            if (currentRepeatCounts['Sequencial'] % repeatCount === 0) {
                sequencialIndex++;
                return media;
            }
            sequencialIndex++;
        }
        sequencialIndex = 0;
        return null;
    }

    function getNextIntercaladaMedia() {
        while (intercaladaIndex < intercaladaMedia.length) {
            const media = intercaladaMedia[intercaladaIndex];
            const repeatCount = media.repeatCount || 1;
            currentRepeatCounts['Intercalada'] = (currentRepeatCounts['Intercalada'] || 0) + 1;
            if (currentRepeatCounts['Intercalada'] % repeatCount === 0) {
                intercaladaIndex++;
                return media;
            }
            intercaladaIndex++;
        }
        intercaladaIndex = 0;
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
