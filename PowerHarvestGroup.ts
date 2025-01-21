import {OUTER_HARVEST_CONFIG} from "./Config";
import {BaseGroup, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";
import {getFarthestCornerPos, getWorkPosList, isInRoomEdge, logError} from "./Util";
import {Observer} from "./Observer";

type RoleType = "harvest" | "heal" | "carry";

export type PowerHarvestCreepMemory = {
    taskId: string;
    role: RoleType;
    inPosition?: boolean;
    healName?: string;
    roleFinished?: boolean;
};

type HarvestTaskInfo = {
    status?: "harvest" | "carry" | "finished";
    targetId?: string;
    dropPowerId?: string;
    targetPos?: RoomPosition;
    harvestNum?: number;
    healNum?: number;
    carryNum?: number;
    finishedCheckTimes?: number;
    lastHasObserver?: boolean;
    hasCarryReady?: boolean;
    createTime: number;
};

export type PowerHarvestMemory = {
    taskMap?: {
        [id: string]: HarvestTaskInfo
    },
    curRoomIdx?: number,
    lastHasObserver?: boolean
} & GroupMemory;


export class PowerHarvestGroup extends BaseGroup<PowerHarvestMemory> {

    protected moduleName = "powerHarvest";


    protected beforeRunEach(creepList: Creep[]) {
        let allowObserve = Game.time % 10 == 0;
        if (!allowObserve && !this.memory.lastHasObserver) {
            return;
        }
        this.memory.lastHasObserver = false;

        // 初始化
        if (!this.memory.taskMap) {
            this.memory.taskMap = {};
        }
        if (this.memory.curRoomIdx == undefined) {
            this.memory.curRoomIdx = 0;
        }


        let targetRoomNameList = OUTER_HARVEST_CONFIG[this.roomName];
        if (!targetRoomNameList || targetRoomNameList.length == 0) {
            return;
        }

        // 分配执行中的heal
        this.handleHealTarget();
        // 清理已经完成的task
        this.clearFinishedTask();

        // 观测房间
        this.memory.curRoomIdx = this.memory.curRoomIdx % targetRoomNameList.length;
        let curRoomName = targetRoomNameList[this.memory.curRoomIdx];

        let curRoom = Observer.getRoom(curRoomName);
        if (!curRoom) {
            // 提交观测
            if (allowObserve) {
                Observer.observeRoom(curRoomName);
                this.memory.lastHasObserver = true;
            }
            // 不允许观测
            return;
        }

        // 有房间，下次观测后续房间
        this.memory.curRoomIdx++;

        // 寻找powerBank
        let powerBankList = curRoom.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_POWER_BANK
        });
        if (powerBankList.length == 0) {
            return;
        }

        // 初始化task
        for (const obj of powerBankList) {
            let powerBank = <StructurePowerBank>obj;
            let taskId = powerBank.id;
            let task = this.memory.taskMap[taskId];
            if (task) {
                continue;
            }
            if (powerBank.ticksToDecay && powerBank.ticksToDecay < 3000) {
                continue;
            }
            task = this.memory.taskMap[taskId] = {
                status: "harvest",
                targetId: powerBank.id,
                targetPos: powerBank.pos,
                createTime: Game.time
            }
            // 计算creep数量
            // 挖掘位置
            let workPosList = getWorkPosList(task.targetPos);
            if (workPosList.length == 0) {
                logError("no workPos", task.targetPos.roomName, powerBank.id);
            }
            // 一个足够
            workPosList = workPosList.slice(0, 1);

            task.harvestNum = 2;
            if (workPosList.length == 1) {
                task.harvestNum = 1;
            }
            task.healNum = task.harvestNum;
            // 搬运数量
            task.carryNum = Math.ceil(powerBank.power / 1000);
        }
    }

    protected runEachCreep(creep: Creep) {
        switch (creep.memory.powerHarvest.role) {
            case "harvest":
                this.runHarvest(creep);
                break;
            case "heal":
                this.runHeal(creep);
                break;
            case "carry":
                this.runCarry(creep);
                break;
        }
    }

    protected runHarvest(creep: Creep) {
        let creepMemory = creep.memory.powerHarvest;
        if (creepMemory.roleFinished) {
            creep.suicide();
            return;
        }
        let task = this.memory.taskMap[creepMemory.taskId];
        if (!task) {
            this.logError(`not found task for ${creepMemory.taskId}`)
            return;
        }
        // 挖掘结束，腾出位置
        if (task.status != "harvest") {
            let workPos = new RoomPosition(task.targetPos.x, task.targetPos.y, task.targetPos.roomName);
            if (creep.pos.getRangeTo(workPos) > 3) {
                creepMemory.roleFinished = true;
                return;
            }
            let corner = getFarthestCornerPos(workPos);
            this.move.remoteMove(creep, workPos, corner, 1);
            return;
        }
        let targetPos = new RoomPosition(task.targetPos.x, task.targetPos.y, task.targetPos.roomName);
        if (creep.pos.getRangeTo(targetPos) > 1) {
            let sourcePos = new RoomPosition(25, 25, this.roomName);
            this.move.remoteMove(creep, sourcePos, targetPos, 1);
            return;
        }
        let target = Game.getObjectById<StructurePowerBank>(task.targetId);
        if (!target) {
            this.logError(`not found target for ${task.targetId}`)
            return;
        }
        //等待heal
        if (creep.hitsMax - creep.hits > 400) {
            return;
        }
        //harvest
        creep.attack(target);
    }

    protected runHeal(creep: Creep) {
        let creepMemory = creep.memory.powerHarvest;
        let task = this.memory.taskMap[creepMemory.taskId];
        if (!task) {
            this.logError(`not found task for ${creepMemory.taskId}`)
            creep.suicide();
            return;
        }
        if (task.status == "finished") {
            return;
        }

        if (creep.pos.roomName != task.targetPos.roomName || isInRoomEdge(creep.pos)) {
            let sourcePos = new RoomPosition(25, 25, this.roomName);
            let targetPos = new RoomPosition(task.targetPos.x, task.targetPos.y, task.targetPos.roomName);
            this.move.remoteMove(creep, sourcePos, targetPos, 1);
            return;
        }
        let harvestCreep = Game.creeps[creepMemory.healName];
        if (!harvestCreep || harvestCreep.pos.roomName != task.targetPos.roomName) {
            return;
        }
        if (creep.pos.getRangeTo(harvestCreep) > 1) {
            this.moveNormal(creep, harvestCreep.pos, 1);
        }
        creep.heal(harvestCreep);
    }

    // protected runScout(creep: Creep) {
    //     let creepMemory = creep.memory.powerHarvest;
    //     if (!creepMemory.workPos) {
    //         return;
    //     }
    //     if (creep.pos.roomName == creepMemory.workPos.roomName
    //         && creep.pos.x != 0 && creep.pos.y != 0
    //         && creep.pos.x != 49 && creep.pos.y != 49) {
    //         delete creepMemory.workPos;
    //         return;
    //     }
    //     let sourcePos = new RoomPosition(25, 25, this.roomName);
    //     let roomPos = new RoomPosition(creepMemory.workPos.x, creepMemory.workPos.y, creepMemory.workPos.roomName);
    //     this.move.remoteMove(creep, sourcePos, roomPos, 0)
    // }

    protected runCarry(creep: Creep) {
        let creepMemory = creep.memory.powerHarvest;
        let task = this.memory.taskMap[creepMemory.taskId];
        if (creepMemory.roleFinished) {
            if (!task) {
                this.logInfo(`${creep.name} job finished`)
                creep.suicide();
            }
            return;
        }

        if (!task) {
            this.logError(`not found task for ${creepMemory.taskId}`)
            return;
        }

        if (creep.store.getUsedCapacity(RESOURCE_POWER) > 0) {
            let targetPos = this.roomFacility.getStorage().pos;
            if (creep.pos.roomName != targetPos.roomName || creep.pos.getRangeTo(targetPos) > 1) {
                if (creep.pos.roomName != targetPos.roomName) {
                    let sourcePos = new RoomPosition(25, 25, task.targetPos.roomName);
                    this.move.remoteMove(creep, sourcePos, targetPos, 1);
                } else {
                    this.move.reserveMove(creep, targetPos, 1);
                }
                return;
            }
            creep.transfer(creep.room.storage, RESOURCE_POWER);
            creepMemory.roleFinished = true;
            return;
        }
        let targetPos = new RoomPosition(task.targetPos.x, task.targetPos.y, task.targetPos.roomName);
        if (creep.pos.roomName != targetPos.roomName || isInRoomEdge(creep.pos)) {
            let sourcePos = new RoomPosition(25, 25, this.roomName);
            this.move.remoteMove(creep, sourcePos, targetPos, 1);
            return;
        }
        if (creep.pos.getRangeTo(targetPos) > 5) {
            this.moveNormal(creep, targetPos, 1);
            return;
        }
        let powerBank = Game.getObjectById<StructurePowerBank>(task.targetId);
        if (powerBank) {
            return;
        }
        let powerList = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: resource => resource.resourceType == RESOURCE_POWER
        });
        let maxPower = -1;
        let targetPower = null;
        powerList.forEach(power => {
            if (power.amount > maxPower) {
                maxPower = power.amount;
                targetPower = power;
            }
        });
        if (!targetPower) {
            return;
        }
        if (creep.pos.getRangeTo(targetPower) > 1) {
            // 50%的概率不走，避免整体陷入状态循环
            if (Math.random() > 0.5){
                return;
            }
            this.moveNormal(creep, targetPower.pos, 1);
        }
        creep.pickup(targetPower);
    }

    protected getSpawnConfigList(): SpawnConfig[] {
        // 处理待验证的task
        let hasCheck = false;
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            if (task.status == "finished") {
                continue;
            }
            if (task.lastHasObserver) {
                task.lastHasObserver = false;
                hasCheck = true;
            }
        }

        if (Game.time % 10 != 0 && !hasCheck) {
            return [];
        }

        if (!this.memory.taskMap) {
            return [];
        }
        let creepMap: {
            [taskId: string]: Creep[];
        } = {};
        this.memory.creepNameList.forEach(name => {
            let creep = Game.creeps[name];
            if (!creep) {
                return;
            }
            let curNameList = creepMap[creep.memory.powerHarvest.taskId];
            if (!curNameList) {
                curNameList = [];
                creepMap[creep.memory.powerHarvest.taskId] = curNameList;
            }
            curNameList.push(creep);
        })
        let result: SpawnConfig[] = [];
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            if (task.status == "finished") {
                continue;
            }
            let creepList = creepMap[taskId];
            if (!creepList) {
                creepList = [];
            }
            let configList = this.getSpawnConfigListForTask(task, creepList);
            if (configList && configList.length > 0) {
                result = result.concat(configList);
            }
        }
        return result;
    }

    protected getSpawnConfigListForTask(task: HarvestTaskInfo, creepList: Creep[]): SpawnConfig[] {
        let numConfig: {
            [role in RoleType]: number
        } = {
            "harvest": 0,
            "heal": 0,
            "carry": 0
        }
        this.logInfo(`spawn task ${JSON.stringify(task)}`);

        //确认状态
        if (task.status == "harvest") {
            numConfig.harvest = task.harvestNum;
            numConfig.heal = task.healNum;
            let powerBank = Game.getObjectById<StructurePowerBank>(task.targetId);
            // 开始补充carry
            if (powerBank && powerBank.hits < 300000) {
                numConfig.carry = task.carryNum;
            }
            if (!powerBank) {
                let room = Observer.getRoom(task.targetPos.roomName);
                if (room) {
                    task.status = "carry";
                } else {
                    Observer.observeRoom(task.targetPos.roomName);
                    task.lastHasObserver = true;
                }
            }
        }

        if (task.status == "carry") {
            numConfig.carry = task.carryNum;
        }

        let fullConfig = {...numConfig};

        creepList.forEach(creep => {
            let role = creep.memory.powerHarvest.role;
            numConfig[role]--;
        })

        if (numConfig.carry == 0 && fullConfig.carry > 0) {
            task.hasCarryReady = true;
        }
        if (task.hasCarryReady) {
            numConfig.carry = 0;
        }

        this.logInfo(`numConfig: ${JSON.stringify(numConfig)}`);

        if (numConfig.harvest > 0) {
            return [{
                spawnRoomName: this.roomName,
                body: [MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE,
                    ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK,
                ],
                memory: {
                    module: this.moduleName,
                    powerHarvest: {
                        taskId: task.targetId,
                        role: "harvest"
                    }
                },
                num: fullConfig.harvest,
                configHash: "harvest-" + task.targetId
            }];
        }
        if (numConfig.heal > 0) {
            return [{
                spawnRoomName: this.roomName,
                body: [MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                ],
                memory: {
                    module: this.moduleName,
                    powerHarvest: {
                        taskId: task.targetId,
                        role: "heal"
                    }
                },
                num: fullConfig.heal,
                configHash: "heal-" + task.targetId
            }];
        }
        if (numConfig.carry > 0) {
            return [{
                spawnRoomName: this.roomName,
                body: [CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                ],
                memory: {
                    module: this.moduleName,
                    powerHarvest: {
                        taskId: task.targetId,
                        role: "carry",
                    }
                },
                num: fullConfig.carry,
                configHash: "carry-" + task.targetId
            }];
        }
        return [];
    }

    // protected reCheckTaskStatus(task: HarvestTaskInfo) {
    //     // finish没必要check
    //     if (task.status == "finished") {
    //         return;
    //     }
    //     let powerBank = Game.getObjectById<StructurePowerBank>(task.targetId);
    //     if (powerBank) {
    //         task.status = "harvest";
    //         return;
    //     }
    //     // 需要确认是被摧毁，还是被截胡
    //     let targetRoom = Observer.getRoom(task.targetPos.roomName);
    //     if (!targetRoom) {
    //         Observer.observeRoom(task.targetPos.roomName);
    //         task.lastHasObserver = true;
    //         return;
    //     }
    //     let powerList = targetRoom.find(FIND_DROPPED_RESOURCES, {
    //         filter: resource => resource.resourceType == RESOURCE_POWER
    //     });
    //     if (powerList.length > 0) {
    //         task.status = "carry";
    //         return;
    //     }
    //     if (!task.finishedCheckTimes) {
    //         task.finishedCheckTimes = 0;
    //     }
    //     task.finishedCheckTimes += 1;
    //     if (task.finishedCheckTimes == 3) {
    //         task.status = "finished";
    //     }
    //     this.logError("can't check status");
    // }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    protected moveNormal(creep: Creep, pos: RoomPosition | { pos: RoomPosition }, range: number) {
        creep.moveTo(pos, {
            visualizePathStyle: {
                stroke: '#ffffff'
            },
            range: range,
            costCallback(roomName: string, costMatrix: CostMatrix): void | CostMatrix {
                if (roomName != this.roomName) {
                    return;
                }
                for (let i = 0; i < 50; i++) {
                    costMatrix.set(0, i, 255)
                    costMatrix.set(49, i, 255)
                    costMatrix.set(i, 0, 255)
                    costMatrix.set(i, 49, 255)
                }
            }
        });
    }

    private clearFinishedTask() {
        for (let taskId in this.memory.taskMap) {
            let task = this.memory.taskMap[taskId];
            // 太久远没正常删除
            if(!task.createTime){
                task.createTime = Game.time;
            }
            if(Game.time - task.createTime > 10000){
                delete this.memory.taskMap[taskId];
                continue;
            }

            if (task.status != "carry") {
                continue;
            }
            let hasCarry = false;
            let allCarryFinished = true;
            for (const name of this.memory.creepNameList) {
                let creep = Game.creeps[name];
                if (!creep) {
                    continue;
                }
                let creepMemory = creep.memory.powerHarvest;
                if (creepMemory.taskId != taskId) {
                    continue;
                }
                if (creepMemory.role != "carry") {
                    continue;
                }
                hasCarry = true;
                if (!creepMemory.roleFinished) {
                    allCarryFinished = false;
                }
            }
            if (hasCarry && allCarryFinished) {
                delete this.memory.taskMap[taskId];
                return;
            }
        }
    }

    private handleHealTarget() {
        let creepRoleAndTaskMap: {
            [taskId: string]: {
                harvestList: Creep[],
                healList: Creep[]
            }
        } = {};
        for (const name of this.memory.creepNameList) {
            let creep = Game.creeps[name];
            if (!creep) {
                continue;
            }
            let creepMemory = creep.memory.powerHarvest;
            let curMap = creepRoleAndTaskMap[creepMemory.taskId];
            if (!curMap) {
                curMap = creepRoleAndTaskMap[creepMemory.taskId] = {
                    harvestList: [],
                    healList: []
                }
            }
            if (creepMemory.role == "harvest") {
                curMap.harvestList.push(creep);
                continue;
            }

            if (creepMemory.role == "heal") {
                curMap.healList.push(creep);
                continue;
            }
        }
        for (let taskId in creepRoleAndTaskMap) {
            let curMap = creepRoleAndTaskMap[taskId];
            let harvestList = curMap.harvestList;
            let healList = curMap.healList;
            let num = Math.min(harvestList.length, healList.length);
            for (let i = 0; i < num; i++) {
                let harvest = harvestList[i];
                let heal = healList[i];
                heal.memory.powerHarvest.healName = harvest.name;
            }
        }
    }
}