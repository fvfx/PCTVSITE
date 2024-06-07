const mediaContainer = document.getElementById('media-container');
const deviceInfoElement = document.getElementById('device-info');
let mediaData = [];
let currentIndex = 0;
let timeoutId;  // Variable to store timeout ID
let internetConnected = true; // Variable to track internet connection status

// Function to generate a shorter unique identifier
function generateShortUUID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uuid = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        uuid += chars[randomIndex];
    }
    return uuid;
}

// Get or set device identifier in local storage
let deviceIdentifier = localStorage.getItem('deviceIdentifier');
if (!deviceIdentifier) {
    deviceIdentifier = generateShortUUID();
    localStorage.setItem('deviceIdentifier', deviceIdentifier);
}

// Display the device identifier in the bottom left corner
deviceInfoElement.textContent = `ID: ${deviceIdentifier}`;

function loadMedia() {
    if (mediaData.length === 0) return;

    const currentMedia = mediaData[currentIndex];
    mediaContainer.innerHTML = ''; // Clear previous media

    if (shouldDisplayItem(currentMedia)) {
        let mediaPath = `${currentMedia.path}?timestamp=${new Date().getTime()}`; // Add a unique parameter to the URL

        if (currentMedia.type === 'image') {
            const img = document.createElement('img');
            img.src = mediaPath;
            img.onerror = () => loadNextMedia(); // Skip if the image fails to load
            mediaContainer.appendChild(img);
        } else if (currentMedia.type === 'video') {
            if (!internetConnected && (currentMedia.path.includes('youtube.com') || currentMedia.path.includes('youtu.be') || currentMedia.path.includes('vimeo.com'))) {
                // Skip the video if no internet connection
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
                iframe.onerror = () => loadNextMedia(); // Skip if the iframe fails to load
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
                iframe.onerror = () => loadNextMedia(); // Skip if the iframe fails to load
                mediaContainer.appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.src = mediaPath;
                video.autoplay = true;
                video.loop = false;
                video.muted = true; // Remove mute if you want sound
                video.controls = false;
                video.style.display = 'block';
                video.onerror = () => loadNextMedia(); // Skip if the video fails to load

                video.addEventListener('canplay', () => {
                    video.play();
                });

                mediaContainer.appendChild(video);
            }
        }

        // Clear previous timeout before setting a new one
        clearTimeout(timeoutId);
        timeoutId = setTimeout(loadNextMedia, currentMedia.duration * 1000);
    } else {
        loadNextMedia(); // Skip the media if it shouldn't be displayed
    }
}

function loadNextMedia() {
    currentIndex = (currentIndex + 1) % mediaData.length;
    loadMedia();
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

function shouldDisplayItem(item) {
    const now = new Date();
    const isExcluded = item.excludedTVs && item.excludedTVs.includes(deviceIdentifier);
    const startDate = item.dataDeInicio ? new Date(item.dataDeInicio) : null;
    const endDate = item.dataDeExclusao ? new Date(item.dataDeExclusao) : null;

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

function fetchMediaData() {
    fetch('programacao.json')
        .then(response => response.json())
        .then(data => {
            mediaData = data;
            internetConnected = true; // Reset internet connection status on successful fetch
            startSlideshow();
        })
        .catch(error => {
            console.error('Error fetching media data:', error);
            internetConnected = false; // Update internet connection status on fetch error
        });
}

function startSlideshow() {
    loadMedia();
}

// Fetch data initially and set up interval to refresh data every 30 seconds
fetchMediaData();
setInterval(fetchMediaData, 30000); // 30000 ms = 30 seconds
