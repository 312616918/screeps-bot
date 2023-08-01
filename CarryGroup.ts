import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";
import {roomConfigMap, RoomName} from "./Config";


/**
 * 存储结构
 */
export type CarryMemory = {
    //任务列表
    taskMap: {
        [taskId: string]: CarryTask;
    },
    storageTaskMap: {
        [resourceType: string]: string[];
    }
} & GroupMemory;

type CarryTask = {
    id: string;
    objId: string;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;
    priority: number;
}

/**
 * creep存储携带信息
 */
export type CarryCreepMemory = {
    taskRecordList: {
        taskId: string;
        reserved: number;
        needRec: boolean;
    }[];
}

type TaskArg = {
    task: CarryTask;
    amount: number;
    needRec: boolean;
}


export class CarryGroup extends BaseGroup<CarryMemory> {

    protected moduleName: string = "carry";

    protected getSpawnConfigList(): SpawnConfig[] {
        if (Game.time % 100 == 0) {
            this.memory.taskMap = {}
            this.memory.storageTaskMap = {}
        }
        let config = roomConfigMap[this.roomName].carry;
        let partNum = config.partNum;
        if(this.roomFacility.isInLowEnergy()){
            partNum = Math.min(partNum, 1);
        }
        let body: BodyPartConstant[] = [];
        for (let i = 0; i < partNum; i++) {
            body.push(CARRY);
            body.push(CARRY);
            body.push(MOVE);
        }
        return [
            {
                body: body,
                memory: {
                    module: this.moduleName,
                    carry: {
                        taskRecordList: []
                    }
                },
                num: config.carryNum
            }
        ];
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.carry;
        let creepName = creep.name;
        if (creepMemory.taskRecordList.length == 0) {
            this.arrange(creep)
            if (creepMemory.taskRecordList.length == 0) {
                return;
            }
        }
        let taskRecord = creepMemory.taskRecordList[0];
        let task = this.memory.taskMap[taskRecord.taskId];
        if (!task) {
            this.finishTask(creepMemory, 0);
            return;
        }
        let target = Game.getObjectById<ObjectWithPos>(task.objId);
        if (!target) {
            this.finishTask(creepMemory, 0);
            return;
        }
        if (task.carryType == "output") {
            this.move.reserveMove(creep, target.pos, 1);
            let res = creep.withdraw(<Structure | Ruin | Tombstone>target, task.resourceType, taskRecord.reserved);
            if (res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_FULL) {
                res = creep.withdraw(<Structure | Ruin | Tombstone>target, task.resourceType);
            }
            if (res != ERR_NOT_IN_RANGE) {
                this.finishTask(creepMemory, 0);
            }
            return;
        }
        if (task.carryType == "input") {
            this.move.reserveMove(creep, target.pos, 1);
            let res = creep.transfer(<AnyCreep | Structure>target, task.resourceType, taskRecord.reserved)
            if (res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_FULL) {
                res = creep.transfer(<AnyCreep | Structure>target, task.resourceType)
            }
            if (res != ERR_NOT_IN_RANGE) {
                this.finishTask(creepMemory, 0)
            }
            return;
        }
        if (task.carryType == "pickup") {
            this.move.reserveMove(creep, target.pos, 1);
            let res = creep.pickup(<Resource>target);
            if (res != ERR_NOT_IN_RANGE) {
                this.finishTask(creepMemory, 0);
            }
            return;
        }
    }


    protected finishTask(carryCreepMemory: CarryCreepMemory, index: number): void {
        let record = carryCreepMemory.taskRecordList[index];
        carryCreepMemory.taskRecordList.splice(index, 1);
        let taskId = record.taskId;
        let task = this.memory.taskMap[taskId];
        if (!task) {
            return;
        }
        let reserved = record.reserved;
        task.amount -= reserved;
        task.reserved -= reserved;
        if (task.amount < 0) {
            task.amount = 0;
        }
        //结束任务，删除task
        if (task.amount <= 0) {
            delete this.memory.taskMap[taskId];
            let taskIdList = this.memory.storageTaskMap[task.resourceType];
            if (taskIdList) {
                let idx = taskIdList.indexOf(taskId);
                if (idx != -1) {
                    taskIdList.splice(idx, 1);
                }
            }
        }
    }

