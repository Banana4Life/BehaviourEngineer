class Behavior {
    static repeating(node) {
        return new RepeatingBehavior(node);
    }

    static parallel() {
        return new ParallelBranch([...arguments]);
    }

    static seq() {
        return new SequenceBranch([...arguments]);
    }

    static selector() {
        return new SelectorBranch([...arguments]);
    }
}


class BehaviorNode {
    state;

    constructor() {
        this.state = BehaviorState.New;
    }

    getState() {
        return this.state;
    }

    isNew() {
        return this.getState() === BehaviorState.New;
    }

    isReady() {
        return this.getState() === BehaviorState.Ready;
    }

    isStarting() {
        return this.getState() === BehaviorState.Starting;
    }

    isRunning() {
        return this.getState() === BehaviorState.Running;
    }

    isInProgress() {
        return this.isStarting() || this.isRunning();
    }

    isSuccessful() {
        return this.getState() === BehaviorState.Successful;
    }

    isFailed() {
        return this.getState() === BehaviorState.Failed;
    }

    isComplete() {
        return this.isSuccessful() || this.isFailed();
    }

    reset(context) {
        if (this.isComplete() || this.isNew()) {
            this.onReset(context);
            this.state = BehaviorState.Ready;
        } else {
            throw new Error("Cannot reset while not new or completed!")
        }
    }

    onReset(context) {

    }

    updateState(result) {
        switch (result) {
            case BehaviorResult.Failure:
                this.state = BehaviorState.Failed;
                break;
            case BehaviorResult.Success:
                this.state = BehaviorState.Successful;
                break;
            case BehaviorResult.Running:
                this.state = BehaviorState.Running;
                break;
        }
    }

    restart(context) {
        if (this.isNew() || this.isComplete()) {
            this.reset(context);
        }
        return this.start(context);
    }

    forceRestart(context) {
        if (this.isRunning()) {
            this.interrupt(context);
        }
        return this.restart(context);
    }

    start(context) {
        if (this.isReady()) {
            this.state = BehaviorState.Starting;
            let result = this.onStart(context);
            this.updateState(result);
            if (this.isComplete()) {
                this.onComplete(context);
            }
            return result;
        } else {
            throw new Error("Cannot start while not ready!");
        }
    }

    onStart(context) {
    }

    continue(context) {
        if (this.isRunning()) {
            let result = this.onContinue(context);
            this.updateState(result);
            if (this.isComplete()) {
                this.onComplete(context);
            }
            return result;
        } else {
            throw new Error("Cannot continue while not running!");
        }
    }

    onContinue(context) {
    }

    interrupt(context) {
        if (this.isRunning()) {
            this.onInterrupt(context);
            this.state = BehaviorState.Failed;
        } else if (this.isComplete()) {
            // already completed
        } else {
            throw new Error("Cannot interrupt while not doing something!");
        }
    }

    onInterrupt(context) {

    }

    onComplete(context) {

    }

    repeat() {
        return new RepeatingBehavior(this);
    }
}

class BehaviorComposite extends BehaviorNode {
    children;

    constructor(children) {
        super();
        this.children = children;
    }


    onInterrupt(context) {
        super.onInterrupt(context);
        for (let child of this.children) {
            child.interrupt(context);
        }
    }

    onReset(context) {
        super.onReset(context);
        for (let child of this.children) {
            child.reset(context);
        }
    }
}

//class BehaviorTree extends BehaviorComposite {
//    constructor(children) {
//        super(children);
//    }
//}

class BehaviorBranch extends BehaviorComposite {
    constructor(children) {
        if (children.length === 0) {
            throw new Error("Does not make sense without children!");
        }
        super(children);
    }
}

class SelectorBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }

    onReset(context) {
        super.onReset(context);
        this.selected = 0;
    }

    onStart(context) {
        return this.tryChildren(context);
    }

    onContinue(context) {
        return this.tryChildren(context);
    }

    tryChildren(context) {
        for (; this.selected < this.children.length; ++this.selected) {
            let child = this.children[this.selected];
            let result = child.start(context);
            if (result !== BehaviorResult.Failure) {
                return result;
            }
        }
        return BehaviorResult.Failure;
    }
}

class SequenceBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }


    onReset(context) {
        super.onReset(context);
        this.active = -1;
    }

    runWhilePossible(context) {
        if (this.active >= this.children.length) {
            return BehaviorResult.Success;
        }
        let active = this.children[this.active];
        let result;
        if (active.isReady()) {
            result = active.start(context);
        } else if (active.isRunning()) {
            result = active.continue(context);
        }
        switch (result) {
            case BehaviorResult.Failure:
                return BehaviorResult.Failure;
            case BehaviorResult.Running:
                return BehaviorResult.Running;
            case BehaviorResult.Success:
                this.active++;
                return this.runWhilePossible(context);
        }
    }

    onStart(context) {
        this.active = 0;
        return this.runWhilePossible(context)
    }

    onContinue(context) {
        return this.runWhilePossible(context);
    }
}

class ParallelBranch extends BehaviorBranch {
    minSuccessful;
    maxFailed;

    successful;
    failed;

    constructor(children, minSuccessful, maxFailed) {
        super(children);
        this.minSuccessful = minSuccessful;
        this.maxFailed = maxFailed;
    }

    onReset(context) {
        super.onReset(context);
        this.successful = 0;
        this.failed = 0;
    }

    onStart(context) {
        return this.runAll(child => child.start(context));
    }

    onContinue(context) {
        return this.runAll(child => child.continue(context));
    }

