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
    HUNT_WEAK: new HuntWeak(),
};

class Species {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
    }
}

(function () {

    class Tracker {
        constructor(canvas, species) {
            this.chart = new SmoothieChart({interpolation: 'bezier', minValue: 0, labels: {disabled: false}, tooltip: true, responsive: true});
            this.chart.streamTo(canvas);
            this.speciesState = new Map();
            for (let aSpecies of species) {
                let state = {
                    species: aSpecies,
                    liveCount: 0,
                    deaths: 0,
                    series: new TimeSeries(),
                };
                this.speciesState.set(aSpecies.id, state);
                let seriesConf = {
                    strokeStyle: color.vec2css(aSpecies.color),
                    tooltipLabel: aSpecies.name,
                };
                this.chart.addTimeSeries(state.series, seriesConf);
            }
        }

        addDeath(particle) {
            let state = this.speciesState.get(particle.team);
            state.deaths++;
            state.liveCount--;
        }

        addLive(particle) {
            let state = this.speciesState.get(particle.team);
            state.liveCount++;
        }

        updateTrackerPanel() {
            let now = Date.now();
            this.speciesState.forEach((state, id) => {
                state.series.append(now, state.liveCount);
            });
        }

    }

    class GameSimulation extends Simulation {

        constructor(canvas, trackerCanvas, gl, shader) {
            super(canvas, gl, shader);
            this.playerSpecies = new Species(0, "Player", color.blue);
            this.species = [
                this.playerSpecies,
                new Species(1, "Enemey 1", color.hsv2rgb(60, 1, 1)),
                new Species(2, "Enemey 2", color.hsv2rgb(30, 1, 1)),
            ];
            this.tracker = new Tracker(trackerCanvas, this.species);
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
                particle.team = this.playerSpecies.id;
                particle.color = this.playerSpecies.color;
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
                    if (particle.currentBehaviour) {
                        // Is the behaviour still valid?
                        if (particle.currentBehaviour.canExecute(particle, visibleNeighbours)) {
                            if (particle.currentBehaviour.keepExecuting(particle, visibleNeighbours)) {
                                particle.currentBehaviour.calculate(particle, visibleNeighbours);
                                break;
                            }
                        }
                    }
                    let newBehaviour = chooseRandomWeighted(particle.behaviorWeights, particle.behaviors);
                    particle.currentBehaviour = newBehaviour;
                    newBehaviour.calculate(particle, visibleNeighbours);
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
                    particle.behaviors = [movementType.RANDOM_WALK, movementType.SEEK_FOOD, movementType.FREEZE, movementType.HUNT_WEAK];
                    particle.behaviorWeights = [5,5,1,1];
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
                                    particle.energy -= neighbour.energy / 3;
                                    this.initWithType(neighbour, particleType.CORPSE);
                                    // console.log(`FIGHT ${particle.id}(${particle.team}) killed ${neighbour.id}(${neighbour.team})`)
                                } else {
                                    neighbour.energy -= particle.energy / 3;
                                    this.initWithType(particle, particleType.CORPSE);
                                    // console.log(`FIGHT ${neighbour.id}(${neighbour.team}) killed ${particle.id}(${particle.team})`);
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
                    this.doMovement(particle, visibleNeighbours, dt);
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


        update(dt) {
            super.update(dt);
            this.tracker.updateTrackerPanel();
        }

        split(particle) {
            particle.energy -= particle.offSpringCost;

            let newParticle = this.spawn(particle.type);
            // console.log(`${particle.id}(${particle.team}) splits into ${newParticle.id}... prevteam: ${newParticle.team}`);

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

            // MUTATION
            newParticle.behaviorWeights = particle.behaviorWeights.map(weight =>
                Math.min(1000, Math.max(0, weight + random(-0.05, 0.05))))
        }
    }

    class GameParticle extends Particle {
        constructor(id) {
            super();
            this.id = id;
        }
    }


    let canvas = document.querySelector("canvas#simulation");
    let gl = canvas.getContext("webgl");
    gl.getExtension('OES_standard_derivatives');
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



    let shaders = [
        loadShader(gl, "scripts/shader/particle", ["vertexPosition", "color", "size"], ["projectionMatrix", "viewMatrix", "modelMatrix", "scale"])
    ];

    Promise.all(shaders).then(loadedShaders => {
        runGame(canvas, gl, loadedShaders);
    }, err => {
        console.error("Error!", err)
    });

    function runGame(canvas, gl, [particleShader]) {
        let cellTrackerCanvas = document.querySelector("canvas#cell-tracker");
        let sim = new GameSimulation(canvas, cellTrackerCanvas, gl, particleShader);
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
            generateFood();

            sim.species.forEach(species => {
                if (species !== sim.playerSpecies) {
                    let first = sim.spawn(particleType.CELL);
                    first.team = species.id;
                    first.color = species.color;
                    sim.tracker.addLive(first);
                    randomizeAndPlace(first);
                }
            });

            onFinish();
        }

        function generateFood() {
            const gridRes = 70;
            let [startX, startY, ] = sim.topLeftCorner;
            let [lengthX, lengthY, ] = vec.distance(sim.topLeftCorner, sim.bottomRightCorner);
            let stepX = lengthX / gridRes;
            let stepY = lengthY / gridRes;

            let noise = openSimplexNoise(Date.now());

            const gradients = [[1, 128], [1.5, 32]];
            const threshold = 0.4;

            for (let yc = 0; yc < gridRes; ++yc) {
                for (let xc = 0; xc < gridRes; ++xc) {
                    let x = (startX + stepX * xc) + (stepX / 2);
                    let y = (startY + stepY * yc) + (stepY / 2);
                    let v = 0;
                    for (let [a, f] of gradients) {
                        v += noise.noise2D(x / f, y / f) * a;
                    }
                    v /= gradients.length;

                    if (v > threshold) {
                        let particle = sim.spawn(particleType.FOOD);

                        let offX = random(-1, 1) * stepX / 2;
                        let offY = random(-1, 1) * stepY / 2;
                        particle.x = x + offX;
                        particle.y = y + offY;
                    }
                }
            }

            console.log(lengthX, lengthY, stepX, stepY);
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

