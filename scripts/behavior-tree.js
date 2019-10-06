
class BehaviorNode {
    constructor() {
        this.state = BehaviorState.Ready;
    }

    getState() {
        return this.state;
    }

    start() {

    }

    resume() {
    }
}

class BehaviorComposite extends BehaviorNode {
    constructor(children) {
        super();
        this.children = children;
    }

    start() {
        super.start();
    }

    resume() {
        super.resume();
    }
}

//class BehaviorTree extends BehaviorComposite {
//    constructor(children) {
//        super(children);
//    }
//}

class BehaviorBranch extends BehaviorComposite {
    constructor(children) {
        super(children);
    }
}

class SelectorBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }
}

class SequenceBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }
}

class ParallelBranch extends BehaviorBranch {
    constructor(children) {
        super(children);
    }
}

class BehaviorTask extends BehaviorNode {

}

const BehaviorResult = {
    Success: 1,
    Failure: 2,
};

const BehaviorState = {
    New: 1,
    Ready: 2,
    Running: 3,
};