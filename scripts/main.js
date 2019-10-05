(function () {

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");


    const vertexShader = `
        attribute vec4 vertexPosition;
        attribute vec4 color;
        
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform float size;
        
        varying vec4 pointColor;
        
        void main() {
            vec4 rounded = vec4(floor(vertexPosition.x + 0.5), floor(vertexPosition.y + 0.5), vertexPosition.z, vertexPosition.w);
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * rounded;
            gl_PointSize = size;
            pointColor = color.rgba;
        }
    `;

    const fragmentShader = `
        varying mediump vec4 pointColor;
        
        void main() {
            gl_FragColor = pointColor;
        }
    `;

    let defaultShader = buildShader(gl, vertexShader, fragmentShader, ["vertexPosition", "color"], ["projectionMatrix", "viewMatrix", "modelMatrix", "size"]);

    let sim = new Simulation(canvas, gl, defaultShader);
    window.addEventListener('mousemove', e => {
        sim.mouseX = e.clientX - canvas.clientLeft;
        sim.mouseY = e.clientY - canvas.clientTop;
        sim.mouseReachable = true;
    });
    window.addEventListener('mouseout', () => {
        sim.mouseReachable = false;
    });
    window.addEventListener('click', e => {
        sim.clickedAt(e);
    });

    const halfWidth = (canvas.width / 2);
    const halfHeight = (canvas.height / 2);

    function randomizeAndPlace(particle) {
        particle.x = (gaussianRand() * 2 - 1) * halfWidth;
        particle.y = (gaussianRand() * 2 - 1) * halfHeight;
    }

    function setupWorld(onFinish) {
        // for (let i = 0; i < bunchSize && sim.aliveParticles.length < sim.particlePoolSize; ++i) {
        //     randomizeAndPlace(sim.spawn());
        // }
        // if (sim.aliveParticles.length < sim.particlePoolSize) {
        //     setTimeout(() => setupWorld(counter, sim, bunchSize, delay, onFinish), delay);
        // } else {
        //     onFinish();
        // }
         for (let i = 0; i < 100; ++i) {
             spawnFood()
         }
        onFinish()
    }

    function spawnFood() {
        let food = sim.spawn();
        randomizeAndPlace(food);
        food.color = color.hsv2rgb(random(90, 130), random(.6,1), 1);

    }

    let player = sim.spawn();

    player.color = color.hsv2rgb(random(90, 130), random(.6,1), 1);

    setupWorld(() => {
        renderLoop(window, 0, dt => {
            sim.update(dt);
            sim.render();
        });
        setTimeout(() => canvas.classList.add("loaded"), 1000);
    });


})();

