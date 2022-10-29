import {globalConfig, RoomName} from "./globalConfig";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {FacilityMemory} from "./facility";
import {Move} from "./move";

type CarryTaskType = "output" | "input" | "pickup";
type ObjectWithPos = Structure | Creep | Ruin | Resource | Tombstone;

/**
 * 存储结构
 */
export type CarryMemory = {
    creepNameList: string[];
    //任务列表
    taskMap: {
        [taskId: string]: CarryTask;
    }

    logicTaskMap: {
        [taskId: string]: LogicCarryTask;
    }

}

type CarryTask = {
    id: string;
    objId: string;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;
}

type LogicCarryTask = {
    id: string;
    objId: string;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    steps: TaskStep[];
}

type TaskStep = {
    type: "carry" | "send";
    fromId: string;
    toId: string;
    fromType: "withdraw" | "pickup";
    amount: number;
    reserve: number;
}

/**
 * creep存储携带信息
 */
export type CarryCreepMemory = {
    //任务列表，第一个为当前执行任务
    taskRecordList: {
        taskId: string;
        reserved: number;
        needRec: boolean;
    }[];
    // capacity:number;
    roomName: RoomName;

    hasBusyTask: boolean;

    logicTaskId?: string;
    stepIdx?: number;
    reserve?: number;
    status?: "first" | "second";
}


export class Carry {

    protected readonly roomName: RoomName;
    protected storage: StructureStorage;
    protected memory: CarryMemory;
    protected fac: FacilityMemory;
    private move: Move;
    private _isNewCarry: boolean = false;

    public static entities: {
        [roomName in RoomName]?: Carry
    } = {};

    public constructor(roomName: RoomName, memory: CarryMemory, fac: FacilityMemory) {
        this.roomName = roomName;
        this.memory = memory;
        this.fac = fac;

        this.storage = Game.getObjectById<StructureStorage>(fac.storageId);
        Carry.entities[roomName] = this;
    }

    public setMove(value: Move) {
        this.move = value;
    }

    set isNewCarry(value: boolean) {
        this._isNewCarry = value;
    }

