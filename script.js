const mediaContainer = document.getElementById('media-container');
let mediaData = [];
let currentIndex = 0;
let preloadedVideo = null;

function loadMedia() {
    if (mediaData.length === 0) return;

    const currentMedia = mediaData[currentIndex];

    mediaContainer.innerHTML = ''; // Clear previous media

    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.path;
        mediaContainer.appendChild(img);

        preloadNextMedia(); // Preload the next media

        setTimeout(() => {
            if (preloadedVideo) {
                mediaContainer.innerHTML = '';
                mediaContainer.appendChild(preloadedVideo);
                preloadedVideo.play();
                preloadedVideo = null;
                setTimeout(loadMedia, currentMedia.duration * 1000 - 500); // Adjust the timing if necessary
            } else {
                loadMedia();
            }
        }, (currentMedia.duration - 0.5) * 1000);
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

function preloadNextMedia() {
    const nextIndex = (currentIndex + 1) % mediaData.length;
    const nextMedia = mediaData[nextIndex];

    if (nextMedia.type === 'video') {
        const video = document.createElement('video');
        video.src = nextMedia.path;
        video.autoplay = false;
        video.loop = false;
        video.muted = true; // Remove mute if you want sound
        video.controls = false;
        video.style.display = 'block';
        video.style.visibility = 'hidden';

        video.addEventListener('canplay', () => {
            preloadedVideo = video;
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

