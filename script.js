const mediaContainer = document.getElementById('media-container');
const deviceInfoElement = document.getElementById('device-info');
let mediaData = [];
let normalMedia = [];
let sequentialMedia = [];
let intercalatedMedia = [];
let currentIndex = 0;
let sequentialCounts = {};
let intercalatedCounts = {};
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

// Fetch geolocation data
function fetchGeolocation() {
    fetch('https://ipinfo.io/json?token=fefcbc0ea76800') // Using your actual token
        .then(response => response.json())
        .then(data => {
            const location = `${data.city}, ${data.region}`;
            deviceInfoElement.textContent = `ID: ${deviceIdentifier}, Location: ${location}`;
        })
        .catch(error => {
            console.error('Error fetching geolocation data:', error);
            deviceInfoElement.textContent = `ID: ${deviceIdentifier}, Location: Unknown`;
        });
}

// Fetch geolocation data initially
fetchGeolocation();

function loadMedia() {
    if (mediaData.length === 0) return;

    const currentMedia = mediaData[currentIndex];
    mediaContainer.innerHTML = ''; // Clear previous media

    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.path;
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
            mediaContainer.appendChild(iframe);
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
            });

            mediaContainer.appendChild(video);
        }
    }

    // Clear previous timeout before setting a new one
    clearTimeout(timeoutId);
    timeoutId = setTimeout(loadNextMedia, currentMedia.duration * 1000);

    currentIndex = (currentIndex + 1) % mediaData.length;
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

function organizeMediaData(data) {
    const now = new Date();
    normalMedia = data.filter(item => item.categoria === 'Normal' && shouldDisplayItem(item, now));
    sequentialMedia = data.filter(item => item.categoria === 'Sequencial' && shouldDisplayItem(item, now) && item.repeatCount && item.repeatCount > 0);
    intercalatedMedia = data.filter(item => item.categoria === 'Intercalada' && shouldDisplayItem(item, now) && item.repeatCount && item.repeatCount > 0);
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

function shouldDisplayItem(item, now) {
    const isExcluded = item.excludedTVs && item.excludedTVs.includes(deviceIdentifier);
    const isIncluded = item.includedTVs && item.includedTVs.includes(deviceIdentifier);
    const startDate = item.dataDeInicio ? new Date(item.dataDeInicio) : null;
    const endDate = item.dataDeExclusao ? new Date(item.dataDeExclusao) : null;

    if (item.includedTVs && item.includedTVs.length > 0 && !isIncluded) {
        return false;
    }

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

function createPlaybackSequence() {
    mediaData = [];
    let normalIndex = 0;
    let sequentialIndex = {};
    let intercalatedIndex = {};

    while (normalIndex < normalMedia.length) {
        mediaData.push(normalMedia[normalIndex]);

        // Process sequential media first
        Object.keys(sequentialCounts).forEach(count => {
            if (!sequentialIndex[count]) sequentialIndex[count] = 0;
            if ((normalIndex + 1) % count === 0) {
                mediaData.push(...sequentialCounts[count]);
                sequentialIndex[count]++;
            }
        });

        // Process intercalated media after sequential media
        Object.keys(intercalatedCounts).forEach(count => {
            if (!intercalatedIndex[count]) intercalatedIndex[count] = 0;
            if ((normalIndex + 1) % count === 0) {
                const intercalatedItems = intercalatedCounts[count];
                intercalatedItems.forEach((item, index) => {
                    mediaData.push(item);
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
            internetConnected = true; // Reset internet connection status on successful fetch
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
