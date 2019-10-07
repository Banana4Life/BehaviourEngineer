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
        chart;
        speciesState;

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

        tracker;
        particleCounter;
        behaviorFactory;

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

            this.behaviorFactory = () => {
                throw new Error("Behavior tree factory not initialized!");
            };
        }

        play() {
            this.simulationSpeedMulti = 1;
            this.simulationTicksToRun = -1;

            this.updateBehaviorTreeFactory(this.treeDef);
        }

        pause() {
            this.simulationSpeedMulti = 0;
            this.simulationTicksToRun = 0;
        }

        tick(ticks) {
            this.simulationTicksToRun += ticks;

            this.updateBehaviorTreeFactory(this.treeDef);
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
            let noPlayerAlive = this.tracker.speciesState.get(this.playerSpecies.id).liveCount <= 0;
            if (this.canSpawn() && noPlayerAlive) {

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
                        particle.currentBehaviour = this.generateBehaviorTree(particle);
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

        updateBehaviorTreeFactory(tree) {

            function traverse(children) {
                if (!children || children.length === 0) {
                    return () => [];
                }
                if (!Array.isArray(children)) {
                    children = [children];
                }

                let subtreeFactories = [];
                for (let child of children) {
                    subtreeFactories.push(buildSubtree(child));
                }

                let childrenFactory = () => {
                    let subtrees = [];
                    for (let subtreeFactory of subtreeFactories) {
                        subtrees.push(subtreeFactory());
                    }
                    return subtrees;
                };
                return childrenFactory;
            }

            function buildSubtree(node) {
                let childrenFactory = traverse(node.children);
                let subtreeFactory = () => node.ctr(childrenFactory());
                return subtreeFactory;
            }

            function buildFactory(root) {
                if (Array.isArray(root)) {
                    if (root.length === 1) {
                        return buildSubtree(root[0]);
                    } else {
                        let multiRootFactory = traverse(root);
                        return () => new ParallelBranch(multiRootFactory()).repeat();
                    }
                } else {
                    return buildSubtree(root);
                }

            }

            this.behaviorFactory = buildFactory(tree);

        }

        generateBehaviorTree(particle) {
            if (particle.team === 0) {
                return this.behaviorFactory(particle);
            } else {
                return complex_behavior.superBehavior().repeat();
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
        // expose the simulation for debugging
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

        let pauseButton = document.querySelector("#pause");
        let playButton = document.querySelector("#play");
        let tickButton = document.querySelector("#tick");
        let warpButton = document.querySelector("#warp");
        let treeButton = document.querySelector("#tree");
        let restartButton = document.querySelector("#restart");

        let simWrapper = document.querySelector("#sim-wrapper");
        let treeWrapper = document.querySelector("#tree-wrapper");
        let treePanelBackplane = document.querySelector("#tree-panel-backplane");

        let trackerGraph = document.querySelector("#panel-cell-tracker");

        let geneList = document.querySelector("#panel-gene-selection ul");

        let geneInfo = document.querySelector("#panel-gene-info");
        let newNode = document.querySelector("#new-node");

        function playButtonClicked() {
            if (!playButton.classList.contains("active")) {
                pauseButton.classList.toggle("active");
                playButton.classList.toggle("active");
                tickButton.classList.toggle("inactive");
                warpButton.classList.toggle("inactive");
                treeButton.classList.toggle("inactive");

                treeWrapper.classList.add("hidden");
                simWrapper.classList.remove("hidden");
                treeButton.classList.remove("active");
                trackerGraph.classList.remove("hidden");

                sim.play();
            }
        }

        function pauseButtonClicked() {
            if (!pauseButton.classList.contains("active")) {
                treeButton.classList.toggle("inactive");
                pauseButton.classList.toggle("active");
                playButton.classList.toggle("active");
                tickButton.classList.toggle("inactive");
                warpButton.classList.toggle("inactive");
                warpButton.classList.remove("active"); // warp stops when pausing
                sim.pause();
            }
        }

        playButton.addEventListener("click", playButtonClicked);
        pauseButton.addEventListener("click", pauseButtonClicked);

        tickButton.addEventListener("click", e => {
            if (!tickButton.classList.contains("inactive")) {
                tickButton.classList.add("active");
                treeWrapper.classList.add("hidden");
                simWrapper.classList.remove("hidden");
                treeButton.classList.remove("active");
                trackerGraph.classList.remove("hidden");
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

        restartButton.addEventListener("click", e => {
            sim.reset();
        });

        const nodes = {
            FREEZE: {
                icon: "fas fa-snowflake", nodeType: "node-leaf",
                name: "Freeze", desc: "Does nothing for half a second",
                ctr: () => new Freeze(0.5)
            },
            RANDOM_WALK: {
                icon: "fas fa-random", nodeType: "node-leaf",
                name: "Random Walk", desc: "Chooses a random direction to walk into for 1.5 seconds",
                ctr: () => new RandomWalk(1.5)
            },
            MOVE_TO_FOOD: {
                icon: "fas fa-binoculars", nodeType: "node-leaf",
                name: "Walk to Food", desc: "Chooses a nearby food source and walks to it",
                ctr: () => new MoveToFood()
            },
            HUNT_WEAK: {
                icon: "fas fa-bug", nodeType: "node-leaf",
                name: "Hunt Prey", desc: "",
                ctr: () => new HuntWeak()
            },
            SPLIT: {
                icon: "fas fa-unlink", nodeType: "node-leaf",
                name: "Split", desc: "Split into two Cells",
                ctr: () => new Split(0.5)
            },
            FIGHT: {
                icon: "far fa-hand-rock", nodeType: "node-leaf",
                name: "Fight", desc: "Fight and kill a weaker enemy",
                ctr: () => new Fight()
            },
            EAT: {
                icon: "fas fa-apple-alt", nodeType: "node-leaf",
                name: "Eat", desc: "Eat targeted food source",
                ctr: () => new Eat()
            },
            NOT: {
                icon: "fas fa-exclamation", nodeType: "node-decorator node-hoverable",
                name: "Not", desc: "Negates the child node",
                ctr: (children) => new BehaviorInverter(children[0]),
                children: []
            },
            SEQ: {
                icon: "fas fa-ellipsis-h", nodeType: "node-seq node-hoverable", spacer: "fa-arrow-right",
                name: "Sequence", desc: "Executes all child nodes until one fails",
                ctr: (children) => new SequenceBranch(children),
                children: []
            },
            PARALLEL: {
                icon: "fas fa-bars", nodeType: "node-parallel node-hoverable", spacer: "fa-arrow-right",
                name: "Parallel", desc: "Executes all child nodes in parallel",
                ctr: (children) => new ParallelBranch(children),
                children: []
            },
            PERCEPTION: {
                icon: "fas fa-eye", nodeType: "node-leaf",
                name: "Radial Perception", desc: "Perceives other particles in the area",
                ctr: (children) => new PerceptionRadial(20),
                children: []
            },
            SEE_FOOD: {
                icon: "fab fa-pagelines", nodeType: "node-leaf",
                name: "Food Perception", desc: "Perceives food particles in the area",
                ctr: (children) => new SeeFood(),
                children: []
            },
            SELECTOR: {
                icon: "fas fa-check", nodeType: "node-selector node-hoverable", spacer: "fa-step-forward",
                name: "Selector", desc: "Executes all child nodes until one succeeds",
                ctr: (children) => new SelectorBranch(children),
                children: []
            },
            INTERRUPT: {
                icon: "fas fa-exclamation-triangle", nodeType: "node-2-decorator node-hoverable", spacer: "fa-step-backward",
                name: "Interrupt", desc: "Interrupts the first node if the first fails",
                ctr: (children) => new BehaviorInterrupter(children[0], children[1]),
                children: []
            },
            REPEAT: {
                icon: "fas fa-redo", nodeType: "node-decorator node-hoverable",
                name: "Repeat", desc: "Repeat a node for ever",
                ctr: (children) => new RepeatingBehavior(children[0]),
                children: []
            }

        };

        let ROOT = {
                icon: "fas fa-asterisk", nodeType: "node-root node-hoverable",
                name: "Root", desc: "Root",
                ctr: (children) => new ParallelBranch(children).repeat()
            };

        let nodeId = 0;
        function clone(node, children = []) {
            let cloned = {id: nodeId++, icon: node.icon, nodeType: node.nodeType, ctr: node.ctr, spacer: node.spacer, children: children};
            treeDefMap[cloned.id] = cloned;
            return cloned
        }

        let treeDefMap = {};
        let treeDef = [clone(ROOT, [
            clone(nodes.REPEAT, [clone(nodes.PERCEPTION)]),
            clone(nodes.REPEAT, [clone(nodes.SELECTOR, [
                clone(nodes.SEQ, [
                    clone(nodes.SEE_FOOD),
                    clone(nodes.MOVE_TO_FOOD),
                    clone(nodes.EAT),
                    clone(nodes.SPLIT)
                ]),
                clone(nodes.INTERRUPT, [clone(nodes.RANDOM_WALK),
                                       clone(nodes.NOT,[clone(nodes.SEE_FOOD)])])
            ])])
        ])];
        treeDef =  [clone(ROOT, [])];
        console.log(treeDef);
        let isPickup = false;
        let pickupNode;

        function rebuildTree() {
            treePanelBackplane.innerHTML = buildTree(treeDef[0], treeDef);
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

            let allNodesToClick =  document.querySelectorAll("#tree-panel .node .node-parent > div");

            allNodesToClick.forEach(el => el.addEventListener("mousedown", e => {
                let closestNode = el.closest(".node");
                let closestHoverable = closestNode.parentElement.closest(".node-hoverable")
                let id = closestNode.dataset["nodeId"];
                let hovId = closestHoverable.dataset["nodeId"];
                pickupNode = treeDefMap[id];
                isPickup = true;

                newNode.classList.remove("hidden");
                newNode.style.left = (e.x-30) + "px";
                newNode.style.top = (e.y-30) + "px";
                newNode.innerHTML = `<div data-node="#NODE#${id}">
                                    <span class="fas fa-code-branch fa-flip-vertical"></span>
                                </div>`;
                removeFromTree(hovId, id);
                el.style.backgroundColor = "red";
            }));

            document.addEventListener("mousemove", e => {
                e.preventDefault();
                if (isPickup) {
                    newNode.style.left = (e.x-30) + "px";
                    newNode.style.top = (e.y-30) + "px";
                }
            });

            document.addEventListener("mouseup", e => {
                newNode.classList.add("hidden");
                dropOn(e.target);
                isPickup = false;
            });


            let centerMe = treePanelBackplane.querySelector("#tree-panel-backplane > .node-children");
            let offsetLeft = (treePanelBackplane.clientWidth - centerMe.clientWidth) /2;
            centerMe.style.left = offsetLeft +"px";
            let offsetTop = (treePanelBackplane.clientHeight - centerMe.clientHeight) / 2;
            centerMe.style.top = offsetTop +"px";

            let overFlowX = Math.max(0, rootNode.clientWidth - treeWrapper.clientWidth);
            let overFlowY = rootNode.clientHeight - treeWrapper.clientHeight;

            treePanelBackplane.style.left = -offsetLeft - overFlowX / 2 +"px";
            treePanelBackplane.style.top = -offsetTop- overFlowY / 2 +"px";
        }

        treeButton.addEventListener("click", e => {
            pauseButton.click(); // TODO remove me only for develop
            if (!treeButton.classList.contains("inactive")) {
                treeButton.classList.toggle("active");
                treeWrapper.classList.toggle("hidden");
                simWrapper.classList.toggle("hidden");
                trackerGraph.classList.toggle("hidden");
                if (treeButton.classList.contains("active")) {

                    rebuildTree();


                    // Show Tree
                } else {
                    // Hide Tree
                }
            }
        });

        let isDown = false;
        treePanelBackplane.addEventListener("mousedown", e => {
            if (e.target === treePanelBackplane) {
                isDown = true;
            }
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

        let geneHtml = "";
        for (let nodeKey of Object.keys(nodes)) {
            let node = nodes[nodeKey];
            geneHtml += `<li data-node="${nodeKey}">
                            <span class="${node.icon}"></span>
                         </li>`;
        }

        geneList.innerHTML = geneHtml;
        let newNodeGrabbed = false;
        let newNodeType = "";

        document.querySelectorAll("#panel-gene-selection li").forEach(el => el.addEventListener("mousedown", e => {
            let geneType = el.dataset["node"];
            let node = nodes[geneType];
            newNodeGrabbed = true;
            newNodeType = geneType;
            newNode.classList.remove("hidden");
            newNode.style.left = (e.x-30) + "px";
            newNode.style.top = (e.y-30) + "px";
            newNode.innerHTML = `<div data-node="${geneType}">
                                    <span class="${node.icon}"></span>
                                </div>`;
        }));
        document.addEventListener("mousemove", e => {
            if (newNodeGrabbed) {
                newNode.style.left = (e.x-30) + "px";
                newNode.style.top = (e.y-30) + "px";
            }
        });
        document.addEventListener("mouseup", e => {
            if (newNodeGrabbed) {
                newNode.classList.add("hidden");
                dropOn(e.target);
                newNodeGrabbed = false;
            }
        });

        function dropOn(target) {
            let newNode;
            if (isPickup) {
                newNode = pickupNode;
            } else if (newNodeGrabbed) {
                newNode = clone(nodes[newNodeType]);
            } else {
                return;
            }

            let closestSpacer = target.closest(".node-spacer");
            if (closestSpacer) {
                let insertBefore = closestSpacer.nextSibling.dataset["nodeId"];
                let closestHoverable = closestSpacer.nextSibling.parentElement.closest(".node-hoverable")
                addBefore(closestHoverable.dataset["nodeId"],insertBefore,newNode)
                return;
            }

            let closestNode = target.closest(".node");
            if (closestNode) {
                if (closestNode.classList.contains("node-pseudo")) {
                    let closestHoverable = closestNode.closest(".node-hoverable");
                    addToTree(closestHoverable.dataset["nodeId"], newNode);
                } else {
                    let closestHoverable = closestNode.parentElement.closest(".node-hoverable");
                    if (closestHoverable) {
                        replaceInTree(closestHoverable.dataset["nodeId"], closestNode.dataset["nodeId"], newNode);
                    }
                }
            }
        }

        document.querySelectorAll("#panel-gene-selection li").forEach(el => el.addEventListener("mousemove", e => {
            let geneType = el.dataset["node"];
            let node = nodes[geneType];
            geneInfo.innerHTML = `<b>${node.name}</b><br>${node.desc}`
        }));
        document.querySelectorAll("#panel-gene-selection li").forEach(el => el.addEventListener("mouseleave", e => {
            geneInfo.innerHTML = "";
        }));

        function addToTree(atNode, newNode) {
            console.log("Add ", atNode, " ", newNode);
            treeDefMap[atNode].children.push(newNode);
            rebuildTree();
        }

        function addBefore(atNode, beforeNode, newNode) {
            console.log("insert before", beforeNode, " in ", atNode, " ", newNode);
            let childrenList = treeDefMap[atNode].children;
            let idx = childrenList.indexOf(treeDefMap[beforeNode])
            childrenList.splice(idx, 0, newNode);
            rebuildTree();
        }

        function replaceInTree(atNode, replaceAt, newNode) {
            console.log("replace", replaceAt, " in ", atNode, " ", newNode);
            let childrenList = treeDefMap[atNode].children;
            let idx = childrenList.indexOf(treeDefMap[replaceAt]);
            childrenList[idx] = newNode;
            rebuildTree();
        }
        function removeFromTree(atNode, remove) {
            console.log("remove", remove, " in ", atNode);
            let childrenList = treeDefMap[atNode].children;
            let idx = childrenList.indexOf(treeDefMap[remove]);
            childrenList.splice(idx, 1);
            rebuildTree();
        }

        function buildTree(parentDef, nodeDefs, spacer) {
            if (!nodeDefs || (nodeDefs.length === 0 && nodeDefs.type === "node-leaf")) {
                return "";
            }
            let nodeString = `<div class="node-children">`;
            let spacer0 = "";
            for (let nodeDef of nodeDefs) {
                let noSpacer = parentDef.nodeType.indexOf("node-decorator") >= 0;
                if (!noSpacer) {
                    nodeString += `<span class="node-spacer">
                                   <span class="fas ${spacer0}">
                                      <span class="node-spacer-indicator fas fa-arrow-up"></span>
                                   </span>
                               </span>`;
                }
                nodeString += `<span class="node ${nodeDef.nodeType}" data-node-id="${nodeDef.id}">
                                    <div>
                                       <div class="node-parent"><div><span class="${nodeDef.icon}"></span></div></div>
                                       ${buildTree(nodeDef, nodeDef.children, nodeDef.spacer)} 
                                    </div>
                               </span>`;
                spacer0 = spacer;
            }
            let noPseudo = parentDef.nodeType === "node-leaf" ||
                (parentDef.nodeType.indexOf("node-decorator") >= 0 && nodeDefs.length === 1);
            if (!noPseudo) {
                if (nodeDefs.length > 0) {
                    nodeString += `<span class="node-spacer">
                                   <span class="fas ${spacer0}"></span>
                               </span>`;
                }
                nodeString += `<span class="node node-pseudo node-leaf">
                              <div>
                                <div class="node-parent">
                                    <div>
                                    
                                       <span class="fas fa-plus"></span>
                                    </div>
                                </div>
                              </div>
                           </span>`;
            }
            nodeString += "<div class='clear-float'></div>";
            nodeString += "</div>";
            return nodeString;
        }


        function setupWorld(sim, onFinish) {
            generateFood(sim);

            sim.species.forEach(species => {
                if (species !== sim.playerSpecies) {
                    let first = sim.spawn(particleType.CELL);
                    sim.placeRandomly(first);
                    first.team = species.id;
                    first.color = species.color;
                    sim.tracker.addLive(first);
                }
            });

            sim.treeDef = treeDef;
            sim.updateBehaviorTreeFactory(treeDef);

            onFinish();
        }

        function generateFood(sim) {
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

        setupWorld(sim, () => {
            renderLoop(window, 0, dt => {
                sim.update(dt);
                sim.render();
            });
            setTimeout(() => canvas.classList.add("loaded"), 1000);
        });
    }

})();

