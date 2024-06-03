﻿document.addEventListener("DOMContentLoaded", function() {
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
        repeatCounters = {
            sequencial: 0,
            intercalada: 0
        };
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

        // Verifica se há uma mídia sequencial a ser exibida
        if (repeatCounters.sequencial % getRepeatCount(sequencialMedia) === 0 && sequencialMedia.length > 0) {
            let sequencialItem = getNextSequencialMedia();
            if (sequencialItem) {
                repeatCounters.sequencial++;
                return sequencialItem;
            }
        }

        // Verifica se há uma mídia intercalada a ser exibida
        if (repeatCounters.intercalada % getRepeatCount(intercaladaMedia) === 0 && intercaladaMedia.length > 0) {
            let intercaladaItem = getNextIntercaladaMedia();
            if (intercaladaItem) {
                repeatCounters.intercalada++;
                return intercaladaItem;
            }
        }

        repeatCounters.sequencial++;
        repeatCounters.intercalada++;
        currentNormalIndex++;
        return media;
    }

    function getRepeatCount(mediaArray) {
        if (mediaArray.length === 0) return 1;
        return mediaArray[0].repeatCount || 1;
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
        while (sequencialIndex < sequencialMedia.length) {
            let media = sequencialMedia[sequencialIndex];
            sequencialIndex++;
            if (isValidMedia(media)) {
                return media;
            }
        }
        sequencialIndex = 0;
        return null;
    }

    function getNextIntercaladaMedia() {
        while (intercaladaIndex < intercaladaMedia.length) {
            let media = intercaladaMedia[intercaladaIndex];
            intercaladaIndex++;
            if (isValidMedia(media)) {
                return media;
            }
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
