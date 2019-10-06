class Fight extends InstantTask {
    executeOnce(context) {
        let particle = context.particle;
        for (let [enemy,] of context.visibleNeighbours.filter(([p, d]) => utils.isWeakEnemy(particle, d, p) && touches(particle, p, d))) {
            context.sim.initWithType(enemy, particleType.CORPSE);
            particle.energy -= enemy.energy / 3;
            // console.log(`FIGHT ${particle.id}(${particle.team}) killed ${neighbour.id}(${neighbour.team})`)
            return true
        }
        return false
    }
}

class Split extends InstantTask {
    executeOnce(context) {
        context.sim.split(context.particle);
        return true;
    }

    checkPrecondition(context) {
        let particle = context.particle;
        return particle.energy > particle.maxEnergy / 2;
    }
}

class Freeze extends TimedTask {
    executeDuringTimer(context) {
        context.particle.vx = 0;
        context.particle.vy = 0;
        return true;
    }
}

class RandomWalk extends TimedTask {

    executeBeforeTimer(context) {
        let angle = random(0, 2 * Math.PI);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    executeDuringTimer(context) {
        let particle = context.particle;
        particle.vx = this.vx * particle.speed;
        particle.vy = this.vy * particle.speed;

        if (isNaN(particle.vx)) {
            debugger
        }

        return true;
    }
}

class HuntWeak extends SimpleTask {

    filterContext(context) {
        if (this.isRunning()) {
            context.visibleNeighbours = context.visibleNeighbours.filter(([p,]) => p.id === context.particle.huntGoal);
        }
        context.visibleNeighbours = context.visibleNeighbours.filter(([p,d]) => utils.isWeakEnemy(context.particle, d, p))
    }

    checkPrecondition(context) {
        return context.visibleNeighbours.length > 0;
    }

    executeStart(context) {
        let particle = context.particle;
        for (let [prey,] of context.visibleNeighbours) {
            // TODO not always pick first?
            utils.pathTo(particle, prey);
            particle.huntGoal = prey.id;
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }

    execute(context) {
        let prey = context.visibleNeighbours;
        if (prey.length !== 0) {
            utils.pathTo(prey[0][0]);
            return BehaviorResult.Running;
        }
        return BehaviorResult.Failure
    }
}

class Eat extends InstantTask {

    // Filter touching food particles
    filterContext(context) {
        context.visibleNeighbours = context.visibleNeighbours.filter(([p,d]) => utils.isFood(p) && touches(context.particle, p, d));
    }

    checkValid(context) {
        return context.visibleNeighbours.length > 0;
    }

    executeOnce(context) {
        let particle = context.particle;
        for (let [food,] of context.visibleNeighbours) {

            particle.energy += food.foodValue;
            particle.size += 1;
            if (particle.size > 40) {
                particle.size = 40;
                particle.energy += 10;
            }
            particle.maxEnergy += 1;

            if (food.type === particleType.FOOD) {
                context.sim.initWithType(food, particleType.DEAD_FOOD); // eat food
            }
            if (food.type === particleType.CORPSE) {
                context.sim.kill(food); // eat corpse
            }
        }

        particle.decisionDuration = 0;
        return true
    }
}

class MovementSeekFood extends SimpleTask {

    // Filter food particles / food goal particle
    filterContext(context) {
        if (this.isRunning()) {
            context.visibleNeighbours = context.visibleNeighbours.filter(([p,]) => p.id === context.particle.foodGoal);
        }
        context.visibleNeighbours = context.visibleNeighbours.filter(([p,]) => utils.isFood(p));
    }

    checkPrecondition(context) {
        return context.visibleNeighbours.length > 0;
    }

    executeStart(context) {
        let foods = context.visibleNeighbours;
        for (let [food,] of foods) {
            // maybe consider other options?
            utils.pathTo(context.particle, food);
            context.particle.foodGoal = food.id;
            return BehaviorResult.Running;
        }
        return BehaviorResult.Failure;
    }

    execute(context) {
        let foods = context.visibleNeighbours;
        if (foods.length !== 0) {
            utils.pathTo(context.particle, foods[0][0]);
            return BehaviorResult.Running;
        }
        return BehaviorResult.Failure
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
    EAT: new Eat(),
};

const complex_behavior = {
    superBehavior: function () {
        return new ParallelBranch([
            new ParallelBranch(new Eat(), new Split(), new Fight()).repeat(),
            new SelectorBranch(new MovementSeekFood(), new Freeze(2)).repeat()
        ]);
    }
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

const behavioursDefaultWeights = [0,0,1,0,1,0,20];
const behavioursDefaultActive = [1,0,0,0,0,0,1];


