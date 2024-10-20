import {BaseGroup, GroupMemory} from "./BaseGroup";
import {REMOTE_CARRY_CONFIG, RemoteCarryConfigItem} from "./Config";
import {SpawnConfig} from "./Spawn";
import _ = require("lodash");

/**
 * 存储结构
 */
export type RemoteCarryMemory = {
    // 单程耗时
    singleCost: number;
} & GroupMemory;


/**
 * creep存储携带信息
 */
export type RemoteCarryCreepMemory = {
    status: "idle" | "to_source" | "to_target" | "wait";
    sourceId: string;
    targetId: string;
    lastStartTick: number;
}

export class RemoteCarryGroup extends BaseGroup<RemoteCarryMemory> {

    protected moduleName: string = "remove_carry";

    protected getSpawnConfigList(): SpawnConfig[] {
        if (Game.time % 10 != 0) {
            return null;
        }

        if (this.roomFacility.isInLowEnergy()) {
            return null;
        }

        let configList = REMOTE_CARRY_CONFIG[this.roomName];
        if (!configList) {
            return null;
        }
        let hasTask = false;
        for (const item of configList) {
            let source = Game.getObjectById<ObjectWithStore>(item.sourceId);
            if (!source) {
                continue;
            }
            for (let key in source.store) {
                let amount = source.store.getUsedCapacity(<ResourceConstant>key);
                if (amount > 0) {
                    hasTask = true;
                    break;
                }
            }
        }
        if (!hasTask) {
            return null;
        }

        let energyAmount = this.roomFacility.getCapacityEnergy();
        let partNum = 0;
        let startNum = 1;
        let num = 1;
        for (let i = startNum; i > -1; i--) {
            partNum = i;
            if (partNum * 150 <= energyAmount) {
                break;
            }
        }
        if (partNum <= 0) {
            return null;
        }
        let body = [].concat(_.times(partNum * 2, () => CARRY),
            _.times(partNum, () => MOVE));
        return [
            {
                body: body,
                memory: {
                    module: this.moduleName,
                    remoteCarry: {
                        status: "idle",
                        sourceId: null,
                        targetId: null,
                        lastStartTick: 0,
                    }
                },
                num: num
            }
        ];
    }

    protected getConfigItem(): RemoteCarryConfigItem {
        let configList = REMOTE_CARRY_CONFIG[this.roomName];
        if (!configList) {
            return null;
        }
        for (let item of configList) {
            let source = Game.getObjectById<ObjectWithStore>(item.sourceId);
            if (!source) {
                continue;
            }
            for (let key in source.store) {
                let amount = source.store.getUsedCapacity(<ResourceConstant>key);
                if (amount > 0) {
                    return item;
                }
            }
        }
        return null;
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.remoteCarry;

        if(!creepMemory){
            creepMemory = creep.memory.remoteCarry = {
                status: "idle",
                sourceId: null,
                targetId: null,
                lastStartTick: 0,
            }
        }

        if (creepMemory.status == "wait") {
            creep.say("wait");
            return;
        }


        if (creepMemory.status == "idle") {
            if (this.memory.singleCost > 0 && creep.ticksToLive < this.memory.singleCost) {
                creepMemory.status = "wait";
                return;
            }
            let source = Game.getObjectById<ObjectWithStore>(creepMemory.sourceId);
            let target = Game.getObjectById<ObjectWithStore>(creepMemory.targetId);
            if (!source || !target) {
                // 寻找source
                let configItem = this.getConfigItem();
                if (!configItem) {
                    return;
                }
                creepMemory.sourceId = configItem.sourceId;
                creepMemory.targetId = configItem.targetId;
                creepMemory.status = "to_source";
                return;
            }
            if (creep.store.getUsedCapacity() > 0) {
                creepMemory.status = "to_target";
            } else {
                creepMemory.status = "to_source";
            }
        }

        if (creepMemory.status == "to_source") {
            let source = Game.getObjectById<ObjectWithStore>(creepMemory.sourceId);
            if (creep.pos.isNearTo(source)) {
                // 未装满
                let hasNotEnd = false;
                for (let key in source.store) {
                    let amount = source.store.getUsedCapacity(<ResourceConstant>key);
                    if (amount > 0) {
                        hasNotEnd = true;
                        creep.withdraw(<Structure | Tombstone | Ruin>source, <ResourceConstant>key);
                        break;
                    }
                }
                if (hasNotEnd && creep.store.getFreeCapacity() > 0) {
                    return;
                }
                // 装满，改变状态
                creepMemory.status = "idle";
                creepMemory.lastStartTick = Game.time;
                return;
            }
            // 移动到目标
            let target = Game.getObjectById<ObjectWithPos>(creepMemory.targetId);
            this.move.remoteMove(creep, target.pos, source.pos, 1);
            return;
        }
        if (creepMemory.status == "to_target") {
            let target = Game.getObjectById<ObjectWithPos>(creepMemory.targetId);
            if (creep.pos.isNearTo(target)) {
                let hasNotEnd = false;
                for (let key in creep.store) {
                    let amount = creep.store.getUsedCapacity(<ResourceConstant>key);
                    if (amount > 0) {
                        hasNotEnd = true;
                        creep.transfer(<AnyCreep | Structure>target, <ResourceConstant>key);
                        break;
                    }
                }
                if (hasNotEnd) {
                    return;
                }
                // 装满，改变状态
                creepMemory.status = "idle";
                this.memory.singleCost = Game.time - creepMemory.lastStartTick;
                return;
            }
            // 移动到目标
            let source = Game.getObjectById<ObjectWithStore>(creepMemory.sourceId);
            this.move.remoteMove(creep, source.pos, target.pos, 1);
            return;
        }
        this.logError(`unknown status: ${creepMemory.status}`);
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }
}