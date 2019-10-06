
class BehaviorNode {
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

    isRunning() {
        return this.getState() === BehaviorState.Running;
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

    reset() {
        if (this.isComplete() || this.isNew()) {
            this.onReset();
            this.state = BehaviorState.Ready;
        } else {
            throw new Error("Cannot reset while not new or completed!")
        }
    }

    onReset() {

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

    start() {
        if (this.isReady()) {
            this.state = BehaviorState.Running;
            let result = this.onStart();
            this.updateState(result);
            return result;
        } else {
            throw new Error("Cannot start while not ready!");
        }
    }

    onStart() {
    }

    continue() {
        if (this.isRunning()) {
            let result = this.onContinue();
            this.updateState(result);
            return result;
        } else {
            throw new Error("Cannot continue while not running!");
        }
    }

    onContinue() {
    }

    interrupt() {
        if (this.isRunning()) {
            this.onInterrupt();
            this.state = BehaviorState.Failed;
        } else if (this.isComplete()) {
            // already completed
        } else {
            throw new Error("Cannot interrupt while not doing something!");
        }
    }

    onInterrupt() {

    }
}

class BehaviorComposite extends BehaviorNode {
    constructor(children) {
        super();
        this.children = children;
    }


    onInterrupt() {
        super.onInterrupt();
        for (let child of this.children) {
            child.interrupt();
        }
    }

    onReset() {
        super.onReset();
        for (let child of this.children) {
            child.reset();
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

    onReset() {
        super.reset();
        this.selected = -1;
    }

    onStart() {
        for (let i = 0; i < this.children.length; ++i) {
            let child = this.children[i];
            let result = child.start();
            if (result !== BehaviorResult.Failure) {
                this.selected = i;
                return result;
            }
        }
        return BehaviorResult.Failure;
    }


    onContinue() {
        return this.children[this.selected].continue();
    }
}

class SequenceBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }


    onReset() {
        super.onReset();
        this.active = -1;
    }

    runWhilePossible() {
        if (this.active >= this.children.length) {
            return BehaviorResult.Success;
        }
        let active = this.children[this.active];
        let result;
        if (active.isReady()) {
            result = active.start();
        } else if (active.isRunning()) {
            result = active.continue();
        }
        switch (result) {
            case BehaviorResult.Failure:
                return BehaviorResult.Failure;
            case BehaviorResult.Running:
                return BehaviorResult.Running;
            case BehaviorResult.Success:
                this.active++;
                return this.runWhilePossible();
        }
    }

    onStart() {
        this.active = 0;
        return this.runWhilePossible()
    }

    continue() {
        return this.runWhilePossible();
    }
}

class ParallelBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }

    onStart() {
        return this.runAll(child => child.start());
    }

    onContinue() {
        return this.runAll(child => child.continue());
    }

    runAll(f) {
        let hasRunning = false;
        let hasSuccess = false;
        for (let child of this.children) {
            let result = f(child);
            if (result === BehaviorResult.Running) {
                hasRunning = true;
            } else if (result === BehaviorResult.Success) {
                hasSuccess = true;
            }
        }
        if (hasRunning) {
            return BehaviorResult.Running;
        }
        if (hasSuccess) {
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }
}

class BehaviorTask extends BehaviorNode {

}

class SimpleTask extends BehaviorTask {
    onStart() {
        super.onStart();
        if (this.checkPrecondition()) {
            return this.execute();
        }
        return BehaviorResult.Failure;
    }

    onContinue() {
        super.onContinue();
        if (this.checkValid()) {
            return this.execute();
        }
        return BehaviorResult.Failure;
    }

    checkPrecondition() {
        return this.checkValid();
    }

    checkValid() {
        return true;
    }

    execute() {
        return BehaviorResult.Success;
    }
}

class InstantTask extends SimpleTask {
    execute() {
        if (this.executeOnce()) {
            return BehaviorResult.Success;
        }
        return BehaviorResult.Failure;
    }

    executeOnce() {
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
    Running: 3,
    Successful: 4,
    Failed: 5,
};