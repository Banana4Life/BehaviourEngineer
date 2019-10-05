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

        particle.decisionDuration = 1.5;
    }

    canExecute() {
        return true;
    }

    keepExecuting(particle, visibleNeighbours) {
        return false;
    }
}

class MovementSeekFood {

    isFood(particle) {
        return particle.alive && (particle.type === particleType.FOOD || particle.type === particleType.CORPSE);
    }

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
                return;
            }
        }

        movementType.RANDOM_WALK.calculate(particle, visibleNeighbours);
    }

    pathTo(particle, goal) {
        let [dx, dy] = vec2d.normalizeOrZero(goal.x - particle.x, goal.y - particle.y);
        if (isNaN(dx)) {
            debugger
        }
        particle.vx = dx * particle.speed;
        particle.vy = dy * particle.speed;
        particle.decisionDuration = 0.2;
    }
}