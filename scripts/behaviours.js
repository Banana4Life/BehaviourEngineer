class MovementFreeze {
    calculate(particle, visibleNeighbours) {
        particle.vx = 0;
        particle.vy = 0;
    }

    canExecute() {
        return true;
    }

    keepExecuting() {
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
    }
}

class MovementSeekFood {

    isFood(particle) {
        return particle.alive && (particle.type === particleType.FOOD || particle.type === particleType.CORPSE);
    }

    calculate(particle, visibleNeighbours) {

        for (let [neighbour, distance] of visibleNeighbours) {
            if (this.isFood(neighbour)) {
                // maybe consider other options?
                let [dx, dy] = vec2d.normalize(neighbour.x - particle.x, neighbour.y - particle.y);
                particle.vx = dx * particle.speed;
                particle.vy = dy * particle.speed;
                return;
            }
        }

        movementType.RANDOM_WALK.calculate(particle, visibleNeighbours);
    }

}