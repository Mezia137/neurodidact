// Connexion au namespace 'reseausimple'
const socket = io.connect('http://' + document.domain + ':' + location.port + '/reseausimple');
const barContainer = document.getElementById('loading-bar-container');
const bar = document.getElementById('loading-bar');

let isTraining = false;

let isDraggingBar = false;
let totalSteps = 0;
let step = 0;

function updateImage(imagePath) {
    var imageDisplay = document.getElementById('image-display');
    var nouvelleImage = document.createElement('img');
    nouvelleImage.src = imagePath;
    nouvelleImage.style.position = 'absolute';
    nouvelleImage.style.top = 0;
    nouvelleImage.style.left = 0;
    nouvelleImage.style.width = '100%';
    nouvelleImage.style.zIndex = 1;
    if (imageDisplay.firstChild === null){
					imageDisplay.appendChild(nouvelleImage);
				}
				else{
					imageDisplay.insertBefore(nouvelleImage,imageDisplay.firstChild);
                }
    while (imageDisplay.childNodes.length > 2) {
        imageDisplay.removeChild(imageDisplay.lastChild);
    }
    imageDisplay.lastChild.style.zIndex = 0;
}

function updateBar(toStep) {
    if (totalSteps === 0) {
            bar.style.width = '0';
    } else {
            let new_width = toStep * 100 / totalSteps;
            console.log(new_width);
            bar.style.width = new_width + '%';
    }
    document.getElementById('affichage_etape').textContent = toStep;
}

function updateNet(weights) {
    Object.keys(weights).forEach(function(cle) {weights[cle] = Math.abs(weights[cle]);});
    var wmax = Math.max(...Object.values(weights));
    var wmin = Math.min(...Object.values(weights));
    var echelle = 30/(wmax - wmin)
    for (var w in weights) {
        document.getElementById(w).style.strokeWidth = parseInt(Math.abs((weights[w]-wmin)*echelle + 10));
    }
    console.log(document.getElementById('w020').style.strokeWidth)
}

document.addEventListener('DOMContentLoaded', function() {
    socket.on('nouvelle_image', function(data) {
        updateImage(data.image_path);
    });
    socket.on('avancement', function(data) {
        updateBar(data);
        if (data === totalSteps) {
            reableButtons();
        }
    });
    socket.on('update_net', function(data) {
        updateNet(data);
    });
});

function startTraining() {
    disableButtons()
    var nombre_passages = parseInt(document.getElementById('input-nombre_passages').value, 10);
    totalSteps += nombre_passages;
    socket.emit('start_training', {passages:nombre_passages});
    return false;  // Empêche le formulaire de recharger la page
}

function restartTraining() {
    totalSteps = 0;
    updateBar(0);
    document.getElementById('affichage_etape').textContent = 0;
    socket.emit('resume_training');
}

function showImageN(n) {
    socket.emit('get_image', {etape:n});
}

function disableButtons() {
    isTraining = true;
    document.querySelectorAll('button').forEach(function(bouton) {bouton.disabled = true;});
    document.getElementById("input-nombre_passages").disabled = true;

    document.getElementById("loading-bar-container").style.cursor = "not-allowed";

    document.getElementById("#previouspage-link").style.cursor = "not-allowed";
    document.getElementById("#previouspage-link").style.opacity = "0.2";
    document.querySelectorAll('a').forEach(function(link) {link.addEventListener("click", function(event) {event.preventDefault();});});

    document.querySelector('header').style.cursor = 'not-allowed';
}

function reableButtons() {
    isTraining = false;
    document.querySelectorAll('button').forEach(function(bouton) {bouton.disabled = false;});
    document.getElementById("input-nombre_passages").disabled = false;

    document.getElementById("loading-bar-container").style.cursor = "pointer";

    document.querySelector('header').style.cursor = 'auto';
}

barContainer.addEventListener('mousedown', (e) => {
    if (isTraining === false) {
        isDraggingBar = true;
        barContainer.style.userSelect = 'none';
        barContainer.style.height = '10px';
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDraggingBar) {
        let mouseX = e.clientX - barContainer.getBoundingClientRect().left;
        oldstep = step;
        step = Math.round((Math.min(Math.max(mouseX, 0), window.innerWidth) / barContainer.clientWidth) * totalSteps);
        updateBar(step);
        if (oldstep != step) {
            showImageN(step);
        }
    }
});

document.addEventListener('mouseup', () => {
    if (isDraggingBar) {
        isDraggingBar = false;
        barContainer.style.userSelect = '';
        barContainer.style.height = '5px';
    }
});

window.onbeforeunload = function() {
    socket.emit('closing_page');
};