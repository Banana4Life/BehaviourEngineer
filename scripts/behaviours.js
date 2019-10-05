class BasicMovement {

    pathTo(particle, goal) {
        let [dx, dy] = vec2d.normalizeOrZero(goal.x - particle.x, goal.y - particle.y);
        particle.vx = dx * particle.speed;
        particle.vy = dy * particle.speed;

        if (isNaN(particle.vx)) {
            debugger
        }
    }

}

class MovementFreeze {
    calculate(particle, visibleNeighbours) {
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

class MovementRandomWalk {
    calculate(particle, visibleNeighbours) {
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

class HuntWeak extends BasicMovement {
    keepExecuting(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,d]) => p.id === particle.huntGoal
            && this.isWeakEnemy(particle, p)
            && d < sqr(particle.size + 5)
        ).length === 1
    }

    canExecute(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => this.isWeakEnemy(particle, p)).length > 0;
    }

    calculate(particle, visibleNeighbours) {
        let weaklings = visibleNeighbours.filter(([p,]) => this.isWeakEnemy(particle, p));
        for (let [weakling,] of weaklings) {
            if (Math.random() > 0.3) {
                continue; // sometimes go after other
            }
            this.pathTo(particle, weakling);
            particle.huntGoal = weakling.id;
            particle.decisionDuration = 1.5;
            return;
        }

        movementType.RANDOM_WALK.calculate(particle, visibleNeighbours);
    }

    isWeakEnemy(particle, prey) {
        return prey.type === particleType.CELL
            && particle.id !== prey.id
            && particle.team !== prey.team
            && prey.energy < particle.energy / 2;
    }
}

class MovementSeekFood extends BasicMovement{

    keepExecuting(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => p.id === particle.foodGoal).length === 1;
    }

    canExecute(particle, visibleNeighbours) {
        return visibleNeighbours.filter(([p,]) => this.isFood(p)).length > 0;
    }

    calculate(particle, visibleNeighbours) {
        let currentGoal = visibleNeighbours
            .filter(([p,]) => p.id === particle.foodGoal && p.type !== particleType.DEAD_FOOD);
        if (currentGoal.length === 1) {
            this.pathTo(particle, currentGoal[0][0]);
            particle.decisionDuration = 0.2;
            return;
        }

        for (let [neighbour,] of visibleNeighbours) {
            if (this.isFood(neighbour)) {
                if (Math.random() > 0.3) {
                    continue; // sometimes go after other food
                }
                // maybe consider other options?

                this.pathTo(particle, neighbour);
                particle.foodGoal = neighbour.id;
                particle.decisionDuration = 0.2;
                return;
            }
        }

        movementType.RANDOM_WALK.calculate(particle, visibleNeighbours);
    }

    isFood(particle) {
        return particle.alive && (particle.type === particleType.FOOD || particle.type === particleType.CORPSE);
    }
}