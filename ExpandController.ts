import {ExpandGroupMemory} from "./BaseExpandGroup";
import {TestExpandGroup} from "./TestExpandGroup";


export type ExpandMemory = {
    testExpand?: ExpandGroupMemory;
}

export class ExpandController {
    protected memory: ExpandMemory;

    public constructor(memory: ExpandMemory) {
        this.memory = memory;
        if (!memory.testExpand) {
            memory.testExpand = {
                creepNameList: [],
                state: "spawn",
                nameShape: {},
                moveRecord: {
                    record: {}
                },
                nextPosMap: {},
                curPosMap: {}
            }
        }
    }

    public run() {
        try {
            let testExpand = new TestExpandGroup(this.memory.testExpand);
            testExpand.run();
            testExpand.visualize();
        } catch (e) {
            console.log("expand error:" + e.stack);
        }
    }
}