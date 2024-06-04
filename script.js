const mediaContainer = document.getElementById('media-container');
let mediaData = [];
let currentIndex = 0;
let nextMediaTimeout;

function loadMedia() {
    if (mediaData.length === 0) return;

    const currentMedia = mediaData[currentIndex];

    mediaContainer.innerHTML = ''; // Clear previous media

    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.path;
        img.style.position = 'absolute';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        mediaContainer.appendChild(img);

        preloadNextMedia(); // Preload the next media

        nextMediaTimeout = setTimeout(() => {
            loadMedia();
        }, currentMedia.duration * 1000);
    } else if (currentMedia.type === 'video') {
        const video = document.createElement('video');
        video.src = currentMedia.path;
        video.autoplay = true;
        video.loop = false;
        video.muted = true; // Remove mute if you want sound
        video.controls = false;
        video.style.position = 'absolute';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';

        video.addEventListener('canplay', () => {
            video.play();
        });

        mediaContainer.appendChild(video);

        nextMediaTimeout = setTimeout(() => {
            loadMedia();
        }, currentMedia.duration * 1000);
    }

    currentIndex = (currentIndex + 1) % mediaData.length;
}

function preloadNextMedia() {
    const nextIndex = (currentIndex + 1) % mediaData.length;
    const nextMedia = mediaData[nextIndex];

    if (nextMedia.type === 'video') {
        const video = document.createElement('video');
        video.src = nextMedia.path;
        video.autoplay = false; // Do not autoplay yet
        video.loop = false;
        video.muted = true; // Remove mute if you want sound
        video.controls = false;
        video.style.position = 'absolute';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.display = 'none'; // Hide initially

        video.addEventListener('canplay', () => {
            video.style.display = 'block';
        });

        mediaContainer.appendChild(video);
    }
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

function fetchMediaData() {
    fetch('programacao.json')
        .then(response => response.json())
        .then(data => {
            mediaData = data.filter(item => item.categoria === 'Normal');
            startSlideshow();
        })
        .catch(error => console.error('Error fetching media data:', error));
}

function startSlideshow() {
    loadMedia();
}

fetchMediaData();
