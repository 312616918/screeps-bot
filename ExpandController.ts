import {ExpandGroupMemory} from "./BaseExpandGroup";
import {TestExpandGroup} from "./TestExpandGroup";
import {TestExpandGroup2} from "./TestExpandGroup2";


export type ExpandMemory = {
    testExpand?: ExpandGroupMemory;
    testExpand2?: ExpandGroupMemory;
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
        if(!memory.testExpand2){
            memory.testExpand2 = {
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
            let testExpand2 = new TestExpandGroup2(this.memory.testExpand2);
            testExpand2.run();
            testExpand2.visualize();

        } catch (e) {
            console.log("expand error:" + e.stack);
        }
    }
}