"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Carry = void 0;
const baseModule_1 = require("./baseModule");
const config_1 = require("./config");
const spawn_1 = require("./spawn");
class Carry extends baseModule_1.BaseModule {
    constructor(roomName) {
        super(roomName);
        if (!Memory.carry) {
            Memory.carry = {};
        }
        if (!Memory.carry[this.roomName]) {
            Memory.carry[this.roomName] = {
                creepNameSet: new Set(),
                taskMap: {}
            };
        }
        let roomMemory = Memory.carry[this.roomName];
        this.creepNameSet = roomMemory.creepNameSet;
        this.taskMap = roomMemory.taskMap;
    }
    spawnCreeps() {
        let creepPlan = config_1.config.carry.creepPlan;
        let plan = creepPlan[this.roomName];
        if (this.creepNameSet.size >= plan.amount) {
            return;
        }
        let bodyList = [];
        for (let i = 0; i < plan.amount; i++) {
            bodyList = bodyList.concat([CARRY, CARRY, MOVE]);
        }
        let creepName = "carry-" + Game.time;
        spawn_1.Spawn.reserveCreep({
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
            spawnNames: []
        });
        this.creepNameSet.add(creepName);
    }
    run() {
        this.spawnCreeps();
        for (let creepName of this.creepNameSet) {
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            let creepMemory = creep.memory.carry;
            if (!creepMemory.hasBusyTask) {
                this.arrange(creep);
            }
            if (creepMemory.taskRecordList.length == 0) {
                continue;
            }
            let curTaskRecord = creepMemory.taskRecordList[0];
            let curTask = this.taskMap[curTaskRecord.taskId];
            let target = Game.getObjectById(curTask.objId);
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });
            if (curTask.carryType == "output") {
                let res = creep.withdraw(target, curTask.resourceType, curTaskRecord.reserved);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved);
                }
                continue;
            }
            if (curTask.carryType == "input") {
                let res = creep.transfer(target, curTask.resourceType, curTaskRecord.reserved);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved);
                }
                continue;
            }
            if (curTask.carryType == "pickup") {
                let res = creep.pickup(target);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved);
                }
                continue;
            }
        }
    }
    arrange(creep) {
        for (let taskId in this.taskMap) {
            let task = this.taskMap[taskId];
            let creepMemory = creep.memory.carry;
            if (creepMemory.roomName != task.roomName) {
                continue;
            }
            if (creepMemory.hasBusyTask) {
                continue;
            }
            this.takeTask(creep, taskId, creep.store.getCapacity());
        }
    }
    recoveryCreep(creepName) {
        let carryCreepMemory = Memory.creeps[creepName].carry;
        for (let i = 0, len = carryCreepMemory.taskRecordList.length; i < len; i++) {
            this.finishTask(creepName, i, 0);
        }
        delete Memory.creeps[creepName];
        this.creepNameSet.delete(creepName);
    }
    addCarryReq(obj, carryType, resourceType, amount) {
        if (!obj || !carryType || !resourceType || amount <= 0) {
            return;
        }
        let roomName = obj.pos.roomName;
        let taskId = obj.id + "#" + carryType + "#" + resourceType;
        if (!this.taskMap[taskId]) {
            this.taskMap[taskId] = {
                objId: obj.id,
                roomName: roomName,
                amount: amount,
                reserved: 0,
                resourceType: resourceType,
                carryType: carryType
            };
        }
    }
    isBusyTask(taskId) {
        let task = this.taskMap[taskId];
        let fac = Memory.facility[task.roomName];
        return task.objId != fac.storageId;
    }
    takeTask(creep, taskId, amount) {
        let task = this.taskMap[taskId];
        creep.memory.carry.taskRecordList.push({
            taskId: taskId,
            reserved: amount
        });
        if (!creep.memory.carry.available[task.resourceType]) {
            creep.memory.carry.available[task.resourceType] = 0;
        }
        switch (task.carryType) {
            case "input":
            case "pickup":
                creep.memory.carry.available[task.resourceType] += amount;
                break;
            case "output":
                creep.memory.carry.available[task.resourceType] -= amount;
                break;
        }
        task.reserved += amount;
        creep.say(task.carryType + "!");
        if (this.isBusyTask(taskId)) {
            creep.memory.carry.hasBusyTask = true;
        }
    }
    finishTask(creepName, index, finishAmount) {
        let carryCreepMemory = Memory.creeps[creepName].carry;
        let taskId = carryCreepMemory.taskRecordList[index].taskId;
        let task = this.taskMap[taskId];
        let reserved = carryCreepMemory.taskRecordList[index].reserved;
        task.reserved -= reserved;
        switch (task.carryType) {
            case "input":
            case "pickup":
                carryCreepMemory.available[task.resourceType] -= reserved;
                break;
            case "output":
                carryCreepMemory.available[task.resourceType] += reserved;
                break;
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
                delete this.taskMap[taskId];
            }
        }
    }
}
exports.Carry = Carry;
//# sourceMappingURL=carry.js.map