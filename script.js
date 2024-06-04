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
    } else if (currentMedia.type === 'video') {
        const video = document.createElement('video');
        video.src = currentMedia.path;
        video.autoplay = true;
        video.loop = true;
        mediaContainer.appendChild(video);
    }

    setTimeout(loadMedia, currentMedia.duration * 1000);
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
