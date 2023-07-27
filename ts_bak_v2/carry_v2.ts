import {globalConfig, RoomName} from "./globalConfig";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {FacilityMemory} from "./facility";
import {Move} from "./move";
import {RoomContext} from "./RoomModule";
import {min} from "lodash";

type CarryTaskType = "output" | "input" | "pickup";
type ObjectWithPos = Structure | Creep | Ruin | Resource | Tombstone;

/**
 * 存储结构
 */
export type CarryMemoryV2 = {
    creepNameList: string[];
    taskMap: {
        [taskId: string]: TaskInfo;
    }

}

type TaskInfo = {
    id: string;
    objId: string;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    arranged: number;
    //一经创建，不再修改
    steps: TaskStep[];
}

type TaskStep = {
    taskId: string;
    stepIdx: number;
    type: "withdraw" | "pickup" | "transform" | "send";
    resourceType: ResourceConstant;
    objId: string;
    linkId: string;
    amount: number;
    reserve: number;
    skipAble: boolean;
    //必须与下一个一起执行
    withNext: boolean;
}

/**
 * creep存储携带信息
 */
export type CarryCreepMemoryV2 = {
    //任务列表，第一个为当前执行任务
    stepRecordList: {
        taskId: string;
        stepIdx: number;
        reserved: number;
        skip: boolean;
    }[];
    // capacity:number;
    roomName: RoomName;

    // hasBusyTask: boolean;
    //
    // logicTaskId?: string;
    // stepIdx?: number;
    // reserve?: number;
    // status?: "first" | "second";
}


export class CarryV2 {

    protected readonly roomName: RoomName;
    protected storage: StructureStorage;
    protected memory: CarryMemoryV2;
    protected fac: FacilityMemory;
    private move: Move;

    public constructor(context: RoomContext) {
        this.roomName = context.roomName;
        this.memory = context.roomData.carry_v2;
        this.fac = context.fac;
        this.move = context.move;
        this.storage = context.storage;
    }


    protected spawnCreeps(): void {
        //临时初始化
        // if (this.memory.creepNameList.length == 0) {
        this.memory.creepNameList = []
        let room = Game.rooms[this.roomName];
        for (let creep of room.find(FIND_MY_CREEPS)) {
            if (creep.name.startsWith("carry")) {
                this.memory.creepNameList.push(creep.name)
            }
        }
        // }

        let config = globalConfig[this.roomName].carry;
        if (this.memory.creepNameList.length >= config.amount) {
            return;
        }
        let bodyList: BodyPartConstant[] = [];
        for (let part in config.defaultParts) {
            let partAmount = config.defaultParts[part];
            bodyList = bodyList.concat(new Array(partAmount).fill(part))
        }
        let creepName = `carry-${this.roomName}-${Game.time}`;
        Spawn.reserveCreep({
            bakTick: 0,
            body: bodyList,
            memory: {
                module: "carry",
                carryV2: {
                    stepRecordList: [],
                    roomName: this.roomName,
                }
            },
            name: creepName,
            priority: 0,
            spawnNames: this.fac.spawnNames
        })

        this.memory.creepNameList.push(creepName);
    }

