// Particle Types
const particleType = {
    FOOD: "FOOD",
    DEAD_FOOD: "DEAD_FOOD",
    CORPSE: "CORPSE",
    CELL: "CELL",
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

        play() {
            this.simulationSpeedMulti = 1;
            this.simulationTicksToRun = -1;
        }

        pause() {
            this.simulationSpeedMulti = 0;
            this.simulationTicksToRun = 0;
        }

        tick(ticks) {
            this.simulationTicksToRun += ticks;
        }

        createParticle() {
            return new GameParticle(this.particleCounter++);
        }

        clickedAt(screenX, screenY) {
            console.debug("clicked at", screenX, ",", screenY, "on canvas");
            let [x, y,] = this.browserPositionToWorld(screenX, screenY);
            if (Math.abs(x) > this.spaceDimension / 2 || Math.abs(y) > this.spaceDimension / 2) {
                console.debug("clicked outside of world");
                return;
            }
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

        makeDecision(particle, visibleNeighbours, dt) {
            switch (particle.type) {
                case particleType.FOOD:
                    particle.size = particle.size + 0.5;
                    particle.foodValue += 10;
                    if (particle.size > 20) {
                        particle.size = 20; // max size do smth. as a plant?
                    }
                    break;
                case particleType.DEAD_FOOD:
                    this.regrow(particle);
                    break;
                case particleType.CORPSE:
                    this.kill(particle);
                    break;
                case particleType.CELL:
                    let ctx = {
                        sim: this,
                        particle: particle,
                        visibleNeighbours: visibleNeighbours,
                        dt: dt
                    };
                    if (!particle.currentBehaviour) {
                        particle.currentBehaviour = complex_behavior.superBehavior().repeat();
                        particle.currentBehaviour.restart(ctx);
                    } else {
                        if (particle.currentBehaviour.isRunning()) {
                            particle.currentBehaviour.continue(ctx);
                        } else {
                            particle.currentBehaviour.restart(ctx);
                        }
                    }
                    break;

                    // if (!particle.currentBehaviour || particle.currentBehaviour.onContinue({sim: this, particle: particle, visibleNeighbours: visibleNeighbours, dt: dt})) {
                    //     let newBehaviour = chooseRandomWeighted(particle.behaviorWeights, behaviours);
                    //     particle.currentBehaviour = newBehaviour;
                    //     newBehaviour.onStart({sim: this, particle: particle, visibleNeighbours: visibleNeighbours, dt: dt}); // TODO result?
                    // }
                    // break;
            }
        }

        die(particle) {
            if (particle.type === particleType.CELL) {
                this.tracker.addDeath(particle);
                this.initWithType(particle, particleType.CORPSE);
            } else if (particle.type === particleType.FOOD) {
                this.initWithType(particle, particleType.DEAD_FOOD); // eat food
            }
        }

        regrow(particle) {
            if (particle.type === particleType.DEAD_FOOD) {
                this.initWithType(particle, particleType.FOOD)
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
                    particle.decisionDuration = 0.2;
                    particle.sightRange = 300;
                    particle.energy = 500;
                    particle.offSpringCost = 200;
                    particle.maxEnergy = 600;
                    particle.color = color.blue;
                    particle.behaviorWeights = behavioursDefaultWeights;
                    break;
                case particleType.DEAD_FOOD:
                    particle.decisionDuration = 4 + random(1, 5) + random(1, 5);
                    particle.decisionTimeout = particle.decisionDuration;
                    particle.color = color.hsv2rgb(random(25 , 45), random(.6,1), 0.2);
                    break;
                case particleType.CORPSE:
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
                    this.doMovement(particle, visibleNeighbours, dt);
                    particle.energy -= dt * particle.speed; // movement costs energy
                    if (particle.energy <= 0) {
                        this.die(particle);
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
            // console.log(newParticle.behaviorWeights.map(v => Math.round(v * 100)))
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
        document.querySelectorAll("#panel-gene-selection li").forEach(e => e.addEventListener("click", e => {
           let geneType = e.target.dataset["gene"];
           console.log("You clicked", geneType);
           // TODO actually do smth in game
           e.target.classList.toggle("active");
        }));

        let pauseButton = document.querySelector("#pause");
        let playButton = document.querySelector("#play");
        let tickButton = document.querySelector("#tick");
        let warpButton = document.querySelector("#warp");
        let treeButton = document.querySelector("#tree");

        let simWrapper = document.querySelector("#sim-wrapper");
        let treeWrapper = document.querySelector("#tree-wrapper");
        let treePanelBackplane = document.querySelector("#tree-panel-backplane");

        playButton.addEventListener("click", e => {
            if (!playButton.classList.contains("active")) {
                pauseButton.classList.toggle("active");
                playButton.classList.toggle("active");
                tickButton.classList.toggle("inactive");
                warpButton.classList.toggle("inactive");
                treeButton.classList.toggle("inactive");

                treeWrapper.classList.add("hidden");
                simWrapper.classList.remove("hidden");
                treeButton.classList.remove("active");

                sim.play();
            }
        });
        pauseButton.addEventListener("click", e => {
            if (!pauseButton.classList.contains("active")) {
                treeButton.classList.toggle("inactive");
                pauseButton.classList.toggle("active");
                playButton.classList.toggle("active");
                tickButton.classList.toggle("inactive");
                warpButton.classList.toggle("inactive");
                warpButton.classList.remove("active"); // warp stops when pausing
                sim.pause();
            }
        });

        tickButton.addEventListener("click", e => {
            if (!tickButton.classList.contains("inactive")) {
                tickButton.classList.add("active");
                treeWrapper.classList.add("hidden");
                simWrapper.classList.remove("hidden");
                treeButton.classList.remove("active");

                sim.tick(10);
                setTimeout(() => {
                    tickButton.classList.remove("active");
                }, 100);

            }
        });
        warpButton.addEventListener("click", e => {
            if (!warpButton.classList.contains("inactive")) {
                warpButton.classList.toggle("active");
                if (warpButton.classList.contains("active")) {
                    sim.simulationSpeedMulti = 5;
                } else {
                    sim.simulationSpeedMulti = 1;
                }
            }
        });

        let treeDef = [{icon: "fa-asterisk", nodeType: "node-root", children: [
                {icon: "fa-snowflake-o", nodeType: "node-leaf"},
                {icon: "fa-ellipsis-h", nodeType: "node-seq node-hoverable", spacer: "fa-arrow-right", children: [
                        {icon: "fa-random", nodeType: "node-leaf"},
                        {icon: "fa-ellipsis-h", nodeType: "node-seq node-hoverable", spacer: "fa-arrow-right", children: [
                                {icon: "fa-question", nodeType: "node-rand", spacer: "fa-question", children: [
                                        {icon: "fa-times", nodeType: "node-exc node-hoverable", spacer: "fa-times", children: [
                                                {icon: "fa-random", nodeType: "node-leaf"},
                                                {icon: "fa-cutlery", nodeType: "node-leaf"},
                                                {icon: "fa-cutlery", nodeType: "node-leaf"},
                                            ]},
                                        {icon: "fa-cutlery", nodeType: "node-leaf"},
                                        {icon: "fa-exclamation", nodeType: "node-decorator node-hoverable", children: [
                                                {icon: "fa-cutlery", nodeType: "node-leaf"},
                                            ]},
                                        {icon: "fa-exclamation", nodeType: "node-decorator node-hoverable", children: [

                                            ]},
                                    ]},
                                {icon: "fa-cutlery", nodeType: "node-leaf"},
                            ]},
                    ]},
                {icon: "fa-cutlery", nodeType: "node-leaf"},
                {icon: "fa-ellipsis-h", nodeType: "node-seq node-hoverable", spacer: "fa-arrow-right", children: [
                        {icon: "fa-random", nodeType: "node-leaf"},
                        {icon: "fa-snowflake-o", nodeType: "node-leaf"},
                    ]},

            ]}];

        treeButton.addEventListener("click", e => {
            pauseButton.click(); // TODO remove me only for develop
            if (!treeButton.classList.contains("inactive")) {
                treeButton.classList.toggle("active");
                treeWrapper.classList.toggle("hidden");
                simWrapper.classList.toggle("hidden");
                if (treeButton.classList.contains("active")) {

                    treePanelBackplane.innerHTML = buildTree(treeDef);
                    let hoverAddNodes =  document.querySelectorAll("#tree-panel .node.node-hoverable");
                    hoverAddNodes.forEach(el => el.addEventListener("mouseover", e => {
                        e.stopPropagation();
                        el.classList.add("hovered")
                    }));
                    hoverAddNodes.forEach(el => el.addEventListener("mouseout", e => {
                        e.stopPropagation();
                        el.classList.remove("hovered");
                    }));
                    let rootNode = treePanelBackplane.querySelector(".node.node-root");


                    let centerMe = treePanelBackplane.querySelector("#tree-panel-backplane > .node-children");
                    let offsetLeft = (treePanelBackplane.clientWidth - centerMe.clientWidth) /2;
                    centerMe.style.left = offsetLeft +"px";
                    let offsetTop = (treePanelBackplane.clientHeight - centerMe.clientHeight) / 2;
                    centerMe.style.top = offsetTop +"px";

                    let overFlowX = Math.max(0, rootNode.clientWidth - treeWrapper.clientWidth);
                    let overFlowY = rootNode.clientHeight - treeWrapper.clientHeight;

                    treePanelBackplane.style.left = -offsetLeft - overFlowX / 2 +"px";
                    treePanelBackplane.style.top = -offsetTop- overFlowY / 2 +"px";


                    // Show Tree
                } else {
                    // Hide Tree
                }
            }
        });

        let isDown = false;
        treePanelBackplane.addEventListener("mousedown", e => {
            isDown = true;
        });
        treePanelBackplane.addEventListener("mouseup", e => {
            isDown = false;
        });
        treePanelBackplane.addEventListener("mouseleave", e => {
            isDown = false;
        });
        treePanelBackplane.addEventListener("mousemove", e => {
            e.preventDefault();
            if (isDown) {
                let newLeft = parseFloat(treePanelBackplane.style.left) + e.movementX;
                let newTop = parseFloat(treePanelBackplane.style.top) + e.movementY;
                treePanelBackplane.style.left = Math.min(0, newLeft) + "px";
                treePanelBackplane.style.top = Math.min(0, newTop) + "px";
            }
        });

        const halfWidth = (canvas.width / 2);
        const halfHeight = (canvas.height / 2);

        function randomizeAndPlace(particle) {
            particle.x = (gaussianRand() * 2 - 1) * halfWidth;
            particle.y = (gaussianRand() * 2 - 1) * halfHeight;
        }

        function buildTree(nodeDefs, spacer) {
            if (!nodeDefs) {
                return "";
            }
            let nodeString = `<div class="node-children">`;
            for (let nodeDef of nodeDefs) {
                nodeString += `<span class="node ${nodeDef.nodeType}">
                                    <div>
                                       <span class="fa ${nodeDef.icon}"></span>
                                       ${buildTree(nodeDef.children, nodeDef.spacer)} 
                                    </div>
                               </span>`;
                nodeString += `<span class="node-spacer">
                                   <span class="fa ${spacer}"></span>
                               </span>`;
            }
            nodeString += `<span class="node node-pseudo node-leaf">
                              <div>
                                 <span class="fa fa-plus"></span>
                              </div>
                           </span>`;
            nodeString += "<div class='clear-float'></div>";
            nodeString += "</div>";
            return nodeString;
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

