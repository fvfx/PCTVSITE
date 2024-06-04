const mediaContainer = document.getElementById('media-container');
const deviceNameElement = document.getElementById('device-name');
let mediaData = [];
let normalMedia = [];
let sequentialMedia = [];
let intercalatedMedia = [];
let currentIndex = 0;
let sequentialCounts = {};
let intercalatedCounts = {};

// Get device name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const deviceName = urlParams.get('device') || 'Unknown Device';
deviceNameElement.textContent = deviceName;

function loadMedia() {
    if (mediaData.length === 0) return;

    const currentMedia = mediaData[currentIndex];
    mediaContainer.innerHTML = ''; // Clear previous media

    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.path;
        mediaContainer.appendChild(img);

        setTimeout(loadMedia, currentMedia.duration * 1000);
    } else if (currentMedia.type === 'video') {
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

            setTimeout(loadMedia, currentMedia.duration * 1000);
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

            setTimeout(loadMedia, currentMedia.duration * 1000);
        } else {
            const video = document.createElement('video');
            video.src = currentMedia.path;
            video.autoplay = true;
            video.loop = false;
            video.muted = true; // Remove mute if you want sound
            video.controls = false;
            video.style.display = 'block';

            video.addEventListener('canplay', () => {
                video.play();
                setTimeout(loadMedia, currentMedia.duration * 1000);
            });

            mediaContainer.appendChild(video);
        }
    }

    currentIndex = (currentIndex + 1) % mediaData.length;
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    return (match && match[2]) ? match[2] : null;
}

function extractVimeoId(url) {
    const regExp = /vimeo.com\/(\d+)/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
}

function organizeMediaData(data) {
    normalMedia = data.filter(item => item.categoria === 'Normal' && !item.excludedTVs.includes(deviceName));
    sequentialMedia = data.filter(item => item.categoria === 'Sequencial' && !item.excludedTVs.includes(deviceName));
    intercalatedMedia = data.filter(item => item.categoria === 'Intercalada' && !item.excludedTVs.includes(deviceName));
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

function fetchMediaData() {
    fetch('programacao.json')
        .then(response => response.json())
        .then(data => {
            organizeMediaData(data);
        })
        .catch(error => console.error('Error fetching media data:', error));
}

function startSlideshow() {
    loadMedia();
}

fetchMediaData();