    runAll(f) {
        for (let child of this.children) {
            if (!child.isComplete()) {
                let result = f(child);
                switch (result) {
                    case BehaviorResult.Success:
                        this.successful++;
                        break;
                    case BehaviorResult.Failure:
                        this.failed++;
                        break;
                }
            }
        }
        let completed = this.successful + this.failed === this.children.length;
        if (!completed) {
            return BehaviorResult.Running;
        }
        if (this.failed >= this.maxFailed) {
            return BehaviorResult.Failure;
        } else if (this.successful >= this.minSuccessful) {
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }
}

class BehaviorTask extends BehaviorNode {

}

class BehaviorWrapper extends BehaviorNode {
    child;

    constructor(child) {
        super();
        this.child = child;
    }


    onReset(context) {
        this.child.reset(context);
    }

    onStart(context) {
        return this.child.start(context);
    }

    onContinue(context) {
        return this.child.continue(context);
    }

    onInterrupt(context) {
        super.onInterrupt(context);
    }
}

class RepeatingBehavior extends BehaviorWrapper {
    constructor(child) {
        super(child);
    }

    onInterrupt(context) {
        if (!this.child.isComplete()) {
            this.child.interrupt();
        }
    }

    shouldRepeat(child, context) {
        return true;
    }

    onStart(context) {
        this.child.start(context);
        if (this.shouldRepeat(context)) {
            return BehaviorResult.Running;
        }
        return BehaviorResult.Success;
    }

    onContinue(context) {
        if (this.child.isRunning()) {
            this.child.continue(context);
            return BehaviorResult.Running;
        } else {
            if (this.shouldRepeat(this.child, context)) {
                this.child.restart(context);
                return BehaviorResult.Running;
            } else {
                return BehaviorResult.Success;
            }
        }
    }
}

class BehaviorFilter extends BehaviorWrapper {
    constructor(child) {
        super(child);
    }

    onStart(context) {
        super.onStart(context);
        let newContext = this.onPreStart(this.child, context);
        let result = this.child.start(newContext);
        return this.onPostStart(this.child, newContext, result);
    }

    onContinue(context) {
        super.onStart(context);
        let newContext = this.onPreContinue(this.child, context);
        let result = this.child.continue(newContext);
        return this.onPostContinue(this.child, newContext, result);
    }

    /**
     * @param child {{BehaviorNode}}
     * @param context {*}
     * @return {*}
     */
    onPreStart(child, context) {
        return context;
    }

    /**
     * @param child {BehaviorNode}
     * @param context {*}
     * @param result {BehaviorResult}
     * @returns {BehaviorResult}
     */
    onPostStart(child, context, result) {
        return result;
    }

    /**
     * @param child {{BehaviorNode}}
     * @param context {*}
     * @return {*}
     */
    onPreContinue(child, context) {
        return true;
    }

    /**
     * @param child {BehaviorNode}
     * @param context {*}
     * @param result {BehaviorResult}
     * @returns {BehaviorResult}
     */
    onPostContinue(child, context, result) {
        return result;
    }
}

class BehaviorInverter extends BehaviorFilter {
    onPostStart(context, child, result) {
        return this.invert(super.onPostStart(context, child, result));
    }


    onPostContinue(context, child, result) {
        return this.invert(super.onPostContinue(context, child, result));
    }

    /**
     * @param result
     * @returns {BehaviorResult}
     */
    invert(result) {
        switch (result) {
            case BehaviorResult.Success:
                return BehaviorResult.Failure;
            case BehaviorResult.Running:
                return BehaviorResult.Running;
            case BehaviorResult.Failure:
                return BehaviorResult.Success;
        }
    }
}

class SimpleTask extends BehaviorTask {
    onStart(context) {
        this.filterContext(context);
        if (this.checkPrecondition(context)) {
            return this.executeStart(context);
        }
        return BehaviorResult.Failure;
    }

    onContinue(context) {
        this.filterContext(context);
        if (this.checkValid(context)) {
            return this.execute(context);
        }
        return BehaviorResult.Failure;
    }

    /**
     * @param context {{dt: number, visibleNeighbours: Array[], particle: Particle, sim: Simulation}}
     */
    filterContext(context) {

    }

    checkPrecondition(context) {
        return this.checkValid(context);
    }

    executeStart(context) {
        this.execute(context);
    }

    checkValid(context) {
        return true;
    }

    /**
     * @param context {{dt: number, visibleNeighbours: Array[], particle: Particle, sim: Simulation}}
     */
    execute(context) {
        return BehaviorResult.Success;
    }
}

class InstantTask extends SimpleTask {
    execute(context) {
        if (this.executeOnce(context)) {
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }

    /**
     * @param context {{dt: number, visibleNeighbours: Array[], particle: Particle, sim: Simulation}}
     */
    executeOnce(context) {
        return true;
    }
}

class TimedTask extends SimpleTask {
    constructor(duration) {
        super();
        this.duration = duration;
    }

    execute(context) {
        if (!this.isRunning()) {
            this.timer = this.duration;
            this.executeBeforeTimer(context);
        }
        this.timer -= context.dt;
        if (this.timer <= 0) {
            return BehaviorResult.Success;
        }
        if (this.executeDuringTimer(context)) {
            return BehaviorResult.Running;
        }
        return BehaviorResult.Failure;
    }

    /**
     * @param context {{dt: number, visibleNeighbours: Array[], particle: Particle, sim: Simulation}}
     */
    executeBeforeTimer(context) {

    }

    /**
     * @param context {{dt: number, visibleNeighbours: Array[], particle: Particle, sim: Simulation}}
     */
    executeDuringTimer(context) {
        return true;
    }
}

const BehaviorResult = {
    Success: 1,
    Running: 2,
    Failure: 3,
};

const BehaviorState = {
    New: 1,
    Ready: 2,
    Starting: 3,
    Running: 4,
    Successful: 5,
    Failed: 6,
};