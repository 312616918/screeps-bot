import {roomConfigMap, RoomName} from "./Config";
import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";
import * as _ from "lodash";

type CarryTaskV2 = {
    id: string;
    objId: string;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;
    priority: number;
    stepIdList: string[];
}
type CarryStep = {
    stepId: string;
    taskIdList: string[];
    fromObjId: string;
    toObjId: string;
    status: "wait_output" | "wait_input" | "doing";
    type: "transform" | "pickup_transform";
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;
    needRec: boolean;
}

type LinkStatus = {
    status: "free" | "wait_input" | "wait_output" | "wait_send_in" | "wait_send_out";
    reservedInput: number;
    reservedOutput: number;
    reservedSendIn: number;
    reservedSendOut: number;
    sendToLinkIdList: string[];
}


export type CarryMemoryV2 = {
    //任务列表
    taskMap: {
        [taskId: string]: CarryTaskV2;
    };
    stepMap: {
        [stepId: string]: CarryStep;
    };
    storageStepMap: {
        [resourceType: string]: string[];
    };
    linkStatusMap: {
        [linkId: string]: LinkStatus;
    }
} & GroupMemory;

type CarryRecord = {
    stepId: string;
    stage: "output" | "input" | "pickup";
    reserved: number;
    needRec: boolean;
}

/**
 * creep存储携带信息
 */
export type CarryCreepMemoryV2 = {
    stepRecordList: CarryRecord[];
}

type StepArg = {
    step: CarryStep;
    amount: number;
    needRec: boolean;
}

type TaskArg = {
    task: CarryTaskV2;
    objId: string;
    amount: number;
    distanceBias: number;
}


export class CarryGroupV2 extends BaseGroup<CarryMemoryV2> {

    protected moduleName: string = "carry";

