const mediaContainer = document.getElementById('media-container');
const systemNameDiv = document.getElementById('system-name');

let currentMediaIndex = 0;
let programming = [];
let lastFetchTime = 0;
let sequentialQueue = [];
let intercalatedQueue = [];

// Função para buscar a programação do JSON
async function fetchProgramming() {
  const response = await fetch('programacao.json');
  const data = await response.json();
  return data;
}

// Função para verificar se um arquivo deve ser exibido com base nas datas
function shouldDisplay(media) {
  const now = new Date();
  const dataDeInicio = media.dataDeInicio ? new Date(media.dataDeInicio) : null;
  const dataDeExclusao = media.dataDeExclusao ? new Date(media.dataDeExclusao) : null;

  return (!dataDeInicio || now >= dataDeInicio) && (!dataDeExclusao || now <= dataDeExclusao);
}

// Função principal para carregar e exibir a mídia
async function loadMedia() {
  // Filtrar a programação com base nas datas e TVs excluídas
  const filteredProgramming = programming.filter(media => shouldDisplay(media) && !media.excludedTVs.includes(systemNameDiv.textContent));

  // Obter o próximo item da programação, considerando as categorias "Sequencial" e "Intercalada"
  let nextMedia = null;
  if (sequentialQueue.length > 0) {
    nextMedia = sequentialQueue.shift();
  } else if (intercalatedQueue.length > 0) {
    nextMedia = intercalatedQueue.shift();
  } else {
    nextMedia = filteredProgramming[currentMediaIndex];
    currentMediaIndex = (currentMediaIndex + 1) % filteredProgramming.length;

    // Adicionar próximos itens sequenciais e intercalados às filas
    filteredProgramming.forEach((media, index) => {
      if (media.categoria === 'Sequencial' && index > currentMediaIndex && shouldDisplay(media)) {
        sequentialQueue.push(media);
      } else if (media.categoria === 'Intercalada' && index > currentMediaIndex && shouldDisplay(media)) {
        intercalatedQueue.push(media);
      }
    });
  }

  // Exibir a mídia selecionada
  if (nextMedia) {
    mediaContainer.innerHTML = ''; // Limpar o container
    const mediaElement = nextMedia.type === 'image' ? document.createElement('img') : document.createElement('video');
    mediaElement.src = nextMedia.path;

    if (nextMedia.type === 'video') {
      mediaElement.autoplay = true;
      mediaElement.controls = false; // Opcional: remover controles do vídeo

      // Lógica para tela cheia (requer interação do usuário em alguns navegadores)
      // ...
    }

    mediaContainer.appendChild(mediaElement);

    // Agendar a próxima exibição usando setTimeout
    setTimeout(loadMedia, nextMedia.duration * 1000);
  }
}

// Função para verificar se houve alterações na programação
async function updateProgramming() {
  const currentTime = Date.now();
  if (currentTime - lastFetchTime >= 60000) { // 60 segundos
    const newProgramming = await fetchProgramming();

    if (JSON.stringify(newProgramming) !== JSON.stringify(programming)) {
      programming = newProgramming;
      currentMediaIndex = 0;
      sequentialQueue = [];
      intercalatedQueue = [];
      loadMedia(); // Recarregar a programação imediatamente
    }

    lastFetchTime = currentTime;
  }
}

// Função para obter o nome do sistema (implementação específica para seu ambiente)
function getSystemName() {
  // ... lógica para obter o nome do sistema ...
  return "NomeDoSistema"; // Substitua pelo nome real
}

// Função para verificar e limpar o cache (implementação específica para seu ambiente)
function checkAndClearCache() {
  // ... lógica para verificar e limpar o cache ...
}

// Inicialização da página
async function init() {
  programming = await fetchProgramming();
  systemNameDiv.textContent = getSystemName();
  loadMedia();
  setInterval(updateProgramming, 10000); // Verificar a cada 10 segundos
  setInterval(checkAndClearCache, 300000); // Verificar cache a cada 5 minutos
}

init();
