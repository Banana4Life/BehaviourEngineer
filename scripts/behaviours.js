

class Behaviour {
    calculate(sim, particle, visibleNeighbours) {

    }

    canExecute(particle, visibleNeighbours) {
        return false;
    }

    keepExecuting(particle, visibleNeighbours) {
        return false;
    }
}

class Fight extends Behaviour {
    calculate(sim, particle, visibleNeighbours) {
        for (let [enemy,] of visibleNeighbours.filter(([p, d]) => utils.isWeakEnemy(particle, d, p) && sim.touches(particle, p, d))) {
            sim.initWithType(enemy, particleType.CORPSE);
            particle.energy -= enemy.energy / 3;
            // console.log(`FIGHT ${particle.id}(${particle.team}) killed ${neighbour.id}(${neighbour.team})`)
        }
        particle.decisionDuration = 0;
    }

    canExecute(particle, visibleNeighbours) {
        return true;
    }

    keepExecuting(particle, visibleNeighbours) {
        return false;
    }
}

class Split {
    calculate(sim, particle, visibleNeighbours) {
        if (this.canExecute(particle, visibleNeighbours)) {
            sim.split(particle);
        }
    }

    canExecute(particle, visibleNeighbours) {
        return particle.energy > particle.maxEnergy / 2;
    }

    keepExecuting(particle, visibleNeighbours) {
        return false;
    }
}

class MovementFreeze extends Behaviour {
    calculate(sim, particle, visibleNeighbours) {
        particle.vx = 0;
        particle.vy = 0;

        particle.decisionDuration = 0.1;
    }

    canExecute(particle, visibleNeighbours) {
        return true;
    }

    keepExecuting(particle, visibleNeighbours) {
        return false;
    }
}

class MovementRandomWalk extends Behaviour {
    calculate(sim, particle, visibleNeighbours) {
        let angle = random(0, 2 * Math.PI);
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        particle.vx = vx * particle.speed;
        particle.vy = vy * particle.speed;
        if (isNaN(particle.vx)) {
            debugger
        }

        particle.decisionDuration = 1.5;
    }

    canExecute() {
        return true;
    }

    keepExecuting(particle, visibleNeighbours) {
        return false;
    }
}

class HuntWeak extends Behaviour {
    keepExecuting(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,d]) => p.id === particle.huntGoal
            && utils.isWeakEnemy(particle, d, p)
        ).length === 1
    }

    canExecute(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,d]) => utils.isWeakEnemy(particle, d, p)).length > 0;
    }

    calculate(sim, particle, visibleNeighbours) {
        let weaklings = visibleNeighbours.filter(([p,d]) => utils.isWeakEnemy(particle, d, p));
        for (let [weakling,] of weaklings) {
            if (Math.random() > 0.3) {
                continue; // sometimes go after other
            }
            utils.pathTo(particle, weakling);
            particle.huntGoal = weakling.id;
            particle.decisionDuration = 0.2;
            return;
        }

        behaviour.SEEK_FOOD.calculate(sim, particle, visibleNeighbours);
    }

}

class MovementSeekFood extends Behaviour {

    eat(sim, particle, visibleNeighbours) {
        for (let [food,] of visibleNeighbours.filter(([p, d]) => utils.isFood(p) && sim.touches(particle, p, d))) {

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
    }

    calculate(sim, particle, visibleNeighbours) {

        this.eat(sim, particle, visibleNeighbours);

        let currentGoal = visibleNeighbours
            .filter(([p,]) => p.id === particle.foodGoal && p.type !== particleType.DEAD_FOOD);
        if (currentGoal.length === 1) {
            utils.pathTo(particle, currentGoal[0][0]);
            particle.decisionDuration = 0.2;
            return;
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
                return;
            }
        }

        behaviour.RANDOM_WALK.calculate(sim, particle, visibleNeighbours);
    }

    keepExecuting(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => p.id === particle.foodGoal).length === 1;
    }

    canExecute(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => utils.isFood(p)).length > 0;
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
    FREEZE: new MovementFreeze(),
    RANDOM_WALK: new MovementRandomWalk(),
    SEEK_FOOD: new MovementSeekFood(),
    HUNT_WEAK: new HuntWeak(),
    SPLIT: new Split(),
    FIGHT: new Fight()
};

const behaviours = [
    behaviour.FREEZE,
    behaviour.RANDOM_WALK,
    behaviour.SEEK_FOOD,
    behaviour.HUNT_WEAK,
    behaviour.SPLIT,
    behaviour.FIGHT
];

const behavioursDefaultWeights = [0,0,1,0,1,0];
const behavioursDefaultActive = [1,0,0,0,0,0];