    protected getSpawnConfigList(): SpawnConfig[] {
        if (Game.time % 100 == 0) {
            this.memory.taskMap = {}
            this.memory.stepMap = {}
            this.memory.linkStatusMap = {}
            this.memory.storageStepMap = {}
        }
        let config = roomConfigMap[this.roomName].carry;
        let partNum = config.partNum;
        if (this.roomFacility.isInLowEnergy()) {
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
        if (!creep.memory.carry_v2) {
            creep.memory.carry_v2 = {
                stepRecordList: []
            }
        }
        let creepMemory = creep.memory.carry_v2;
        if (!creepMemory.stepRecordList) {
            creepMemory.stepRecordList = [];
        }
        if (creepMemory.stepRecordList.length == 0) {
            this.arrange(creep)
            if (creepMemory.stepRecordList.length == 0) {
                return;
            }
        }
        let stepRecord = creepMemory.stepRecordList[0];
        let step = this.memory.stepMap[stepRecord.stepId];
        if (!step) {
            this.finishStep(creepMemory, 0);
            return;
        }
        //处理下一个
        if (creep.store.getUsedCapacity(step.resourceType) > 0) {
            stepRecord.stage = "input";
        }
        switch (stepRecord.stage) {
            case "output":
                let target = Game.getObjectById<ObjectWithPos>(step.fromObjId);
                if (!target) {
                    this.finishStep(creepMemory, 0);
                    return;
                }
                if (creep.pos.getRangeTo(target.pos) <= 1) {
                    creep.withdraw(<Structure | Ruin | Tombstone>target, step.resourceType);
                    stepRecord.stage = "input";
                    return;
                }
                this.move.reserveMove(creep, target.pos, 1);
                return;
            case "pickup":
                let pickupTarget = Game.getObjectById<Resource>(step.fromObjId);
                if (!pickupTarget) {
                    this.finishStep(creepMemory, 0);
                    return;
                }
                if (creep.pos.getRangeTo(pickupTarget.pos) <= 1) {
                    creep.pickup(pickupTarget);
                    stepRecord.stage = "input";
                    return;
                }
                this.move.reserveMove(creep, pickupTarget.pos, 1);
                return;
            case "input":
                let inputTarget = Game.getObjectById<AnyCreep | Structure>(step.toObjId);
                if (!inputTarget) {
                    this.finishStep(creepMemory, 0);
                    return;
                }
                if (creep.pos.getRangeTo(inputTarget.pos) <= 1) {
                    creep.transfer(inputTarget, step.resourceType);
                    this.finishStep(creepMemory, 0);
                    return;
                }
                this.move.reserveMove(creep, inputTarget.pos, 1);
                return;
        }
    }

    protected finishStep(creepMemory: CarryCreepMemoryV2, index: number): void {
        let record = creepMemory.stepRecordList[index];
        creepMemory.stepRecordList.splice(index, 1);
        let step = this.memory.stepMap[record.stepId];
        if (!step) {
            return;
        }
        let reserved = record.reserved;
        step.reserved -= reserved;
        step.amount -= reserved;
        if (step.amount < 0) {
            step.amount = 0;
        }
        for (let taskId of step.taskIdList) {
            if (step.amount == 0) {
                let stepIdList = this.memory.storageStepMap[step.resourceType];
                if (stepIdList) {
                    let idx = stepIdList.indexOf(taskId);
                    if (idx != -1) {
                        stepIdList.splice(idx, 1);
                    }
                }
                delete this.memory.stepMap[record.stepId];
                let task = this.memory.taskMap[taskId];
                if (!task) {
                    return;
                }
                delete this.memory.taskMap[taskId];
            }
        }
    }

    protected recycleStep(carryCreepMemory: CarryCreepMemoryV2, index: number): void {
        let record = carryCreepMemory.stepRecordList[index];
        carryCreepMemory.stepRecordList.splice(index, 1);
        let stepId = record.stepId;
        let step = this.memory.stepMap[stepId];
        if (!step) {
            return;
        }
        let reserved = record.reserved;
        step.reserved -= reserved;
        step.amount += reserved;
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
        let carryCreepMemory = creepMemory.carry_v2;
        carryCreepMemory.stepRecordList.forEach((record, index) => {
            if (record.needRec) {
                this.recycleStep(carryCreepMemory, index);
            } else {
                this.recycleStep(carryCreepMemory, index);
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
            let carryCreepMemory = creep.memory.carry_v2;
            if (!carryCreepMemory) {
                continue;
            }
            if (carryCreepMemory.stepRecordList.length == 0) {
                continue;
            }
            let posList = [creep.pos];
            for (let stepRecord of carryCreepMemory.stepRecordList) {
                let step = this.memory.stepMap[stepRecord.stepId];
                if (!step) {
                    continue;
                }
                let fromObj = Game.getObjectById<ObjectWithPos>(step.fromObjId);
                let toObj = Game.getObjectById<ObjectWithPos>(step.toObjId);
                if (fromObj) {
                    posList.push(fromObj.pos);
                }
                if (toObj) {
                    posList.push(toObj.pos);
                }
            }
            room.visual.poly(posList, {
                stroke: "red",
                lineStyle: "dashed"
            });
        }
        for (let linkId in this.memory.linkStatusMap) {
            let status = this.memory.linkStatusMap[linkId];
            if (!status) {
                continue;
            }
            let link = Game.getObjectById<StructureLink>(linkId);
            if (!link) {
                continue;
            }
            room.visual.text(status.status, link.pos, {
                font: 0.25,
                stroke: "0xffffff"
            })
            if (status.sendToLinkIdList.length > 0) {
                let sendToLink = Game.getObjectById<StructureLink>(status.sendToLinkIdList[0]);
                if (sendToLink) {
                    room.visual.line(link.pos, sendToLink.pos, {
                        color: "yellow",
                        lineStyle: "dashed"
                    })
                }
            }
        }
    }

    protected takeStep(creep: Creep, step: CarryStep, amount: number, needRec: boolean): void {
        let creepMemory = creep.memory.carry_v2;
        let stepRecord: CarryRecord = {
            stepId: step.stepId,
            stage: "output",
            reserved: amount,
            needRec: needRec
        }
        if (step.type == "pickup_transform") {
            stepRecord.stage = "pickup";
        }
        creepMemory.stepRecordList.push(stepRecord);
        step.reserved += amount;
        creep.say("🚚" + amount);
    }


    protected arrange(creep: Creep): void {
        let stepArgList: StepArg[] = [];
        for (let stepId in this.memory.stepMap) {
            let step = this.memory.stepMap[stepId];
            if (step.status != "doing") {
                continue;
            }
            if (step.amount <= step.reserved) {
                continue;
            }
            stepArgList.push({
                step: step,
                amount: step.amount,
                needRec: false
            })
        }
        if (stepArgList.length == 0) {
            return;
        }
        stepArgList.sort((a, b) => {
            let objA = Game.getObjectById<ObjectWithPos>(a.step.fromObjId);
            let objB = Game.getObjectById<ObjectWithPos>(b.step.fromObjId);
            if (!objA || !objB) {
                return 0;
            }
            let aPos = objA.pos;
            let bPos = objB.pos;
            return creep.pos.getRangeTo(aPos) - creep.pos.getRangeTo(bPos);
        });
        //补充顺路任务
        let stepArg = stepArgList[0];
        let toPos = Game.getObjectById<ObjectWithPos>(stepArg.step.toObjId).pos;
        stepArgList = _.filter(stepArgList, arg => {
            return arg.step.fromObjId == arg.step.fromObjId && arg.step.resourceType == stepArg.step.resourceType;
        }).sort((a, b) => {
            let objA = Game.getObjectById<ObjectWithPos>(a.step.toObjId);
            let objB = Game.getObjectById<ObjectWithPos>(b.step.toObjId);
            if (!objA || !objB) {
                return 0;
            }
            let aPos = objA.pos;
            let bPos = objB.pos;
            return toPos.getRangeTo(aPos) - toPos.getRangeTo(bPos);
        })
        let capacity = creep.store.getCapacity(stepArg.step.resourceType);
        let amount = 0;
        for (let arg of stepArgList) {
            console.log(`take step ${arg.step.stepId} ${arg.amount} ${arg.needRec}`)
            this.takeStep(creep, arg.step, arg.amount, arg.needRec);
            amount += arg.amount;
            if (amount >= capacity) {
                break
            }
        }
    }

    private getStorageAvailableAmount(resourceType: ResourceConstant): number {
        let storage = this.roomFacility.getStorage();
        if (!storage) {
            return 0;
        }
        if (!this.memory.storageStepMap) {
            this.memory.storageStepMap = {};
        }
        let stepIdList = this.memory.storageStepMap[resourceType];
        let usedAmount = storage.store.getUsedCapacity(resourceType);
        if (!stepIdList || stepIdList.length == 0) {
            return usedAmount;
        }
        stepIdList.forEach(stepId => {
            let step = this.memory.stepMap[stepId];
            if (!step) {
                return;
            }
            if (step.fromObjId != storage.id) {
                return;
            }
            usedAmount -= step.amount;
        })
        return usedAmount;
    }


    private getStorageFreeAmount(resourceType: ResourceConstant): number {
        let storage = this.roomFacility.getStorage();
        if (!storage) {
            return 0;
        }
        if (!this.memory.storageStepMap) {
            this.memory.storageStepMap = {};
        }
        let stepIdList = this.memory.storageStepMap[resourceType];
        let freeAmount = storage.store.getFreeCapacity(resourceType);
        if (!stepIdList || stepIdList.length == 0) {
            return freeAmount;
        }
        stepIdList.forEach(taskId => {
            let step = this.memory.stepMap[taskId];
            if (!step) {
                return;
            }
            if (step.toObjId != storage.id) {
                return;
            }
            freeAmount -= step.amount;
        });
        return freeAmount;
    }

    private getLinkPair(taskOutPut: CarryTaskV2, taskInput: CarryTaskV2): {
        outLink: StructureLink,
        inlink: StructureLink
    } {
        if (taskOutPut.resourceType != "energy") {
            return null;
        }
        if (this.roomFacility.getLinkList().length == 0) {
            return null;
        }
        let outLinkRcord = this.roomFacility.getClosestLink(taskOutPut.objId);
        let inLinkRecord = this.roomFacility.getClosestLink(taskInput.objId);
        if (outLinkRcord.distance > 5 || outLinkRcord.distance > 10) {
            return null;
        }
        let outLink = Game.getObjectById<StructureLink>(outLinkRcord.objId);
        let inLink = Game.getObjectById<StructureLink>(inLinkRecord.objId);
        if (!outLink || !inLink) {
            return null;
        }
        let midDistance = outLink.pos.findPathTo(inLink.pos, {
            ignoreCreeps: true
        }).length;
        let outObj = Game.getObjectById<ObjectWithPos>(taskOutPut.objId);
        let inObj = Game.getObjectById<ObjectWithPos>(taskInput.objId);
        if (!outObj || !inObj) {
            return null;
        }
        let fullDistance = outObj.pos.findPathTo(inLink.pos, {
            ignoreCreeps: true
        }).length;
        let fullLinkDistance = outLinkRcord.distance + inLinkRecord.distance + midDistance;
        if (fullLinkDistance + 10 > fullLinkDistance) {
            return null;
        }
        return {
            outLink: outLink,
            inlink: inLink
        }
    }

    private handleLink(link: StructureLink, type: "input" | "output") {
        let status = this.memory.linkStatusMap[link.id];
        console.log(`handleLink ${link.id} ${type} ${status}`)
        if (!status) {
            status = this.memory.linkStatusMap[link.id] = {
                status: "free",
                reservedInput: 0,
                reservedOutput: 0,
                reservedSendIn: 0,
                reservedSendOut: 0,
                sendToLinkIdList: []
            }
        }
        for (const rLink of this.roomFacility.getLinkList()) {
            if (rLink.id == link.id) {
                continue;
            }
            let rStatus = this.memory.linkStatusMap[rLink.id];
            if (!rStatus) {
                rStatus = this.memory.linkStatusMap[rLink.id] = {
                    status: "free",
                    reservedInput: 0,
                    reservedOutput: 0,
                    reservedSendIn: 0,
                    reservedSendOut: 0,
                    sendToLinkIdList: []
                }
            }
            if (rStatus.status != "free") {
                continue;
            }

            let amount = rLink.store.getUsedCapacity(RESOURCE_ENERGY);
            amount += rStatus.reservedInput;
            amount += rStatus.reservedSendIn;
            amount -= rStatus.reservedOutput;
            amount -= rStatus.reservedSendOut;
            if (type == "input") {
                if (amount < 700) {
                    continue;
                }
                rStatus.status = "wait_send_out";
                rStatus.reservedSendOut = 700;
                rStatus.sendToLinkIdList.push(link.id);
                console.log(`handleLink 1 ${type} ${link.id} ${rLink.id} ${amount}`)

                status.status = "wait_send_in";
                status.reservedSendIn = 700;
                return;
            }
            if (type == "output") {
                if (amount > 100) {
                    continue;
                }
                rStatus.status = "wait_send_in";
                rStatus.reservedSendIn = 700;
                console.log(`handleLink 1 ${type} ${link.id} ${rLink.id} ${amount}`)

                status.status = "wait_send_out";
                status.sendToLinkIdList.push(rLink.id);
                status.reservedOutput = 700;
                return;
            }
        }
        //没有可以发送的link，转移到storageLink
        let storage = this.roomFacility.getStorage();
        if (!storage) {
            return;
        }
        let storageLinkRecord = this.roomFacility.getClosestLink(storage.id);
        let storageLink = Game.getObjectById<StructureLink>(storageLinkRecord.objId);
        let storageStatus = this.memory.linkStatusMap[storageLink.id];
        if (!storageStatus || storageStatus.status != "free") {
            return;
        }
        console.log(`handleLink 2 ${type} ${link.id} ${storageLink.id}`)
        if (type == "input") {
            this.addStep(storage, storageLink, RESOURCE_ENERGY, 700, true);
            storageStatus.reservedInput = 700;
            storageStatus.reservedSendOut = 700;
            storageStatus.status = "wait_input";
            if (storageLink.id != link.id) {
                storageStatus.sendToLinkIdList.push(link.id);

                status.status = "wait_send_in";
                status.reservedSendIn = 700;
            }
            return;
        }
        if (type == "output") {
            this.addStep(storageLink, storage, RESOURCE_ENERGY, 700, true);
            storageStatus.reservedOutput = 700;
            storageStatus.reservedSendIn = 700;
            storageStatus.status = "wait_output";
            if (storageLink.id != link.id) {
                status.sendToLinkIdList.push(storageLink.id);

                status.status = "wait_send_out";
                status.reservedSendOut = 700;
            }
            return;
        }
    }


    private addStep(objOutPut: ObjectWithPos, objInput: ObjectWithPos, resourceType: ResourceConstant, amount: number, needRec: boolean): CarryStep {
        if (!objOutPut || !objInput || !resourceType || amount <= 0) {
            console.log("addStep error:" + objOutPut + " " + objInput + " " + resourceType + " " + amount)
            return null;
        }
        let stepId = `${objOutPut.id}_${objInput.id}_${resourceType}_${needRec}`;
        let step = this.memory.stepMap[stepId];
        if (!step) {
            let isDropResource = objOutPut instanceof Resource;
            step = this.memory.stepMap[stepId] = {
                stepId: stepId,
                taskIdList: [],
                fromObjId: objOutPut.id,
                toObjId: objInput.id,
                status: "doing",
                type: isDropResource ? "pickup_transform" : "transform",
                resourceType: resourceType,
                amount: amount,
                reserved: 0,
                needRec: needRec
            }
            let storage = this.roomFacility.getStorage();
            if (storage && (objOutPut.id == storage.id || objInput.id == storage.id)) {
                if (!this.memory.storageStepMap[resourceType]) {
                    this.memory.storageStepMap[resourceType] = [];
                }
                this.memory.storageStepMap[resourceType].push(stepId);
            }
        }
        step.amount = amount;

        return step;
    }

    public addCarryTask(obj: ObjectWithPos,
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
        let task = this.memory.taskMap[taskId];
        if (!task) {
            task = this.memory.taskMap[taskId] = {
                id: taskId,
                objId: obj.id,
                carryType: carryType,
                resourceType: resourceType,
                amount: amount,
                reserved: 0,
                priority: priority,
                stepIdList: []
            }
        }
        task.amount = amount;
        if (task.amount <= task.reserved) {
            return taskId;
        }
        let taskArgList: TaskArg[] = [];
        let closestLink = this.roomFacility.getClosestLink(obj.id);
        if (closestLink.objId && resourceType == RESOURCE_ENERGY && closestLink.distance < 5) {
            taskArgList.push({
                task: null,
                objId: closestLink.objId,
                amount: amount,
                distanceBias: 10
            })
        }

        if (carryType == "input") {
            if (this.getStorageAvailableAmount(resourceType) > amount) {
                taskArgList.push({
                    task: null,
                    objId: storage.id,
                    amount: amount,
                    distanceBias: 0
                })
            }
        }
        if (carryType == "output" || carryType == "pickup") {
            if (this.getStorageFreeAmount(resourceType) > amount) {
                taskArgList.push({
                    task: null,
                    objId: storage.id,
                    amount: amount,
                    distanceBias: 0
                })
            }
        }

        for (let taskId in this.memory.taskMap) {
            let otherTask = this.memory.taskMap[taskId];
            if (otherTask.resourceType != resourceType) {
                continue;
            }
            if (otherTask.amount <= otherTask.reserved || otherTask.amount <= 0) {
                continue;
            }
            if (carryType == "input") {
                if (otherTask.carryType != "output" && otherTask.carryType != "pickup") {
                    continue;
                }
                taskArgList.push({
                    task: otherTask,
                    objId: obj.id,
                    amount: amount,
                    distanceBias: 0
                });
                continue;
            }
            if (carryType == "output" || carryType == "pickup") {
                if (otherTask.carryType != "input") {
                    continue;
                }
                taskArgList.push({
                    task: otherTask,
                    objId: obj.id,
                    amount: amount,
                    distanceBias: 0
                });
                continue;
            }
        }
        if(taskArgList.length == 0){
            return taskId;
        }

        taskArgList.sort((a, b) => {
            let objA = Game.getObjectById<ObjectWithPos>(a.objId);
            let objB = Game.getObjectById<ObjectWithPos>(b.objId);
            if (!objA || !objB) {
                return 255;
            }
            let aPos = objA.pos;
            let bPos = objB.pos;
            let aDistance = aPos.getRangeTo(obj.pos) + a.distanceBias;
            let bDistance = bPos.getRangeTo(obj.pos) + b.distanceBias;
            return aDistance - bDistance;
        });
        console.log(JSON.stringify(taskArgList))
        let finalArg = taskArgList[0];
        let otherTask = finalArg.task;
        task.reserved += amount;
        if (finalArg.task == null) {
            if (finalArg.objId == closestLink.objId) {
                let link = Game.getObjectById<StructureLink>(finalArg.objId);
                if (carryType == "input") {
                    this.handleLink(link, "input")
                    this.addStep(link, obj, resourceType, amount, true)
                }
                if (carryType == "output" || carryType == "pickup") {
                    this.handleLink(link, "output")
                    this.addStep(obj, link, resourceType, amount, true)
                }
                return taskId;
            }
            if (finalArg.objId == storage.id) {
                if (carryType == "input") {
                    this.addStep(storage, obj, resourceType, amount, true);
                }
                if (carryType == "output" || carryType == "pickup") {
                    this.addStep(obj, storage, resourceType, amount, true);
                }
                return taskId;
            }
        }
        otherTask.reserved += amount;
        let otherTaskObj = Game.getObjectById<ObjectWithPos>(otherTask.objId);
        let step: CarryStep = null;
        if (carryType == "input") {
            step = this.addStep(otherTaskObj, obj, resourceType, amount, true);
        }
        if (carryType == "output" || carryType == "pickup") {
            step = this.addStep(obj, otherTaskObj, resourceType, amount, true);
        }
        if (step) {
            step.taskIdList = [taskId, otherTask.id];
        }
        return taskId;
    }

    public runLink(): void {
        let storage = this.roomFacility.getStorage();
        for (let linkId in this.memory.linkStatusMap) {
            let status = this.memory.linkStatusMap[linkId];
            let link = Game.getObjectById<StructureLink>(linkId);
            if (!link) {
                continue;
            }
            if (link.cooldown > 0) {
                continue;
            }
            let amount = link.store.getUsedCapacity(RESOURCE_ENERGY);
            if (status.sendToLinkIdList.length > 0) {
                if (amount >= 700) {
                    let sendToLink = Game.getObjectById<StructureLink>(status.sendToLinkIdList[0]);
                    if (sendToLink) {
                        link.transferEnergy(sendToLink, 700);
                        status.reservedOutput = 0;
                        status.sendToLinkIdList = [];
                        // status.sendToLinkIdList.splice(0, 1);
                    }
                    status.status = "free";
                    continue;
                } else if (storage) {
                    this.addStep(storage, link, RESOURCE_ENERGY, 700, true);
                    status.reservedInput = 700;
                    status.status = "wait_input";
                    continue;
                }
            }
        }
    }
}