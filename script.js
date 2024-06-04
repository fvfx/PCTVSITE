const mediaContainer = document.getElementById('media-container');
let mediaData = [];
let currentIndex = 0;

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

    currentIndex = (currentIndex + 1) % mediaData.length;
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