    protected recycleTask(carryCreepMemory: CarryCreepMemory, index: number): void {
        let record = carryCreepMemory.taskRecordList[index];
        carryCreepMemory.taskRecordList.splice(index, 1);
        let taskId = record.taskId;
        let task = this.memory.taskMap[taskId];
        if (!task) {
            return;
        }
        let reserved = record.reserved;
        task.reserved += reserved;
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
        let carryCreepMemory = creepMemory.carry;
        carryCreepMemory.taskRecordList.forEach((record, index) => {
            if (record.needRec) {
                this.recycleTask(carryCreepMemory, index);
            } else {
                this.finishTask(carryCreepMemory, index);
            }
        });
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

    protected takeClosestTask(creep: Creep, taskArgList: TaskArg[]): void {
        taskArgList.sort((a, b) => {
            if (a.task.priority != b.task.priority) {
                return b.task.priority - a.task.priority;
            }
            let objA = Game.getObjectById<ObjectWithPos>(a.task.objId);
            let objB = Game.getObjectById<ObjectWithPos>(b.task.objId);
            if (!objA || !objB) {
                return 0;
            }
            let aPos = objA.pos;
            let bPos = objB.pos;
            return creep.pos.getRangeTo(aPos) - creep.pos.getRangeTo(bPos);
        });
        let taskArg = taskArgList[0];
        this.takeTask(creep, taskArg.task, taskArg.amount, taskArg.needRec);
    }

    protected takeTask(creep: Creep, task: CarryTask, amount: number, needRec: boolean): void {
        let creepMemory = creep.memory.carry;
        let record = {
            taskId: task.id,
            reserved: amount,
            needRec: needRec
        }
        creepMemory.taskRecordList.push(record);
        task.reserved += amount;
        creep.say(task.carryType + "!");
    }


    protected arrange(creep: Creep): void {
        // console.log("arrange", creep.name)

        let taskArgList: TaskArg[] = [];
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
                    if (task.resourceType != type) {
                        continue;
                    }
                    if (task.amount <= task.reserved) {
                        continue;
                    }
                    if (task.carryType != "input") {
                        continue;
                    }
                    // let reserveAmount = Math.min(storeAmount, task.amount - task.reserved);
                    // this.takeTask(creep, task, storeAmount, true);
                    taskArgList.push({
                        task: task,
                        amount: storeAmount,
                        needRec: true
                    });
                }
                if (taskArgList.length > 0) {
                    this.takeClosestTask(creep, taskArgList);
                    return;
                }
                //storage
                if (this.getStorageFreeAmount(<ResourceConstant>type) > 0) {
                    let taskId = this.addCarryReq(this.roomFacility.getStorage(), "input", <ResourceConstant>type, storeAmount, 0);
                    if (!taskId) {
                        continue;
                    }
                    creep.say("storage")
                    this.takeTask(creep, this.memory.taskMap[taskId], storeAmount, false);
                    return;
                }
            }
        }

        //2. hasn't resource
        let capAmount = creep.store.getFreeCapacity();
        if (capAmount == creep.store.getCapacity()) {
            for (let taskId in this.memory.taskMap) {
                let task = this.memory.taskMap[taskId];
                if (task.carryType != "output" && task.carryType != "pickup") {
                    continue;
                }
                if (task.amount <= task.reserved) {
                    continue;
                }
                // let reserveAmount = Math.min(capAmount, task.amount - task.reserved);
                // this.takeTask(creep, task, capAmount, true);
                // return;
                taskArgList.push({
                    task: task,
                    amount: capAmount,
                    needRec: true
                });
            }
            if (taskArgList.length > 0) {
                this.takeClosestTask(creep, taskArgList);
                return;
            }
            for (let taskId in this.memory.taskMap) {
                let task = this.memory.taskMap[taskId];
                if (task.carryType != "input") {
                    continue;
                }
                if (task.amount <= task.reserved) {
                    continue;
                }
                if (this.getStorageAvailableAmount(task.resourceType) <= 0) {
                    continue;
                }
                let storageTaskId = this.addCarryReq(this.roomFacility.getStorage(), "output", task.resourceType,
                    capAmount, 0);
                if (!storageTaskId) {
                    continue;
                }
                this.takeTask(creep, this.memory.taskMap[storageTaskId], capAmount, false);
                this.takeTask(creep, task, capAmount, true);
                creep.say("take from storage");
            }
        }
    }

    private getStorageAvailableAmount(resourceType: ResourceConstant): number {
        let storage = this.roomFacility.getStorage();
        if (!storage) {
            return 0;
        }
        if (!this.memory.storageTaskMap) {
            this.memory.storageTaskMap = {};
        }
        let taskIdList = this.memory.storageTaskMap[resourceType];
        let usedAmount = storage.store.getUsedCapacity(resourceType);
        if (!taskIdList || taskIdList.length == 0) {
            return usedAmount;
        }
        taskIdList.forEach(taskId => {
            let task = this.memory.taskMap[taskId];
            if (!task) {
                return;
            }
            if (task.carryType != "output" || task.resourceType != resourceType) {
                return;
            }
            usedAmount -= task.amount;
        })
        return usedAmount;
    }


    private getStorageFreeAmount(resourceType: ResourceConstant): number {
        let storage = this.roomFacility.getStorage();
        if (!storage) {
            return 0;
        }
        if (!this.memory.storageTaskMap) {
            this.memory.storageTaskMap = {};
        }
        let taskIdList = this.memory.storageTaskMap[resourceType];
        let freeAmount = storage.store.getFreeCapacity(resourceType);
        if (!taskIdList || taskIdList.length == 0) {
            return freeAmount;
        }
        taskIdList.forEach(taskId => {
            let task = this.memory.taskMap[taskId];
            if (!task) {
                return;
            }
            if (task.carryType != "input") {
                return;
            }
            freeAmount -= task.amount;
        });
        return freeAmount;
    }

    public addCarryReq(obj: ObjectWithPos,
                       carryType: CarryTaskType,
                       resourceType: ResourceConstant,
                       amount: number,
                       priority: number): string {
        if (!obj || !carryType || !resourceType || amount <= 0) {
            return null;
        }
        let roomName = <RoomName>obj.pos.roomName;
        if (roomName != this.roomName) {
            console.log("not in one room" + roomName + "  " + this.roomName)
            return null;
        }
        let taskId = `${obj.id}#${carryType}#${resourceType}`;
        let storage = this.roomFacility.getStorage();
        if (storage && obj.id == storage.id) {
            this.memory.storageTaskMap[resourceType] = this.memory.storageTaskMap[resourceType] || [taskId];
        }
        if (!this.memory.taskMap[taskId]) {
            this.memory.taskMap[taskId] = {
                id: taskId,
                objId: obj.id,
                resourceType: resourceType,
                carryType: carryType,
                amount: amount,
                reserved: 0,
                priority: priority
            }
            return taskId;
        }
        this.memory.taskMap[taskId].amount = amount;
        return taskId;
    }
}