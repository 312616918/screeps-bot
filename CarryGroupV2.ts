import {BaseGroup, GroupMemory} from "./BaseGroup";
import {roomConfigMap, RoomName} from "./Config";
import {SpawnConfig} from "./Spawn";
import {RoomCarryConfig} from "./CarryConfig";
import _ = require("lodash");


type LinkStatus = {
    lastReqTime?: number;
    status?: "idle" | "wait_input" | "wait_output";
    lastIdleTime?: number;
}

/**
 * 存储结构
 */
export type CarryMemoryV2 = {
    //任务列表
    taskMap: {
        [taskId: string]: CarryTask;
    },
    nodeTaskMap: {
        [nodeId: string]: {
            [resourceType: string]: string[];
        }
    },
    linkTaskMap: {
        [linkId: string]: LinkStatus
    }
    // // 空闲时间统计，用于动态确定数量
    // allActiveTicks: number;
    // allIdleTicks: number;
    //
    // // 自动数量
    // autoNum: number;
    // autoUnitNum: number;
} & GroupMemory;

type CarryTask = {
    id: string;
    objId: string;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;
    priority: number;
    increase: number;
}

/**
 * creep存储携带信息
 */
export type CarryCreepMemoryV2 = {
    taskRecordList: {
        taskId: string;
        reserved: number;
        needRec: boolean;
    }[];
    lastEnergyTick?: number;

    beginIncreaseTick?: number;
    lastIncreaseChangeTick?: number;
    lastIncreaseAmount?: number;
}

type TaskArg = {
    task: CarryTask;
    amount: number;
    needRec: boolean;
}


export class CarryGroupV2 extends BaseGroup<CarryMemoryV2> {

