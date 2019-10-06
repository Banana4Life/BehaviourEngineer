
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

    start(context) {
        if (this.isReady()) {
            this.state = BehaviorState.Starting;
            let result = this.onStart(context);
            this.updateState(result);
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
}

class BehaviorComposite extends BehaviorNode {
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
        this.selected = -1;
    }

    onStart(context) {
        for (let i = 0; i < this.children.length; ++i) {
            let child = this.children[i];
            let result = child.start(context);
            if (result !== BehaviorResult.Failure) {
                this.selected = i;
                return result;
            }
        }
        return BehaviorResult.Failure;
    }


    onContinue(context) {
        let child = this.children[this.selected];
        return child.continue(context);
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
    constructor(children) {
        super(children);
    }

    onStart(context) {
        return this.runAll(child => child.start(context));
    }

    onContinue(context) {
        return this.runAll(child => child.continue(context));
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

class BehaviorFilter extends BehaviorNode {
    constructor(child) {
        super();
        this.child = child;
    }

    onReset(context) {
        super.onReset(context);
        this.child.reset(context);
    }

    onInterrupt(context) {
        super.onInterrupt(context);
        this.child.interrupt(context);
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
        super.onStart(context);
        if (this.checkPrecondition(context)) {
            return this.execute(context);
        }
        return BehaviorResult.Failure;
    }

    onContinue(context) {
        super.onContinue(context);
        if (this.checkValid(context)) {
            return this.execute(context);
        }
        return BehaviorResult.Failure;
    }

    checkPrecondition(context) {
        return this.checkValid(context);
    }

    checkValid(context) {
        return true;
    }

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

    executeOnce(context) {
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