    protected spawnCreeps(): void {
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
                carry: {
                    taskRecordList: [],
                    roomName: this.roomName,
                    hasBusyTask: false
                }
            },
            name: creepName,
            priority: 0,
            spawnNames: this.fac.spawnNames
        })

        this.memory.creepNameList.push(creepName);
    }

    public run(): void {
        let nameSet = {}
        for (let creepName of this.memory.creepNameList) {
            if (nameSet[creepName]) {
                console.log(`creep name duplicate: ${this.roomName} ${creepName}`);
                continue;
            }
            nameSet[creepName] = true
            let creep = Game.creeps[creepName];
            if (!Game.creeps[creepName] || !creep) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creepMemory = creep.memory.carry;

            // arrange
            if (!creepMemory.hasBusyTask) {
                this.arrange(creep);
            }

            if (creepMemory.taskRecordList.length == 0) {
                continue;
                // if (creep.store.getUsedCapacity() == 0) {
                //     continue;
                // }
                //
                // // should not execute here
                // if (!this.storage) {
                //     continue;
                // }
                // if (creep.pos.getRangeTo(this.storage) == 1) {
                //     for (let resourceType in creep.store) {
                //         creep.transfer(this.storage, <ResourceConstant>resourceType, creep.store.getUsedCapacity(<ResourceConstant>resourceType));
                //     }
                //     continue;
                // }
                // if (this.move) {
                //     this.move.reserveMove(creep, this.storage.pos, 1);
                // } else {
                //     creep.moveTo(this.storage, {
                //         visualizePathStyle: {
                //             stroke: '#ffffff'
                //         },
                //         costCallback: function (roomName, costMatrix) {
                //             if (roomName == "W7N24") {
                //                 for (let x = 0; x < 50; x++) {
                //                     costMatrix.set(x, 0, 255)
                //                     costMatrix.set(x, 1, 0)
                //                 }
                //             }
                //         }
                //     });
                // }
                // // let moveModule=Move.entities[this.roomName];
                // // if(moveModule){
                // //     moveModule.reserveMove(creep,this.storage.pos,1);
                // // }
                // continue;
            }

            // execute task
            let curTaskRecord = creepMemory.taskRecordList[0];
            let curTask = this.memory.taskMap[curTaskRecord.taskId];
            if (!curTask) {
                this.finishTask(creepName, 0, 0);
                continue;
            }
            let target = Game.getObjectById<ObjectWithPos>(curTask.objId);
            if (!target) {
                this.finishTask(creepName, 0, 0);
                continue;
            }
            if (curTask.carryType == "output") {
                if (this.move) {
                    this.move.reserveMove(creep, target.pos, 1);
                } else {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        },
                        costCallback: function (roomName, costMatrix) {
                            if (roomName == "W7N24") {
                                for (let x = 0; x < 50; x++) {
                                    costMatrix.set(x, 0, 255)
                                    costMatrix.set(x, 1, 0)
                                }
                            }
                        }
                    });
                }
                let res = creep.withdraw(<Structure | Ruin | Tombstone>target, curTask.resourceType, curTaskRecord.reserved);
                if (res == ERR_NOT_ENOUGH_RESOURCES) {
                    res = creep.withdraw(<Structure | Ruin | Tombstone>target, curTask.resourceType);
                }
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved)
                }
                continue;
            }
            if (curTask.carryType == "input") {
                if (creep.store.getUsedCapacity(curTask.resourceType) == 0) {
                    if (!this.storage || this.storage.store.getUsedCapacity(curTask.resourceType) == 0) {
                        this.finishTask(creepName, 0, curTaskRecord.reserved);
                        continue;
                    }
                    if (creep.pos.getRangeTo(this.storage) == 1) {
                        creep.withdraw(this.storage, curTask.resourceType,
                            Math.min(curTaskRecord.reserved, this.storage.store.getUsedCapacity(curTask.resourceType)))
                        continue;
                    }
                    if (this.move) {
                        this.move.reserveMove(creep, this.storage.pos, 1);
                    } else {
                        creep.moveTo(this.storage, {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            },
                            costCallback: function (roomName, costMatrix) {
                                if (roomName == "W7N24") {
                                    for (let x = 0; x < 50; x++) {
                                        costMatrix.set(x, 0, 255)
                                        costMatrix.set(x, 1, 0)
                                    }
                                }
                            }
                        });
                    }
                    continue;
                }
                if (this.move) {
                    this.move.reserveMove(creep, target.pos, 1);
                } else {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        },
                        costCallback: function (roomName, costMatrix) {
                            if (roomName == "W7N24") {
                                for (let x = 0; x < 50; x++) {
                                    costMatrix.set(x, 0, 255)
                                    costMatrix.set(x, 1, 0)
                                }
                            }
                        }
                    });
                }
                if (creep.pos.getRangeTo(target) <= 1) {
                    let maxTranAmount = Math.min(creep.store.getUsedCapacity(curTask.resourceType),
                        20)
                    let res = creep.transfer(<AnyCreep | Structure>target, curTask.resourceType);
                    this.finishTask(creepName, 0, curTaskRecord.reserved)
                }
                continue;
            }
            if (curTask.carryType == "pickup") {
                if (this.move) {
                    this.move.reserveMove(creep, target.pos, 1);
                } else {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        },
                        costCallback: function (roomName, costMatrix) {
                            if (roomName == "W7N24") {
                                for (let x = 0; x < 50; x++) {
                                    costMatrix.set(x, 0, 255)
                                    costMatrix.set(x, 1, 0)
                                }
                            }
                        }
                    });
                }
                let res = creep.pickup(<Resource>target);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved)
                }
                continue;
            }
        }
        this.spawnCreeps()
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            if (!Game.getObjectById(task.objId)) {
                delete this.memory.taskMap[taskId];
            }
            if (!task.id) {
                task.id = taskId;
            }
        }
    }

    protected runNew(): void {
        this.memory.creepNameList.forEach(name => {
            let creep = Game.creeps[name];
            let creepMemory = creep.memory.carry;
            if (!creepMemory.logicTaskId) {
                return;
            }
            let task = this.memory.logicTaskMap[creepMemory.logicTaskId];
            let step = task.steps[creepMemory.stepIdx];
            switch (step.type) {
                case "carry":
                    switch (creepMemory.status) {
                        case "first":
                            let fromObj = Game.getObjectById<ObjectWithPos>(step.fromId);
                            let res = step.fromType == "withdraw"
                                  ? creep.withdraw(<Structure | Tombstone | Ruin>fromObj, task.resourceType)
                                : creep.pickup(<Resource>fromObj);
                            if (res == OK) {
                                creepMemory.status = "second";
                            } else {
                                this.move.reserveMove(creep, fromObj.pos, 1)
                            }
                            break;
                        case "second":
                            let toObj = Game.getObjectById<AnyCreep | Structure>(step.toId);
                            if (creep.transfer(toObj, task.resourceType) == OK) {
                                creepMemory.status = null;
                                creepMemory.stepIdx = null;
                                creepMemory.logicTaskId = null;
                                step.reserve -= creepMemory.reserve;
                                step.amount -= creepMemory.reserve;
                            } else {
                                this.move.reserveMove(creep, toObj.pos, 1)
                            }
                            break;


                    }

            }
        });

    }

    protected arrangeCreep() {

    }

    protected arrangeStep(task: LogicCarryTask): void {
        task.steps = [];
        for (const name of this.memory.creepNameList) {
            let creep = Game.creeps[name];
            if (creep.memory.carry.logicTaskId) {
                continue;
            }
            switch (task.carryType) {
                case "output":
                case "pickup":
                    if (creep.store.getFreeCapacity() > 0) {
                        task.steps.push({
                            type: "carry",
                            fromId: task.objId,
                            toId: this.storage ? this.storage.id : null,
                            fromType: task.carryType == "pickup" ? "pickup" : "withdraw",
                            amount: task.amount,
                            reserve: 0
                        })
                    }
                    break;
                case "input":
                    if (creep.store.getUsedCapacity(task.resourceType) > 0) {
                        task.steps.push({
                            type: "carry",
                            fromId: null,
                            toId: task.objId,
                            fromType: null,
                            amount: task.amount,
                            reserve: 0
                        })
                        break;
                    }

                    if (this.storage && this.storage.store.getUsedCapacity(task.resourceType) > 0) {
                        task.steps.push({
                            type: "carry",
                            fromId: this.storage.id,
                            toId: task.objId,
                            fromType: "withdraw",
                            amount: task.amount,
                            reserve: 0
                        })
                    }
                    break;
            }
            if (task.steps.length) {
                return;
            }
        }
    }

    protected arrange(creep: Creep): void {
        let creepMemory = creep.memory.carry;
        if (creepMemory.hasBusyTask) {
            return;
        }

        creep.memory.carry.taskRecordList = []
        let taskList: CarryTask[] = [];

        //1. has resource
        if (creep.store.getUsedCapacity()) {
            for (let type in creep.store) {
                let storeAmount = creep.store.getUsedCapacity(<ResourceConstant>type);
                if (!storeAmount) {
                    continue
                }
                for (let taskId in this.memory.taskMap) {
                    let task = this.memory.taskMap[taskId];
                    if (task.reserved >= task.amount) {
                        continue;
                    }
                    if (task.carryType != "input" || task.resourceType != type) {
                        continue;
                    }
                    taskList.push(task);
                    // _.sortedIndexBy(taskList, task, (t) => {
                    //     let obj = Game.getObjectById<Structure | Creep>(task.objId);
                    //     if (!obj) {
                    //         return 255;
                    //     }
                    //     return creep.pos.getRangeTo(obj.pos);
                    // })
                }
                for (let task of taskList) {
                    let need = task.amount - task.reserved;
                    need = Math.min(need, storeAmount)
                    if (need <= 0) {
                        continue;
                    }
                    if (storeAmount <= 0) {
                        break;
                    }
                    storeAmount -= need;
                    this.takeTask(creep, task.id, need);
                }
                if (!taskList.length && this.storage && this.storage.store.getFreeCapacity(<ResourceConstant>type) > 0) {
                    let taskId = this.addCarryReq(this.storage, "input", <ResourceConstant>type, storeAmount)
                    this.takeTask(creep, taskId, storeAmount, false);
                }
            }
            return;
        }

        //2. hasn't resource
        let capAmount = creep.store.getFreeCapacity();
        if (capAmount == creep.store.getCapacity()) {
            for (let taskId in this.memory.taskMap) {
                let task = this.memory.taskMap[taskId];
                if (task.reserved >= task.amount) {
                    continue;
                }
                if (task.carryType == "input") {
                    continue;
                }
                taskList.push(task);
                // _.sortedIndexBy(taskList, task, (t) => {
                //     let obj = Game.getObjectById<Structure | Creep>(task.objId);
                //     if (!obj) {
                //         return 255;
                //     }
                //     return creep.pos.getRangeTo(obj.pos);
                // })
            }
            for (let task of taskList) {
                let need = task.amount - task.reserved;
                need = Math.min(need, capAmount)
                if (need <= 0) {
                    continue;
                }
                if (capAmount <= 0) {
                    break;
                }
                capAmount -= need;
                this.takeTask(creep, task.id, need);
            }
            if (taskList.length) {
                return;
            }
        }

        if (!this.storage) {
            return;
        }

        // 3. has no task
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            if (task.reserved >= task.amount) {
                continue;
            }
            if (task.carryType != "input") {
                continue;
            }

            taskList.push(task);
            // _.sortedIndexBy(taskList, task, (t) => {
            //     let obj = Game.getObjectById<Structure | Creep>(task.objId);
            //     if (!obj) {
            //         return 255;
            //     }
            //     return creep.pos.getRangeTo(obj.pos);
            // })
        }
        for (let task of taskList) {
            if (this.storage.store.getUsedCapacity(task.resourceType) <= 0) {
                continue;
            }
            let need = task.amount - task.reserved;
            need = Math.min(need, capAmount)
            let storageTaskId = this.addCarryReq(this.storage, "output", task.resourceType, capAmount)
            this.takeTask(creep, storageTaskId, capAmount, false);
            this.takeTask(creep, task.id, need);
            break;
        }
    }

    protected recoveryCreep(creepName: string): void {
        if (Memory.creeps[creepName]) {
            let carryCreepMemory = Memory.creeps[creepName].carry;
            for (let i = 0, len = carryCreepMemory.taskRecordList.length; i < len; i++) {
                let finishAmount = 0;
                if (!carryCreepMemory.taskRecordList[i].needRec) {
                    finishAmount = carryCreepMemory.taskRecordList[i].reserved;
                }
                this.finishTask(creepName, i, finishAmount);
            }
            delete Memory.creeps[creepName];
        }

        _.remove(this.memory.creepNameList, function (e) {
            return e == creepName;

        })


    }

    public addCarryReqNew(obj: ObjectWithPos,
                          carryType: CarryTaskType,
                          resourceType: ResourceConstant,
                          amount: number): string {
        let taskId = `${obj.id}#${carryType}#${resourceType}`;
        if (!this.memory.logicTaskMap[taskId]) {
            this.memory.logicTaskMap[taskId] = {
                id: taskId,
                objId: obj.id,
                resourceType: resourceType,
                carryType: carryType,
                amount: amount,
                steps: []
            }
            return taskId;
        }
        this.memory.taskMap[taskId].amount = amount;
        return taskId;
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
        if (this._isNewCarry) {
            return this.addCarryReqNew(obj, carryType, resourceType, amount);
        }
        let taskId = `${obj.id}#${carryType}#${resourceType}`;
        if (!this.memory.taskMap[taskId]) {
            this.memory.taskMap[taskId] = {
                id: taskId,
                objId: obj.id,
                amount: amount,
                reserved: 0,
                resourceType: resourceType,
                carryType: carryType
            }
            return taskId;
        }
        this.memory.taskMap[taskId].amount = amount;
        return taskId;
    }

    protected isBusyTask(taskId: string): boolean {
        let task = this.memory.taskMap[taskId];
        return task.objId != this.fac.storageId;
    }

    protected takeTask(creep: Creep, taskId: string, amount: number, needRec: boolean = true): void {
        let task = this.memory.taskMap[taskId];
        if (!task) {
            console.log(this.roomName + " null task");
            return;
        }
        creep.memory.carry.taskRecordList.push({
            taskId: taskId,
            reserved: amount,
            needRec: needRec
        });
        task.reserved += amount;
        creep.say(task.carryType + "!");
        if (this.isBusyTask(taskId)) {
            creep.memory.carry.hasBusyTask = true;
        }
    }

    protected finishTask(creepName: string, index: number, finishAmount: number): void {
        let carryCreepMemory = Memory.creeps[creepName].carry;
        let taskId = carryCreepMemory.taskRecordList[index].taskId;
        let task = this.memory.taskMap[taskId];
        if (task) {
            let reserved = carryCreepMemory.taskRecordList[index].reserved;
            task.reserved -= reserved;
        }

        carryCreepMemory.taskRecordList.splice(index, 1);
        carryCreepMemory.hasBusyTask = false;
        for (let value of carryCreepMemory.taskRecordList) {
            if (this.isBusyTask(value.taskId)) {
                carryCreepMemory.hasBusyTask = true;
                break;
            }
        }

        if (finishAmount) {
            task.amount -= finishAmount;
            if (task.amount <= 0) {
                delete this.memory.taskMap[taskId];
            }
        }
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
            room.visual.text(task.amount + " " + task.reserved, obj.pos, {
                font: 0.25
            })
        }
        for (let creepName of this.memory.creepNameList) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            if (creep.memory.carry.taskRecordList.length == 0) {
                continue;
            }
            let task = this.memory.taskMap[creep.memory.carry.taskRecordList[0].taskId];
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

    public checkReserved(): void {
        let reservedMap = {};
        for (let creepName of this.memory.creepNameList) {
            let creep = Game.creeps[creepName];
            let creepMemory = creep.memory.carry;
            for (let taskRecord of creepMemory.taskRecordList) {
                let reserved = reservedMap[taskRecord.taskId];
                if (!reserved) {
                    reserved = 0;
                }
                reserved += taskRecord.reserved;
            }
        }
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            let reserved = reservedMap[taskId];
            if (!reserved) {
                reserved = 0;
            }
            if (task.reserved != reserved) {
                console.log(`[CheckReserved] ${this.roomName} ${taskId} ${task.reserved} ${reserved}`)
                task.reserved = reserved
            }
        }
    }

    public getNearByEnergyPoint(creep: Creep): Structure {


        return null
    }
}
