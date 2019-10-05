(function () {
    // Particle Types
    const particleType = {
        FOOD: "FOOD",
        DEAD_FOOD: "DEAD_FOOD",
        ANIMATE: "ANIMATE",
    };

    class GameSimulation extends Simulation {
        createParticle() {
            return new GameParticle();
        }

        clickedAt(e) {
            let [x, y,] = this.browserPositionToWorld(e.clientX, e.clientY);
            console.log("clicked at", x, ",", y);
            if (this.canSpawn()) {
                let particle = this.spawn(particleType.ANIMATE);
                particle.x = x;
                particle.y = y;
            }
        }

        reactToSight(particle, visibleNeighbours) {
            if (particle.type === particleType.ANIMATE) {
                for (let [neighbour, distance] of visibleNeighbours) {
                    if (neighbour.type === particleType.FOOD && distance <= sqr(particle.feedingRange)) {
                        neighbour.init(particleType.DEAD_FOOD);
                    }
                }
            }
        }

        makeDescision(particle) {
            switch (particle.type) {
                case particleType.DEAD_FOOD:
                    particle.init(particleType.FOOD);
                    break;
                case particleType.ANIMATE:
                    let angle = random(0, 2 * Math.PI);
                    let vx = Math.cos(angle);
                    let vy = Math.sin(angle);
                    particle.vx = vx * particle.speed;
                    particle.vy = vy * particle.speed;
                    break;
                case particleType.FOOD:
                    // ?
                    break;
            }
        }

        doAction(particle, dt) {
            switch (particle.type) {
                case particleType.DEAD_FOOD:
                    // ?
                    break;
                case particleType.ANIMATE:
                    this.doMovement(particle, dt);
                    break;
                case particleType.FOOD:
                    // ?
                    break;
            }
        }
    }

    class GameParticle extends Particle {
        constructor() {
            super();
        }

        init(type) {
            this.type = type;
            this.decisionTimeout = 0;

            switch (this.type) {
                case particleType.FOOD:
                    // somewhat green
                    this.color = color.hsv2rgb(random(90, 130), random(.6,1), 1);
                    this.decisionDuration = 10;
                    break;
                case particleType.ANIMATE:
                    this.speed = 50;

                    this.decisionDuration = 2;
                    this.sightRange = 30;
                    this.feedingRange = 15;
                    break;
                case particleType.DEAD_FOOD:
                    this.decisionDuration = 4 + random(1, 5) + random(1, 5);
                    this.decisionTimeout = this.decisionDuration;
                    this.color = color.hsv2rgb(random(15, 45), random(.6,1), 1);
                    break;
                default:
                    this.color = color.magenta;
            }
        }
    }

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");



    let shaders = [
        loadShader(gl, "scripts/shader/particle", ["vertexPosition", "color"], ["projectionMatrix", "viewMatrix", "modelMatrix", "size"])
    ];

    Promise.all(shaders).then(loadedShaders => {
        runGame(canvas, gl, loadedShaders);
    }, err => {
        console.log("Error!", err)
    });

    function runGame(canvas, gl, [particleShader]) {
        let sim = new GameSimulation(canvas, gl, particleShader);
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
            for (let i = 0; i < 1000; ++i) {
                randomizeAndPlace(sim.spawn(particleType.FOOD));
            }
            onFinish()
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
    }

})();