    public run(): void {
        this.spawnCreeps()

        let nameSet = {}
        for (let creepName of this.memory.creepNameList) {
            if (nameSet[creepName]) {
                console.log(`creep name duplicate: ${this.roomName} ${creepName}`);
                continue;
            }
            nameSet[creepName] = true
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            if (creep.spawning) {
                continue;
            }


            if (!creep.memory.carryV2) {
                creep.memory.carryV2 = {
                    stepRecordList: [],
                    roomName: this.roomName,
                }
            }

            let creepMemory = creep.memory.carryV2;

            if (creepMemory.stepRecordList.length == 0) {
                this.arrange(creep)
                if (creepMemory.stepRecordList.length == 0) {
                    continue;
                }
            }
            let recordIdx = 0;
            for (let i = 0; i < creepMemory.stepRecordList.length; i++) {
                let record = creepMemory.stepRecordList[i];
                if (!record.skip) {
                    recordIdx = i;
                    break;
                }
            }
            // execute task
            let stepRecord = creepMemory.stepRecordList[recordIdx];
            let task = this.memory.taskMap[stepRecord.taskId];
            if (!task) {
                this.finishStep(creepName, recordIdx, 0);
                continue;
            }
            let curStep = task.steps[stepRecord.stepIdx];
            if (!curStep) {
                this.finishStep(creepName, recordIdx, 0);
                continue;
            }
            let target = Game.getObjectById<ObjectWithPos>(curStep.objId);
            if (!target) {
                this.finishStep(creepName, recordIdx, 0);
                continue;
            }
            if (curStep.type == "withdraw") {
                this.move.reserveMove(creep, target.pos, 1);
                let res = creep.withdraw(<Structure | Ruin | Tombstone>target, curStep.resourceType, stepRecord.reserved);
                if (res == ERR_NOT_ENOUGH_RESOURCES) {
                    res = creep.withdraw(<Structure | Ruin | Tombstone>target, curStep.resourceType);
                }
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishStep(creepName, recordIdx, stepRecord.reserved);
                }
                continue;
            }
            if (curStep.type == "transform") {
                this.move.reserveMove(creep, target.pos, 1);
                let res = creep.transfer(<AnyCreep | Structure>target, curStep.resourceType, stepRecord.reserved)
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishStep(creepName, recordIdx, stepRecord.reserved)
                }
                continue;
            }
            if (curStep.type == "pickup") {
                this.move.reserveMove(creep, target.pos, 1);
                let res = creep.pickup(<Resource>target);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishStep(creepName, recordIdx, stepRecord.reserved)
                }
                continue;
            }
        }
    }

    protected arrange(creep: Creep): void {
        console.log("arrange", creep.name)
        let creepMemory = creep.memory.carryV2;

        let taskSteps: TaskStep[] = [];
        let taskAmount;

        //1. has resource
        let usedAmount = creep.store.getUsedCapacity();
        if (usedAmount) {
            for (let type in creep.store) {
                let storeAmount = creep.store.getUsedCapacity(<ResourceConstant>type);
                if (!storeAmount) {
                    continue
                }
                for (let taskId in this.memory.taskMap) {
                    let task = this.memory.taskMap[taskId];
                    for (let step of task.steps) {
                        if (step.amount <= step.reserve) {
                            continue;
                        }
                        if (step.type != "transform" || task.resourceType != type) {
                            if (step.skipAble) {
                                continue;
                            }
                            break;
                        }
                        taskSteps.push(step);
                        taskAmount = usedAmount;
                    }
                }
            }
        }

        //2. hasn't resource
        let capAmount = creep.store.getFreeCapacity();
        if (capAmount == creep.store.getCapacity()) {
            taskSteps = [];
            for (let taskId in this.memory.taskMap) {
                let task = this.memory.taskMap[taskId];
                for (let step of task.steps) {
                    if (step.amount <= step.reserve) {
                        continue;
                    }
                    console.log("check", taskId, step.stepIdx)
                    if (step.type != "withdraw") {
                        if (step.skipAble) {
                            continue;
                        }
                        break;
                    }
                    console.log("push", taskId, step.stepIdx)
                    taskSteps.push(step);
                    taskAmount = capAmount;
                }
            }
        }
        if (!taskSteps.length) {
            return;
        }
        taskSteps = _.sortBy(taskSteps, (t) => {
            let obj = Game.getObjectById<Structure | Creep>(t.objId);
            if (!obj) {
                return 255;
            }
            return creep.pos.getRangeTo(obj.pos);
        })
        let step = taskSteps[0]
        this.takeStep(creep, step, taskAmount);
        return;
    }

    protected recoveryCreep(creepName: string): void {
        if (Memory.creeps[creepName]) {
            let carryCreepMemory = Memory.creeps[creepName].carryV2;
            for (let i = 0, len = carryCreepMemory.stepRecordList.length; i < len; i++) {
                this.finishStep(creepName, i, 0);
            }
            delete Memory.creeps[creepName];
        }
        _.remove(this.memory.creepNameList, function (e) {
            return e == creepName;
        })
    }

    public addCarryReq(obj: ObjectWithPos,
                       carryType: CarryTaskType,
                       resourceType: ResourceConstant,
                       amount: number): string {
        if (!obj || !carryType || !resourceType || amount <= 0) {
            return null;
        }
        let roomName = <RoomName>obj.pos.roomName;
        if (roomName != this.roomName) {
            console.log("not in one room" + roomName + "  " + this.roomName)
            return null;
        }
        let taskId = `${obj.id}#${carryType}#${resourceType}`;
        if (!this.memory.taskMap[taskId]) {
            this.memory.taskMap[taskId] = {
                id: taskId,
                objId: obj.id,
                resourceType: resourceType,
                carryType: carryType,
                amount: amount,
                arranged: 0,
                steps: []
            }
            return taskId;
        }
        this.memory.taskMap[taskId].amount = amount;
        this.initTaskStep(taskId);
        return taskId;
    }

    protected initTaskStep(taskId: string): void {
        let task = this.memory.taskMap[taskId];
        if (task.steps.length) {
            return
        }
        if (task.arranged >= task.amount) {
            return;
        }

        if (this.storage) {
            let arrange_amount = Math.min(task.amount, 200);
            switch (task.carryType) {
                case "pickup":
                    if (this.storage.store.getFreeCapacity() <= 0) {
                        arrange_amount = 0;
                        break;
                    }
                    task.steps.push({
                        amount: arrange_amount,
                        objId: task.objId,
                        reserve: 0,
                        resourceType: task.resourceType,
                        stepIdx: task.steps.length,
                        taskId: taskId,
                        linkId: "",
                        type: "pickup",
                        withNext: true,
                        skipAble: false
                    });
                    task.steps.push({
                        amount: arrange_amount,
                        objId: this.storage.id,
                        reserve: 0,
                        resourceType: task.resourceType,
                        stepIdx: task.steps.length,
                        taskId: taskId,
                        linkId: "",
                        type: "transform",
                        withNext: false,
                        skipAble: true
                    });
                    break;
                case "output":
                    if (this.storage.store.getFreeCapacity() <= 0) {
                        arrange_amount = 0;
                        break;
                    }
                    task.steps.push({
                        amount: arrange_amount,
                        objId: task.objId,
                        reserve: 0,
                        resourceType: task.resourceType,
                        stepIdx: task.steps.length,
                        taskId: taskId,
                        linkId: "",
                        type: "withdraw",
                        withNext: true,
                        skipAble: false
                    });
                    task.steps.push({
                        amount: arrange_amount,
                        objId: this.storage.id,
                        reserve: 0,
                        resourceType: task.resourceType,
                        stepIdx: task.steps.length,
                        taskId: taskId,
                        linkId: "",
                        type: "transform",
                        withNext: false,
                        skipAble: true
                    });
                    break;
                case "input":
                    if (this.storage.store.getUsedCapacity(task.resourceType) <= 0) {
                        arrange_amount = 0;
                        break;
                    }
                    task.steps.push({
                        amount: arrange_amount,
                        objId: this.storage.id,
                        reserve: 0,
                        resourceType: task.resourceType,
                        stepIdx: task.steps.length,
                        taskId: taskId,
                        linkId: "",
                        type: "withdraw",
                        withNext: true,
                        skipAble: true
                    });
                    task.steps.push({
                        amount: arrange_amount,
                        objId: task.objId,
                        reserve: 0,
                        resourceType: task.resourceType,
                        stepIdx: task.steps.length,
                        taskId: taskId,
                        linkId: "",
                        type: "transform",
                        withNext: false,
                        skipAble: false
                    });
                    break;
                default:
                    console.log("unknown type" + task.carryType)
            }
            if (arrange_amount > 0) {
                task.arranged += arrange_amount;
            }
        }
    }

    protected takeStep(creep: Creep, step: TaskStep, amount: number): void {
        console.log(creep.name, "take", step.taskId, step.stepIdx)
        let task = this.memory.taskMap[step.taskId];
        let startIdx = step.stepIdx;
        while (--startIdx > -1) {
            if (!task.steps[startIdx].withNext) {
                break;
            }
        }
        startIdx++;

        let endIdx = step.stepIdx;
        while (task.steps[endIdx].withNext) {
            endIdx++;
        }
        for (let i = startIdx; i <= endIdx; i++) {
            let curStep = task.steps[i]
            creep.memory.carryV2.stepRecordList.push({
                taskId: curStep.taskId,
                stepIdx: curStep.stepIdx,
                reserved: amount,
                skip: i < step.stepIdx
            });
            curStep.reserve += amount;
        }
        creep.say(step.type + "!");
    }

    protected finishStep(creepName: string, index: number, finishAmount: number): void {
        let carryCreepMemory = Memory.creeps[creepName].carryV2;
        for (let i = 0; i <= index; i++) {
            let record = carryCreepMemory.stepRecordList[i];
            let taskId = record.taskId;
            let task = this.memory.taskMap[taskId];
            if (!task) {
                continue
            }
            let step = task.steps[record.stepIdx];
            if (!step) {
                console.log("error null step", record.stepIdx, i, index, JSON.stringify(task))
                if(Game.creeps[creepName]){
                    Game.creeps[creepName].say("error")
                }
            }

            let reserved = record.reserved;
            step.amount -= reserved;
            step.reserve -= reserved;
            if (step.amount < 0) {
                step.amount = 0;
            }

            //结束任务，删除task
            if (step.amount <= 0 && record.stepIdx == task.steps.length - 1) {
                task.steps = []
                this.initTaskStep(taskId);
                if (!task.steps.length) {
                    delete this.memory.taskMap[taskId]
                }
            }
        }
        carryCreepMemory.stepRecordList.splice(index, index + 1);
    }

    public visual(): void {
        let room = Game.rooms[this.roomName];
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            if (!task) {
                continue;
            }
            let obj = Game.getObjectById<ObjectWithPos>(task.objId);
            if (!obj) {
                continue;
            }
            room.visual.text(task.amount + " " + task.arranged, obj.pos, {
                font: 0.25
            })
        }
        for (let creepName of this.memory.creepNameList) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            if (creep.memory.carryV2.stepRecordList.length == 0) {
                continue;
            }
            let task = this.memory.taskMap[creep.memory.carryV2.stepRecordList[0].taskId];
            if (!task) {
                continue;
            }
            let obj = Game.getObjectById<ObjectWithPos>(task.objId);
            room.visual.line(creep.pos, obj.pos, {
                color: "red",
                lineStyle: "dashed"
            })
        }
    }

    // public checkReserved(): void {
    //     let reservedMap = {};
    //     for (let creepName of this.memory.creepNameList) {
    //         let creep = Game.creeps[creepName];
    //         let creepMemory = creep.memory.carry;
    //         for (let taskRecord of creepMemory.taskRecordList) {
    //             let reserved = reservedMap[taskRecord.taskId];
    //             if (!reserved) {
    //                 reserved = 0;
    //             }
    //             reserved += taskRecord.reserved;
    //         }
    //     }
    //     for (let taskId in this.memory.taskMap) {
    //         let task = this.memory.taskMap[taskId];
    //         let reserved = reservedMap[taskId];
    //         if (!reserved) {
    //             reserved = 0;
    //         }
    //         if (task.reserved != reserved) {
    //             console.log(`[CheckReserved] ${this.roomName} ${taskId} ${task.reserved} ${reserved}`)
    //             task.reserved = reserved
    //         }
    //     }
    // }
}