    protected moduleName: string = "carry";
    private carryConfig: RoomCarryConfig;

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
            if (creep.memory.carry_v2.taskRecordList.length == 0) {
                continue;
            }
            let lastPos = creep.pos;
            for (let taskRecord of creep.memory.carry_v2.taskRecordList) {
                let task = this.memory.taskMap[taskRecord.taskId];
                if (!task) {
                    continue;
                }
                let obj = Game.getObjectById<ObjectWithPos>(task.objId);
                if (!obj) {
                    continue;
                }
                room.visual.line(lastPos, obj.pos, {
                    color: "red",
                    lineStyle: "dashed"
                })
                lastPos = obj.pos;
            }
        }

        // link status
        if (this.carryConfig) {
            this.carryConfig.link.forEach(c => {
                room.visual.text(c.status, c.pos.x, c.pos.y, {})
            })
        }
    }

    public addCarryReq(obj: ObjectWithPos,
                       carryType: CarryTaskType,
                       resourceType: ResourceConstant,
                       amount: number,
                       priority: number,
                       increase = 0): string {
        if (!obj || !carryType || !resourceType || amount <= 0) {
            return null;
        }
        let roomName = <RoomName>obj.pos.roomName;
        if (roomName != this.roomName) {
            this.logInfo("not in one room" + roomName + "  " + this.roomName)
            return null;
        }
        let taskId = `${obj.id}#${carryType}#${resourceType}`;

        if (obj instanceof StructureStorage || obj instanceof StructureLink) {
            let nodeMap = this.memory.nodeTaskMap[obj.id] || {};
            nodeMap[resourceType] = nodeMap[resourceType] || [];
            nodeMap[resourceType].push(taskId);
            this.memory.nodeTaskMap[obj.id] = nodeMap;
        }

        if (!this.memory.taskMap[taskId]) {
            this.memory.taskMap[taskId] = {
                id: taskId,
                objId: obj.id,
                resourceType: resourceType,
                carryType: carryType,
                amount: amount,
                reserved: 0,
                priority: priority,
                increase: increase
            }
            return taskId;
        }
        this.memory.taskMap[taskId].amount = amount;
        return taskId;
    }

    protected getLinkByPos(innerPos: InnerPosition) {
        let pos = new RoomPosition(innerPos.x, innerPos.y, this.roomName);
        let structures = pos.lookFor(LOOK_STRUCTURES);
        return structures.find(s => s.structureType == STRUCTURE_LINK) as StructureLink;
    }

    protected runLink() {
        if (!this.carryConfig) {
            return;
        }
        // 检查所有link状态
        let inLinkList: StructureLink[] = [];
        let outLinkList: StructureLink[] = [];
        let bothLinkList: StructureLink[] = [];


        for (const linkConfig of this.carryConfig.link) {
            let link = Game.getObjectById<StructureLink>(linkConfig.linkId);
            if (!link) {
                link = this.getLinkByPos(linkConfig.pos);
                if (!link) {
                    continue;
                }
                linkConfig.linkId = link.id;
            }
            if (link.cooldown) {
                continue;
            }
            let status = this.memory.linkTaskMap[link.id];
            if (!status) {
                this.memory.linkTaskMap[link.id] = {
                    status: "idle",
                    lastIdleTime: 0,
                    lastReqTime: 0
                }
            }
            if (linkConfig.status == "in") {
                inLinkList.push(link);
            }
            if (linkConfig.status == "out") {
                outLinkList.push(link);
            }
            if (linkConfig.status == "both") {
                bothLinkList.push(link);
            }
        }

        // 需求转入
        for (const link of inLinkList) {
            if (link.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                continue;
            }
            // 从out转入
            for (const outLink of outLinkList) {
                if (outLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    continue;
                }
                outLink.transferEnergy(link);
                return;
            }
            // 从both转入
            for (const bothLink of bothLinkList) {
                if (bothLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    continue;
                }
                bothLink.transferEnergy(link);
                return;
            }
            // 请求both
            let linkStatus = this.memory.linkTaskMap[link.id];
            if (!linkStatus) {
                linkStatus = this.memory.linkTaskMap[link.id] = {
                    lastReqTime: Game.time,
                }
            }
            // 请求超过一定时间
            if (linkStatus.lastReqTime == 0) {
                linkStatus.lastReqTime = Game.time;
                continue;
            }
            if (Game.time - linkStatus.lastReqTime < 50) {
                continue;
            }
            // 正式请求
            for (const bothLink of bothLinkList) {
                let bothStatus = this.memory.linkTaskMap[bothLink.id];
                if (bothStatus.status != "idle") {
                    continue;
                }
                let freeAmount = bothLink.store.getFreeCapacity(RESOURCE_ENERGY);
                if (freeAmount == 0) {
                    continue;
                }
                this.addCarryReq(bothLink, "input", RESOURCE_ENERGY, freeAmount, 0);
                bothStatus.status = "wait_input";
                linkStatus.lastReqTime = 0;
                continue;
            }
        }

        // 需求转出
        for (const link of outLinkList) {
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                continue;
            }
            // 从in转出已经验证
            // 从both转出
            for (const bothLink of bothLinkList) {
                if (bothLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    continue;
                }
                link.transferEnergy(bothLink);
                return;
            }
            // 申请
            let status = this.memory.linkTaskMap[link.id];
            if (status.lastReqTime == 0) {
                status.lastReqTime = Game.time;
                continue;
            }
            // 请求超过一定时间
            if (Game.time - status.lastReqTime < 50) {
                continue;
            }
            //预约
            for (const inLink of inLinkList) {
                let inStatus = this.memory.linkTaskMap[inLink.id];
                if (inStatus.status != "idle") {
                    continue;
                }
                let freeAmount = inLink.store.getFreeCapacity(RESOURCE_ENERGY);
                if (freeAmount == 0) {
                    continue;
                }
                this.addCarryReq(inLink, "output", RESOURCE_ENERGY, freeAmount, 0);
                inStatus.status = "wait_output";
                status.lastReqTime = 0;
                continue;
            }
        }
    }

    protected beforeRunEach(creepList: Creep[]) {
        // this.carryConfig = ALL_ROOM_CARRY_CONFIG[this.roomName];
        this.carryConfig = this.roomFacility.getCarryConfig();
        if (Game.time % 100 == 0) {
            this.memory.taskMap = {};
            this.memory.nodeTaskMap = {};
            this.memory.linkTaskMap = {};
        }
        if (!this.memory.nodeTaskMap) {
            this.memory.nodeTaskMap = {};
        }
        if (!this.memory.linkTaskMap) {
            this.memory.linkTaskMap = {};
        }
        // if(this.memory.allActiveTicks==undefined){
        //     this.memory.allActiveTicks = 0;
        //     this.memory.allIdleTicks = 0;
        //     this.memory.autoNum = 0;
        //     this.memory.autoUnitNum = 0;
        // }
        this.runLink();
    }


    protected getSpawnConfigList(): SpawnConfig[] {
        return this.getSpawnConfigListByConfig();
    }

    // protected getSpawnConfigListByAuto(): SpawnConfig[] {
    //     // 1000周期重置信息
    //     if(this.memory.allActiveTicks>=1000){
    //         // 利用率低于50%，降低数量
    //         let rate = this.memory.allIdleTicks/this.memory.allActiveTicks;
    //         if(rate<0.5){
    //             // 数量低于2，降低unit数量
    //             if(this.memory.autoNum<=2){
    //                 this.memory.autoUnitNum = Math.max(1,this.memory.autoUnitNum-1);
    //             }else{
    //                 this.memory.autoNum = Math.max(1,this.memory.autoNum-1);
    //             }
    //         }
    //
    //         // 高于90%
    //         if(rate>0.9) {
    //             // 超出当前资源能力，或者8，
    //         }
    //     }
    //
    //
    // }


    protected getSpawnConfigListByAuto(): SpawnConfig[] {
        if (this.roomFacility.isInLowEnergy()) {
            return null;
        }
        let energyAmount = this.roomFacility.getCapacityEnergy();
        // 没有carry，用可用energy
        if(this.memory.creepNameList.length==0){
            energyAmount = this.roomFacility.getAvailableEnergy();
        }
        let partNum = 0;
        let startNum = 8;
        let num = 2;
        if(this.roomName==RoomName.E9N6){
            num = 6;
        }
        if (this.roomFacility.isRunningExpand()) {
            num *= 2;
            startNum *= 2;
        }
        for (let i = startNum; i > -1; i--) {
            partNum = i;
            if (partNum * 150 <= energyAmount) {
                break;
            }
        }
        if (partNum <= 0) {
            return null;
        }
        if(this.roomName == RoomName.E31N9){
            partNum = 1;
        }
        let body = [].concat(_.times(partNum * 2, () => CARRY),
            _.times(partNum, () => MOVE));
        return [
            {
                body: body,
                memory: {
                    module: this.moduleName,
                    carry_v2: {
                        taskRecordList: []
                    }
                },
                num: num
            }
        ];
    }

    protected getSpawnConfigListByConfig(): SpawnConfig[] {
        let autoResult = this.getSpawnConfigListByAuto();
        if (autoResult != null) {
            return autoResult;
        }

        let config = roomConfigMap[this.roomName].carry;
        let partNum = config.partNum;
        if (this.roomFacility.isInLowEnergy()) {
            partNum = 1;
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
                    carry_v2: {
                        taskRecordList: []
                    }
                },
                num: config.carryNum
            }
        ];
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.carry_v2;
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
            if (creep.store.getUsedCapacity(task.resourceType) == 0) {
                this.logInfo(`error: ${creepName} carry input but no resource`)
                this.finishTask(creepMemory, 0);
                return;
            }
            this.move.reserveMove(creep, target.pos, 1);

            //increase，5周期执行一次
            if (creepMemory.beginIncreaseTick) {
                if ((Game.time - creepMemory.beginIncreaseTick) % 5 != 0) {
                    return;
                }
            }

            let res = creep.transfer(<AnyCreep | Structure>target, task.resourceType, taskRecord.reserved)
            if (res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_FULL) {
                res = creep.transfer(<AnyCreep | Structure>target, task.resourceType)
            }
            if (res == ERR_NOT_IN_RANGE) {
                return;
            }
            if(res!=OK){
                this.logError(`error: ${creepName} transfer error ${res}`)
            }
            //increase需求需要持续供应一段时间
            if (task.increase > 0) {
                let targetIncreaseAmount = (<AnyCreep>target).store.getFreeCapacity(task.resourceType);
                let predictAmount = Math.min(taskRecord.reserved, targetIncreaseAmount);
                if (creep.store.getUsedCapacity(task.resourceType) > predictAmount) {
                    if (!creepMemory.beginIncreaseTick) {
                        creepMemory.beginIncreaseTick = Game.time;
                    }
                    if(!creepMemory.lastIncreaseChangeTick){
                        creepMemory.lastIncreaseChangeTick = Game.time;
                    }
                    // 最多供应300周期
                    let isInTickRange = Game.time - creepMemory.beginIncreaseTick < 300;
                    // 最近5tick必须有变化
                    let hasChange = true;
                    if(Game.time-creepMemory.lastIncreaseChangeTick>5 && creepMemory.lastIncreaseAmount==targetIncreaseAmount ){
                        hasChange = false;
                    }
                    creepMemory.lastIncreaseAmount = targetIncreaseAmount;
                    if (isInTickRange && hasChange) {
                        this.logInfo(`creep ${creepName} increase ${task.resourceType} ${predictAmount}`)
                        return;
                    }
                }
            }
            this.finishTask(creepMemory, 0)
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

    protected finishTask(carryCreepMemory: CarryCreepMemoryV2, index: number): void {
        let record = carryCreepMemory.taskRecordList[index];
        carryCreepMemory.taskRecordList.splice(index, 1);
        carryCreepMemory.beginIncreaseTick = undefined;
        carryCreepMemory.lastIncreaseChangeTick = undefined;
        carryCreepMemory.lastIncreaseAmount = undefined;

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
            let nodeMap = this.memory.nodeTaskMap[task.objId];
            if (nodeMap) {
                let taskIdList = nodeMap[task.resourceType];
                if (taskIdList) {
                    let idx = taskIdList.indexOf(taskId);
                    if (idx != -1) {
                        taskIdList.splice(idx, 1);
                    }
                }
            }
        }
    }

    protected recycleTask(carryCreepMemory: CarryCreepMemoryV2, index: number): void {
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

    protected getClosestTask(creep: Creep, taskArgList: TaskArg[]): TaskArg {
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
        return taskArgList[0];
    }

    protected takeTask(creep: Creep, task: CarryTask, amount: number, needRec: boolean): void {
        let creepMemory = creep.memory.carry_v2;
        let record = {
            taskId: task.id,
            reserved: amount,
            needRec: needRec
        }
        creepMemory.taskRecordList.push(record);
        task.reserved += amount;
        creep.say(task.carryType + "!");
    }

    protected getNodeLink(pos: RoomPosition, resourceType: ResourceConstant, nodeType: "input" | "output"): StructureLink {
        if (!this.carryConfig) {
            return null;
        }
        for (const node of this.carryConfig.node) {
            if (node.resourceType != resourceType) {
                continue;
            }
            if (node.type != nodeType) {
                continue;
            }
            let nodePos = new RoomPosition(node.nodePos.x, node.nodePos.y, this.roomName);
            let range = pos.getRangeTo(nodePos);
            if (range > node.range || range == 0) {
                continue;
            }
            if (!node.nodeId) {
                let structures = nodePos.lookFor(LOOK_STRUCTURES)
                let link = structures.find(s => s.structureType == STRUCTURE_LINK);
                if (link) {
                    node.nodeId = link.id
                }
            }
            let link = Game.getObjectById<StructureLink>(node.nodeId);
            if (!link) {
                continue;
            }
            return link;
        }
    }

    protected arrange(creep: Creep): void {
        // this.logInfo("arrange", creep.name)
        let creepMemroy = creep.memory.carry_v2;
        let taskArgList: TaskArg[] = [];
        //1. has resource
        let usedAmount = creep.store.getUsedCapacity();
        if (usedAmount) {
            for (let type in creep.store) {
                let resourceType = type as ResourceConstant;
                let storeAmount = creep.store.getUsedCapacity(resourceType);
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
                    creepMemroy.lastEnergyTick = 0;
                    let finalTask = this.getClosestTask(creep, taskArgList);
                    this.takeTask(creep, finalTask.task, finalTask.amount, finalTask.needRec);
                    return;
                }
                if (!creepMemroy.lastEnergyTick) {
                    creepMemroy.lastEnergyTick = Game.time;
                }
                let isTooLong = creepMemroy.lastEnergyTick && Game.time - creepMemroy.lastEnergyTick > 100;
                // 没有energy的output，等待，不着急送回
                if (resourceType == RESOURCE_ENERGY && !isTooLong) {
                    let hasOutput = false;
                    for (let taskId in this.memory.taskMap) {
                        let task = this.memory.taskMap[taskId];
                        if (task.resourceType != RESOURCE_ENERGY) {
                            continue;
                        }
                        if (task.amount <= task.reserved) {
                            continue;
                        }
                        if (task.carryType != "output") {
                            continue;
                        }
                        hasOutput = true;
                        break;
                    }
                    if (!hasOutput) {
                        continue;
                    }
                }

                creepMemroy.lastEnergyTick = Game.time;
                let link = this.getNodeLink(creep.pos, resourceType, "input");
                // 从link
                if (link) {
                    let linkAmount = this.getNodeFreeAmount(link, resourceType);
                    if (linkAmount <= 0) {
                        continue;
                    }
                    let linkTaskId = this.addCarryReq(link, "input", resourceType, linkAmount, 0);
                    if (!linkTaskId) {
                        continue;
                    }
                    let linkTask = this.memory.taskMap[linkTaskId];
                    if (!linkTask) {
                        continue;
                    }
                    creep.say("link")
                    this.takeTask(creep, linkTask, linkAmount, true);
                    return;
                }
                //storage
                let storage = this.roomFacility.getStorage();
                if (storage) {
                    let storageAmount = this.getNodeFreeAmount(storage, resourceType);
                    if (storageAmount > 0) {
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
            return;
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
                taskArgList.push({
                    task: task,
                    amount: capAmount,
                    needRec: true
                });
            }
            if (taskArgList.length > 0) {
                let finalTask = this.getClosestTask(creep, taskArgList);
                this.takeTask(creep, finalTask.task, finalTask.amount, finalTask.needRec);
                return;
            }
            let storage = this.roomFacility.getStorage();
            for (let taskId in this.memory.taskMap) {
                let task = this.memory.taskMap[taskId];
                if (task.carryType != "input") {
                    continue;
                }
                if (task.amount <= task.reserved) {
                    continue;
                }
                if (!storage) {
                    continue;
                }
                if (this.getNodeAvailableAmount(storage, task.resourceType) <= 0) {
                    continue;
                }
                taskArgList.push({
                    task: task,
                    amount: capAmount,
                    needRec: true
                })
            }
            if (taskArgList.length > 0) {
                let finalTask = this.getClosestTask(creep, taskArgList);
                let targetObj = Game.getObjectById<ObjectWithPos>(finalTask.task.objId);
                if (!targetObj) {
                    this.logError("targetObj is null")
                    return
                }
                // 判断是否是link需求
                let link = this.getNodeLink(targetObj.pos, finalTask.task.resourceType, "output");
                if (link) {
                    let linkAmount = this.getNodeAvailableAmount(link, finalTask.task.resourceType);
                    if (linkAmount <= 0) {
                        return;
                    }
                    let linkTaskId = this.addCarryReq(link, "output", finalTask.task.resourceType, linkAmount, 0);
                    if (!linkTaskId) {
                        return;
                    }
                    let linkTask = this.memory.taskMap[linkTaskId];
                    if (!linkTask) {
                        return;
                    }
                    this.takeTask(creep, linkTask, linkAmount, false);
                    this.takeTask(creep, finalTask.task, finalTask.amount, finalTask.needRec);
                    creep.say("take from link");
                    return;
                }
                // 从storage
                let storageTaskId = this.addCarryReq(this.roomFacility.getStorage(), "output", finalTask.task.resourceType,
                    capAmount, 0);
                this.takeTask(creep, this.memory.taskMap[storageTaskId], capAmount, false);
                this.takeTask(creep, finalTask.task, finalTask.amount, finalTask.needRec);
                creep.say("take from storage");
                return;
            }
        }
    }

    private getNodeAvailableAmount(nodeObj: StructureStorage | StructureLink, resourceType: ResourceConstant): number {
        let nodeMap = this.memory.nodeTaskMap[nodeObj.id];
        let usedAmount = nodeObj.store.getUsedCapacity(resourceType);
        if (!nodeMap) {
            return usedAmount
        }
        let taskIdList = nodeMap[resourceType];
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

    private getNodeFreeAmount(nodeObj: StructureStorage | StructureLink, resourceType: ResourceConstant): number {
        let nodeMap = this.memory.nodeTaskMap[nodeObj.id];
        let freeAmount = nodeObj.store.getFreeCapacity(resourceType);
        if (!nodeMap) {
            return freeAmount
        }
        let taskIdList = nodeMap[resourceType];
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
        })
        return freeAmount;
    }
}