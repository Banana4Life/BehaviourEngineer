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
        return visibleNeighbours.filter(p => p.id === particle.foodGoal).length === 1;
    }

    canExecute(particle, visibleNeighbours) {
        return visibleNeighbours.filter(p => this.isFood(p)).length > 0;
    }

    calculate(particle, visibleNeighbours) {
        for (let [neighbour, distance] of visibleNeighbours) {
            if (this.isFood(neighbour)) {
                // maybe consider other options?
                let [dx, dy] = vec2d.normalize(neighbour.x - particle.x, neighbour.y - particle.y);
                particle.vx = dx * particle.speed;
                particle.vy = dy * particle.speed;
                particle.decisionDuration = 0.2;
                particle.foodGoal = neighbour.id;
                return;
            }
        }

        movementType.RANDOM_WALK.calculate(particle, visibleNeighbours);
    }

}