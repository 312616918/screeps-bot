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

}

type CarryTask = {
    objId: string;
    roomName: RoomName;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;

}

/**
 * creep存储携带信息
 */
export type CarryCreepMemory = {
    //任务列表，第一个为当前执行任务
    taskRecordList: {
        taskId: string;
        reserved: number;
    }[];
    available: {
        [type in ResourceConstant]?: number
    };
    // capacity:number;
    roomName: RoomName;

    hasBusyTask: boolean;
}

export class Carry {

    protected readonly roomName: RoomName;
    protected storage: StructureStorage;
    protected memory: CarryMemory;
    protected fac: FacilityMemory;
    private move: Move;

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
                    available: {},
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
        for (let creepName of this.memory.creepNameList) {
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            if (!creep) {
                console.log("undefined carry creep:{}", creepName);
                this.recoveryCreep(creepName);
                continue;
            }
            let creepMemory = creep.memory.carry;

            if (!creepMemory.hasBusyTask) {
                this.arrange(creep);
            }
            if (creepMemory.taskRecordList.length == 0) {
                if (creep.store.getUsedCapacity() == 0) {
                    continue;
                }
                if (!this.storage) {
                    continue;
                }
                if (creep.pos.getRangeTo(this.storage) == 1) {
                    for (let resourceType in creep.store) {
                        creep.transfer(this.storage, <ResourceConstant>resourceType, creep.store.getUsedCapacity(<ResourceConstant>resourceType));
                    }
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
                // let moveModule=Move.entities[this.roomName];
                // if(moveModule){
                //     moveModule.reserveMove(creep,this.storage.pos,1);
                // }
                continue;
            }

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
                let maxTranAmount = Math.min(creep.store.getUsedCapacity(curTask.resourceType),
                    20)
                let res = creep.transfer(<AnyCreep | Structure>target, curTask.resourceType);
                if (res != ERR_NOT_IN_RANGE) {
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
        }
    }

    protected arrange(creep: Creep): void {
        let creepMemory = creep.memory.carry;
        if (creepMemory.hasBusyTask) {
            return;
        }
        let closestTaskId = "";
        let dis = -1;
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            if (task.reserved >= task.amount) {
                continue;
            }
            if (task.carryType == "pickup" || task.carryType == "output") {
                if (creep.store.getUsedCapacity() != 0) {
                    continue;
                }
            }
            if (task.carryType == "input" && creep.store.getUsedCapacity(task.resourceType) == 0) {
                if (!this.storage || this.storage.store.getUsedCapacity(task.resourceType) == 0) {
                    continue;
                }
            }
            let obj = Game.getObjectById<Structure | Creep>(task.objId);
            if (!obj) {
                continue
            }
            let taskPos = obj.pos;
            let tmpDis = creep.pos.getRangeTo(taskPos);
            if (dis < 0 || dis > tmpDis) {
                dis = tmpDis;
                closestTaskId = taskId;
            }
            // this.takeTask(creep, taskId, creep.store.getCapacity());
            // break;
        }
        if (dis > 0) {
            this.takeTask(creep, closestTaskId, creep.store.getCapacity());
        }

    }

    protected recoveryCreep(creepName: string): void {
        if (Memory.creeps[creepName]) {
            let carryCreepMemory = Memory.creeps[creepName].carry;
            for (let i = 0, len = carryCreepMemory.taskRecordList.length; i < len; i++) {
                this.finishTask(creepName, i, 0);
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
                       amount: number): void {
        if (!obj || !carryType || !resourceType || amount <= 0) {
            return;
        }
        let roomName = <RoomName>obj.pos.roomName;
        if (roomName != this.roomName) {
            console.log("not in one room" + roomName + "  " + this.roomName)
            return;
        }
        let taskId = obj.id + "#" + carryType + "#" + resourceType;
        if (!this.memory.taskMap[taskId]) {
            this.memory.taskMap[taskId] = {
                objId: obj.id,
                roomName: roomName,
                amount: amount,
                reserved: 0,
                resourceType: resourceType,
                carryType: carryType
            }
            return;
        }
        this.memory.taskMap[taskId].amount = amount;
    }

    protected isBusyTask(taskId: string): boolean {
        let task = this.memory.taskMap[taskId];
        return task.objId != this.fac.storageId;
    }

    protected takeTask(creep: Creep, taskId: string, amount: number): void {
        let task = this.memory.taskMap[taskId];
        creep.memory.carry.taskRecordList.push({
            taskId: taskId,
            reserved: amount
        });
        if (!creep.memory.carry.available[task.resourceType]) {
            creep.memory.carry.available[task.resourceType] = 0;
        }
        switch (task.carryType) {
            case "output":
            case "pickup":
                creep.memory.carry.available[task.resourceType] += amount;
                break;
            case "input":
                creep.memory.carry.available[task.resourceType] -= amount;
                break;
        }
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

            switch (task.carryType) {
                case "output":
                case "pickup":
                    carryCreepMemory.available[task.resourceType] -= reserved;
                    break;
                case "input":
                    carryCreepMemory.available[task.resourceType] += reserved;
                    break;
            }
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
}
