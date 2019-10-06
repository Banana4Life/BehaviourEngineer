
const BehaviorResult = {
    Success: 1,
    Failure: 2,
    Running: 3,
};


class Behaviour {
    onStart(sim, particle, visibleNeighbours, dt) {
        if (this.canStart(particle, visibleNeighbours)) {
            return this.onStart0(sim, particle, visibleNeighbours, dt);
        }
        return BehaviorResult.Failure;
    }

    onContinue(sim, particle, visibleNeighbours, dt) {
        if (this.canContinue(particle, visibleNeighbours)) {
            return this.onContinue0(sim, particle, visibleNeighbours, dt);
        }
        return BehaviorResult.Failure;
    }

    onStart0(sim, particle, visibleNeighbours, dt) {
        return BehaviorResult.Failure;
    }

    onContinue0(sim, particle, visibleNeighbours, dt) {
        return this.onStart0(sim, particle, visibleNeighbours, dt);
    }

    canStart(particle, visibleNeighbours) {
        return true;
    }

    canContinue(particle, visibleNeighbours) {
        return false;
    }
}

class Fight extends Behaviour {
    onStart0(sim, particle, visibleNeighbours, dt) {
        for (let [enemy,] of visibleNeighbours.filter(([p, d]) => utils.isWeakEnemy(particle, d, p) && touches(particle, p, d))) {
            sim.initWithType(enemy, particleType.CORPSE);
            particle.energy -= enemy.energy / 3;
            // console.log(`FIGHT ${particle.id}(${particle.team}) killed ${neighbour.id}(${neighbour.team})`)
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }
}

class Split extends Behaviour {
    onStart(sim, particle, visibleNeighbours, dt) {
        sim.split(particle);
        return BehaviorResult.Success;
    }

    canStart(particle, visibleNeighbours) {
        return particle.energy > particle.maxEnergy / 2;
    }
}

class Freeze extends Behaviour {

    constructor(duration) {
        super();
        this.duration = duration;
    }

    onStart0(sim, particle, visibleNeighbours, dt) {
        this.onContinue0(sim, particle, visibleNeighbours, 0);
        this.timer = this.duration;
        return BehaviorResult.Running;
    }

    onContinue0(sim, particle, visibleNeighbours, dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            return BehaviorResult.Success;
        }
        particle.vx = 0;
        particle.vy = 0;
        return BehaviorResult.Running;
    }

    canContinue(particle, visibleNeighbours) {
        return true;
    }
}

class RandomWalk extends Behaviour {

    constructor(duration) {
        super();
        this.duration = duration;
    }

    onStart0(sim, particle, visibleNeighbours, dt) {
        let angle = random(0, 2 * Math.PI);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);

        this.onContinue0(sim, particle, visibleNeighbours, 0);
        this.timer = this.duration;

        return BehaviorResult.Running;
    }

    onContinue0(sim, particle, visibleNeighbours, dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            return BehaviorResult.Success;
        }
        particle.vx = this.vx * particle.speed;
        particle.vy = this.vy * particle.speed;

        if (isNaN(particle.vx)) {
            debugger
        }
        return BehaviorResult.Running;
    }

    canContinue(particle, visibleNeighbours) {
        return true;
    }
}

class HuntWeak extends Behaviour {
    onStart0(sim, particle, visibleNeighbours, dt) {
        let weaklings = visibleNeighbours.filter(([p,d]) => utils.isWeakEnemy(particle, d, p));
        for (let [weakling,] of weaklings) {
            if (Math.random() > 0.3) {
                continue; // sometimes go after other
            }
            utils.pathTo(particle, weakling);
            particle.huntGoal = weakling.id;
            particle.decisionDuration = 0.2;
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }

    canStart(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,d]) => utils.isWeakEnemy(particle, d, p)).length > 0;
    }

    canContinue(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,d]) => p.id === particle.huntGoal
            && utils.isWeakEnemy(particle, d, p)
        ).length === 1
    }

}

class Eat extends Behaviour {
    onStart0(sim, particle, visibleNeighbours, dt) {

        for (let [food,] of visibleNeighbours.filter(([p, d]) => utils.isFood(p) && touches(particle, p, d))) {

            particle.energy += food.foodValue;
            particle.size += 1;
            if (particle.size > 40) {
                particle.size = 40;
                particle.energy += 10;
            }
            particle.maxEnergy += 1;

            if (food.type === particleType.FOOD) {
                sim.initWithType(food, particleType.DEAD_FOOD); // eat food
            }
            if (food.type === particleType.CORPSE) {
                sim.kill(food); // eat corpse
            }
        }

        particle.decisionDuration = 0;
        return BehaviorResult.Success;
    }

    canStart(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,d]) => utils.isFood(p) && touches(particle, p, d)).length > 0;
    }
}

class MovementSeekFood extends Behaviour {

    onStart0(sim, particle, visibleNeighbours, dt) {
        let currentGoal = visibleNeighbours
            .filter(([p,]) => p.id === particle.foodGoal && p.type !== particleType.DEAD_FOOD);
        if (currentGoal.length === 1) {
            utils.pathTo(particle, currentGoal[0][0]);
            particle.decisionDuration = 0.2;
            return BehaviorResult.Success;
        }

        for (let [neighbour,] of visibleNeighbours) {
            if (utils.isFood(neighbour)) {
                if (Math.random() > 0.3) {
                    continue; // sometimes go after other food
                }
                // maybe consider other options?

                utils.pathTo(particle, neighbour);
                particle.foodGoal = neighbour.id;
                particle.decisionDuration = 0.2;
                return BehaviorResult.Success;
            }
        }

        return BehaviorResult.Failure;
    }

    canStart(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => utils.isFood(p)).length > 0;
    }

    canContinue(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => p.id === particle.foodGoal).length === 1;
    }

}

const utils = {
    isFood: function (particle) {
        return particle.alive && (particle.type === particleType.FOOD || particle.type === particleType.CORPSE);
    },

    pathTo: function(particle, goal) {
        let [dx, dy] = vec2d.normalizeOrZero(goal.x - particle.x, goal.y - particle.y);
        particle.vx = dx * particle.speed;
        particle.vy = dy * particle.speed;

        if (isNaN(particle.vx)) {
            debugger
        }
    },

    isWeakEnemy: function(particle, d, prey) {
        return prey.type === particleType.CELL
            && particle.id !== prey.id
            && particle.team !== prey.team
            && prey.energy < particle.energy - 40
            && d < sqr(particle.size + prey.size + 40);
    }
};


const behaviour = {
    FREEZE: new Freeze(0.5),
    RANDOM_WALK: new RandomWalk(1.5),
    SEEK_FOOD: new MovementSeekFood(),
    HUNT_WEAK: new HuntWeak(),
    SPLIT: new Split(),
    FIGHT: new Fight(),
    EAT: new Eat()
};

const behaviours = [
    behaviour.FREEZE,
    behaviour.RANDOM_WALK,
    behaviour.SEEK_FOOD,
    behaviour.HUNT_WEAK,
    behaviour.SPLIT,
    behaviour.FIGHT,
    behaviour.EAT
];

const behavioursDefaultWeights = [0,0,1,0,1,0,1];
const behavioursDefaultActive = [1,0,0,0,0,0,1];


