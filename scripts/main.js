(function () {
    // Particle Types
    const particleType = {
        FOOD: "FOOD",
        DEAD_FOOD: "DEAD_FOOD",
        CORPSE: "CORPSE",
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

        makeDescision(particle, visibleNeighbours) {
            switch (particle.type) {
                case particleType.DEAD_FOOD:
                    particle.init(particleType.FOOD);
                    break;
                case particleType.CORPSE:
                    this.kill(particle);
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

        doAction(particle, visibleNeighbours, dt) {
            switch (particle.type) {
                case particleType.DEAD_FOOD:
                    // ?
                    break;
                case particleType.ANIMATE:
                    if (particle.type === particleType.ANIMATE) {
                        for (let [neighbour, distance] of visibleNeighbours) {
                            if ((neighbour.type === particleType.FOOD || neighbour.type === particleType.CORPSE) && distance <= sqr(particle.feedingRange)) {
                                if (neighbour.type === particleType.FOOD) {
                                    neighbour.init(particleType.DEAD_FOOD); // eat food
                                }
                                if (neighbour.type === particleType.CORPSE) {
                                    this.kill(neighbour); // eat corpse
                                }
                                particle.energy += neighbour.foodValue;
                            }

                            // canibalism?
                            // attack range?
                            if (particle !== neighbour && neighbour.type === particleType.ANIMATE && distance <= sqr(particle.feedingRange)) {
                                // need half energy of enemy, and must be hungry (under half energy)
                                if (particle.energy * 2 > neighbour.energy && particle.energy * 2 < particle.maxEnergy) {
                                    particle.energy -= neighbour.energy / 2; // expend half of enemy energy
                                    neighbour.init(particleType.CORPSE);
                                    console.log("canibalism!")
                                }
                            }

                            if (neighbour.type === particleType.ANIMATE && particle.team !== neighbour.team && distance <= sqr(particle.feedingRange)) {
                                if (particle.energy > neighbour.energy) {
                                    particle.energy -= neighbour.energy / 2;
                                    neighbour.init(particleType.CORPSE);
                                    console.log(`FIGHT ${particle.team} killed ${neighbour.team}`)
                                } else {
                                    neighbour.energy -= particle.energy / 2;
                                    particle.init(particleType.CORPSE);
                                    console.log(`FIGHT ${neighbour.team} killed ${particle.team}`)
                                }
                            }
                        }

                        // If we have more than max energy produce offspring
                        if (particle.energy >= particle.maxEnergy) {
                            particle.energy -= particle.offSpringCost;
                            let newParticle = this.spawn(particle.type); // TODO parent traits
                            newParticle.assignParent(particle);
                        }
                        particle.energy = Math.min(particle.maxEnergy, particle.energy);
                    }
                    this.doMovement(particle, dt);
                    particle.energy -= dt * particle.speed; // movement costs energy
                    if (particle.energy <= 0) {
                        particle.init(particleType.CORPSE);
                    }
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

        assignParent(parent) {
            this.team = parent.team;
            this.color = parent.color;
            this.x = parent.x;
            this.y = parent.y;
        }

        init(type) {
            this.type = type;
            this.decisionTimeout = 0;
            this.size = 10;
            switch (this.type) {
                case particleType.FOOD:
                    // somewhat green
                    this.color = color.hsv2rgb(random(90, 130), random(.6,1), 1);
                    this.decisionDuration = 10;
                    this.foodValue = 100;
                    break;
                case particleType.ANIMATE:
                    this.speed = 50;
                    this.decisionDuration = 2;
                    this.sightRange = 50;
                    this.feedingRange = 5 + this.size;
                    this.energy = 500;
                    this.offSpringCost = 200;
                    this.maxEnergy = 600;
                    this.color = color.blue;
                    break;
                case particleType.DEAD_FOOD:
                    this.decisionDuration = 4 + random(1, 5) + random(1, 5);
                    this.decisionTimeout = this.decisionDuration;
                    this.color = color.hsv2rgb(random(25 , 45), random(.6,1), 0.2);
                    break;
                case particleType.CORPSE:
                    this.decisionDuration = 15 + random(5, 20);
                    this.decisionTimeout = this.decisionDuration;
                    this.color = color.hsv2rgb(random(-20 , +20), random(.8,1), 0.7);
                    this.foodValue = 20;
                    break;
                default:
                    this.color = color.magenta;
            }
        }
    }

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    gl.getExtension('OES_standard_derivatives');
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



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
            for (let i = 0; i < 500; ++i) {
                randomizeAndPlace(sim.spawn(particleType.FOOD));
            }

            let team2 = sim.spawn(particleType.ANIMATE);
            team2.team = 2;
            team2.color = color.hsv2rgb(60, 1, 1);
            randomizeAndPlace(team2);
            let team3 = sim.spawn(particleType.ANIMATE);
            team3.team = 3;
            team3.color = color.hsv2rgb(30,1,1);
            randomizeAndPlace(team3);
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

