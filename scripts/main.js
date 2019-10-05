// Particle Types
const particleType = {
    FOOD: "FOOD",
    DEAD_FOOD: "DEAD_FOOD",
    CORPSE: "CORPSE",
    CELL: "CELL",
};

const movementType = {
    FREEZE: new MovementFreeze(),
    RANDOM_WALK: new MovementRandomWalk(),
    SEEK_FOOD: new MovementSeekFood(),
};

(function () {

    class Tracker {
        constructor() {
            this.liveCount = [0,0,0];
            this.deaths = [0,0,0];
        }

        addDeath(particle) {
            this.deaths[particle.team]++;
            this.liveCount[particle.team]--;

            this.updateTrackerPanel();
        }

        addLive(particle) {
            this.liveCount[particle.team]++;

            this.updateTrackerPanel();
        }

        updateTrackerPanel() {
            let liveCountPanel = document.getElementById("panel-info-live-count");
            liveCountPanel.innerHTML = `<div>Team 1 <span>${this.liveCount[0]}</span></div>
                                        <div>Team 2 <span>${this.liveCount[1]}</span></div>
                                        <div>Team 3 <span>${this.liveCount[2]}</span></div>`;
            let deathCountPanel = document.getElementById("panel-info-death-count");
            deathCountPanel.innerHTML = `<div>Team 1 <span>${this.deaths[0]}</span></div>
                                         <div>Team 2 <span>${this.deaths[1]}</span></div>
                                         <div>Team 3 <span>${this.deaths[2]}</span></div>`;
        }

    }

    class GameSimulation extends Simulation {

        constructor(canvas, gl, shader) {
            super(canvas, gl, shader);
            this.tracker = new Tracker();
            this.particleCounter = 0;
        }

        createParticle() {
            return new GameParticle(this.particleCounter++);
        }

        clickedAt(screenX, screenY) {
            console.debug("clicked at", screenX, ",", screenY, "on canvas");
            let [x, y,] = this.browserPositionToWorld(screenX, screenY);
            console.debug("clicked at", x, ",", y, "in world");
            if (this.canSpawn()) {
                let particle = this.spawn(particleType.CELL);
                particle.team = 0;
                this.tracker.addLive(particle);
                particle.x = x;
                particle.y = y;
            }
        }

        makeDecision(particle, visibleNeighbours) {
            switch (particle.type) {
                case particleType.FOOD:
                    particle.size = particle.size + 0.5;
                    particle.foodValue += 10;
                    if (particle.size > 20) {
                        particle.size = 20; // max size do smth. as a plant?
                    }
                    break;
                case particleType.DEAD_FOOD:
                    this.initWithType(particle, particleType.FOOD);
                    break;
                case particleType.CORPSE:
                    this.kill(particle);
                    break;
                case particleType.CELL:
                    particle.movementType.calculate(particle, visibleNeighbours);
                    break;
            }
        }

        init(particle) {
            particle.decisionTimeout = 0;
            particle.sightRange = 0;
            switch (particle.type) {
                case particleType.FOOD:
                    // somewhat green
                    particle.size = 10;
                    particle.color = color.hsv2rgb(random(90, 130), random(.6,1), 1);
                    particle.decisionDuration = random(2,8);
                    particle.decisionTimeout = particle.decisionDuration;
                    particle.foodValue = 100;
                    break;
                case particleType.CELL:
                    particle.size = 15;
                    particle.speed = 50;
                    particle.decisionDuration = 2;
                    particle.sightRange = 300;
                    particle.energy = 500;
                    particle.offSpringCost = 200;
                    particle.maxEnergy = 600;
                    particle.color = color.blue;
                    particle.movementType = movementType.SEEK_FOOD;
                    // particle.movementType = movementType.RANDOM_WALK;
                    break;
                case particleType.DEAD_FOOD:
                    particle.decisionDuration = 4 + random(1, 5) + random(1, 5);
                    particle.decisionTimeout = particle.decisionDuration;
                    particle.color = color.hsv2rgb(random(25 , 45), random(.6,1), 0.2);
                    break;
                case particleType.CORPSE:
                    this.tracker.addDeath(particle);
                    particle.decisionDuration = 15 + random(5, 20);
                    particle.decisionTimeout = particle.decisionDuration;
                    particle.color = color.hsv2rgb(random(-20 , +20), random(.8,1), 0.7);
                    particle.foodValue = Math.max(20, particle.maxEnergy / 2);
                    break;
                default:
                    particle.size = 10;
                    particle.color = color.magenta;
            }
        }

        doAction(particle, visibleNeighbours, dt) {
            switch (particle.type) {
                case particleType.DEAD_FOOD:
                    // ?
                    break;
                case particleType.CELL:
                    if (particle.type === particleType.CELL) {
                        for (let [neighbour, distance] of visibleNeighbours) {
                            if (neighbour.alive && (neighbour.type === particleType.FOOD || neighbour.type === particleType.CORPSE) && distance <= sqr(neighbour.size) + sqr(particle.size)) {
                                if (neighbour.type === particleType.FOOD) {
                                    this.initWithType(neighbour, particleType.DEAD_FOOD); // eat food
                                }
                                if (neighbour.type === particleType.CORPSE) {
                                    this.kill(neighbour); // eat corpse
                                }
                                particle.energy += neighbour.foodValue;
                                particle.size += 1;
                                particle.maxEnergy += 1;
                            }

                            if (neighbour.type === particleType.CELL && particle.team !== neighbour.team && distance <= sqr(neighbour.size) + sqr(particle.size)) {
                                if (particle.energy > neighbour.energy) {
                                    particle.energy -= neighbour.energy / 2;
                                    this.initWithType(neighbour, particleType.CORPSE);
                                    console.log(`FIGHT ${particle.id}(${particle.team}) killed ${neighbour.id}(${neighbour.team})`)
                                } else {
                                    neighbour.energy -= particle.energy / 2;
                                    this.initWithType(particle, particleType.CORPSE);
                                    console.log(`FIGHT ${neighbour.id}(${neighbour.team}) killed ${particle.id}(${particle.team})`)
                                    return;
                                }
                            }
                        }

                        // If we have more than max energy produce offspring
                        if (particle.energy >= particle.maxEnergy) {
                           this.split(particle);
                        }
                        particle.energy = Math.min(particle.maxEnergy, particle.energy);
                    }
                    this.doMovement(particle, dt);
                    particle.energy -= dt * particle.speed; // movement costs energy
                    if (particle.energy <= 0) {
                        this.initWithType(particle, particleType.CORPSE);
                    }
                    break;
                case particleType.FOOD:
                    // ?
                    break;
            }
        }

        split(particle) {
            particle.energy -= particle.offSpringCost;

            let newParticle = this.spawn(particle.type);
            console.log(`${particle.id}(${particle.team}) splits into ${newParticle.id}... prevteam: ${newParticle.team}`);

            newParticle.team = particle.team;
            this.tracker.addLive(newParticle);

            newParticle.color = particle.color;
            newParticle.x = particle.x;
            newParticle.y = particle.y;

            let halfSize = Math.max(newParticle.size, particle.size / 2);
            newParticle.size = halfSize;
            particle.size = halfSize;
            newParticle.energy = particle.energy / 2;
            particle.energy = particle.energy / 2;
        }


    }

    class GameParticle extends Particle {
        constructor(id) {
            super();
            this.id = id;
        }


    }

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    gl.getExtension('OES_standard_derivatives');
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



    let shaders = [
        loadShader(gl, "scripts/shader/particle", ["vertexPosition", "color", "size"], ["projectionMatrix", "viewMatrix", "modelMatrix"])
    ];

    Promise.all(shaders).then(loadedShaders => {
        runGame(canvas, gl, loadedShaders);
    }, err => {
        console.log("Error!", err)
    });

    function runGame(canvas, gl, [particleShader]) {
        let sim = new GameSimulation(canvas, gl, particleShader);
        GAME_SIMULATION = sim;
        window.addEventListener('mousemove', e => {
            let [x, y] = clickToElement(e, canvas);
            sim.mouseX = x;
            sim.mouseY = y;
            sim.mouseReachable = true;
        });
        window.addEventListener('mouseout', () => {
            sim.mouseReachable = false;
        });
        canvas.addEventListener('click', e => {
            let [x, y] = clickToElement(e, canvas);
            sim.clickedAt(x, y);
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

            let team2 = sim.spawn(particleType.CELL);
            team2.team = 1;
            team2.color = color.hsv2rgb(60, 1, 1);
            sim.tracker.addLive(team2);
            randomizeAndPlace(team2);
            let team3 = sim.spawn(particleType.CELL);
            team3.team = 2;
            team3.color = color.hsv2rgb(30,1,1);
            sim.tracker.addLive(team3);
            randomizeAndPlace(team3);

            onFinish()
        }

        setupWorld(() => {
            renderLoop(window, 0, dt => {
                sim.update(dt);
                sim.render();
            });
            setTimeout(() => canvas.classList.add("loaded"), 1000);
        });
    }

})();

