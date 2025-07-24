let scene, camera, renderer;
let trails = [];
let time = 0;
const trailCount = 80;
const trailLength = 150;

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 30, 80);
    
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 30;
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('particles-canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    createTrails();
    
    window.addEventListener('resize', onWindowResize, false);
}

function createTrails() {
    for (let i = 0; i < trailCount; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        const colors = new Float32Array(trailLength * 3);
        const opacities = new Float32Array(trailLength);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            linewidth: 1
        });
        
        const line = new THREE.Line(geometry, material);
        
        trails.push({
            line: line,
            offset: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.4,
            radius: 16 + Math.random() * 4,
            verticalSpeed: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2
        });
        
        scene.add(line);
    }
}

function infinityPath(t, scale = 20) {
    const a = scale;
    const b = scale * 0.6;
    
    const cost = Math.cos(t);
    const sint = Math.sin(t);
    const sin2t = Math.sin(2 * t);
    
    const x = a * cost / (1 + sint * sint);
    const y = b * sin2t / (1 + sint * sint);
    
    return { x, y };
}

function updateTrail(trail, index) {
    const positions = trail.line.geometry.attributes.position.array;
    const colors = trail.line.geometry.attributes.color.array;
    const opacities = trail.line.geometry.attributes.opacity.array;
    
    const baseTime = time * trail.speed + trail.offset;
    
    for (let i = 0; i < trailLength; i++) {
        const t = baseTime - i * 0.01;
        const point = infinityPath(t, trail.radius);
        
        const wave = Math.sin(t * 4 + trail.phase) * 0.3;
        const zWave = Math.sin(t * trail.verticalSpeed + trail.phase) * 2;
        
        const i3 = i * 3;
        positions[i3] = point.x + Math.sin(t * 6) * wave;
        positions[i3 + 1] = point.y + Math.cos(t * 6) * wave * 0.5;
        positions[i3 + 2] = zWave;
        
        const fade = 1 - (i / trailLength);
        const brightness = fade * 0.8;
        
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness;
        
        opacities[i] = fade * 0.6;
    }
    
    trail.line.geometry.attributes.position.needsUpdate = true;
    trail.line.geometry.attributes.color.needsUpdate = true;
    trail.line.geometry.attributes.opacity.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    trails.forEach((trail, index) => {
        updateTrail(trail, index);
    });
    
    camera.position.x = Math.sin(time * 0.1) * 5;
    camera.position.y = Math.cos(time * 0.1) * 3;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();

// Audio handling
const audio = document.getElementById('background-audio');
let audioStarted = false;

// Try to start audio immediately
audio.play().catch(() => {
    // If autoplay fails, wait for user interaction
    console.log('Autoplay blocked, waiting for user interaction');
});

// Function to start audio
function startAudio() {
    if (!audioStarted) {
        audio.play().then(() => {
            audioStarted = true;
            console.log('Audio started');
        }).catch(err => {
            console.error('Audio play failed:', err);
        });
    }
}

// Listen for various user interactions
document.addEventListener('click', startAudio);
document.addEventListener('keydown', startAudio);
document.addEventListener('touchstart', startAudio);
document.addEventListener('mousemove', startAudio);

// Drag functionality
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialX = 0;
let initialY = 0;

const addressContainer = document.querySelector('.address-container');
const addressElement = document.getElementById('address');

// Mouse events
addressElement.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return; // Only left mouse button
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = addressContainer.getBoundingClientRect();
    initialX = rect.left + rect.width / 2 - window.innerWidth / 2;
    initialY = rect.top + rect.height / 2 - window.innerHeight / 2;
    
    addressElement.classList.add('dragging');
    e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    const newX = initialX + deltaX;
    const newY = initialY + deltaY;
    
    addressContainer.style.left = `calc(50% + ${newX}px)`;
    addressContainer.style.top = `calc(50% + ${newY}px)`;
    addressContainer.style.bottom = 'auto';
});

document.addEventListener('mouseup', function() {
    if (isDragging) {
        isDragging = false;
        addressElement.classList.remove('dragging');
    }
});

// Touch events for mobile
addressElement.addEventListener('touchstart', function(e) {
    isDragging = true;
    const touch = e.touches[0];
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    
    const rect = addressContainer.getBoundingClientRect();
    initialX = rect.left + rect.width / 2 - window.innerWidth / 2;
    initialY = rect.top + rect.height / 2 - window.innerHeight / 2;
    
    addressElement.classList.add('dragging');
    e.preventDefault();
});

document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const deltaY = touch.clientY - dragStartY;
    
    const newX = initialX + deltaX;
    const newY = initialY + deltaY;
    
    addressContainer.style.left = `calc(50% + ${newX}px)`;
    addressContainer.style.top = `calc(50% + ${newY}px)`;
    addressContainer.style.bottom = 'auto';
    
    e.preventDefault();
});

document.addEventListener('touchend', function() {
    if (isDragging) {
        isDragging = false;
        addressElement.classList.remove('dragging');
    }
});

// Copy to clipboard functionality - only trigger if not dragging
let clickTimeout;
addressElement.addEventListener('click', function(e) {
    // Prevent copy if we just finished dragging
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        if (!isDragging) {
            const address = this.textContent;
            navigator.clipboard.writeText(address).then(function() {
                const message = document.getElementById('copied-message');
                message.classList.add('show');
                setTimeout(function() {
                    message.classList.remove('show');
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy: ', err);
            });
        }
    }, 10);
});