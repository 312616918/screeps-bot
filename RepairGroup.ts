import {BaseGroup, CreepPartConfig, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";
import _ = require("lodash");

export type RepairMemory = {} & GroupMemory;

export type RepairCreepMemory = {
    targetId?: string;
    targetHits?: number;
}

export class RepairGroup extends BaseGroup<RepairMemory> {
    protected moduleName: string = "repair";

    protected getSpawnConfigList(): SpawnConfig[] {
        let partConfig = this.getPartConfigByAuto();
        if (!partConfig) {
            return [];
        }

        let body: BodyPartConstant[] = [];
        body = body.concat(_.times(partConfig.workNum, () => WORK),
            _.times(partConfig.carryNum, () => CARRY),
            _.times(partConfig.moveNum, () => MOVE));
        let spawnConfigList: SpawnConfig[] = [];
        spawnConfigList.push({
            body: body,
            memory: {
                module: this.moduleName,
                repair: {}
            },
            num: 1
        });
        return spawnConfigList;
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.repair;
        let target = Game.getObjectById<Structure>(creepMemory.targetId);
        if (!target) {
            target = this.getRepairStructure(creep);
            if (!target) {
                return;
            }
            creepMemory.targetId = target.id;
            creepMemory.targetHits = target.hits + 20000 * 1.2;
        }
        if (!creepMemory.targetHits) {
            creepMemory.targetId = null;
            return;
        }

        if (creep.pos.getRangeTo(target) > 3) {
            this.move.reserveMove(creep, target.pos, 3);
            return;
        }
        creep.repair(target);
        if (target.hits >= target.hitsMax || target.hits >= creepMemory.targetHits) {
            //还有资源，不允许切换目标
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && target.hits < target.hitsMax) {
                return;
            }
            creep.memory.repair.targetId = null;
        }
        let leftRate = creep.store.getUsedCapacity() / creep.store.getCapacity();
        if (leftRate < 0.5) {
            this.roomFacility.submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: RESOURCE_ENERGY,
                objId: creep.id,
                amount: creep.store.getCapacity(),
                objType: "repair",
            })
        }
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    private getRepairStructure(creep: Creep): Structure {
        let rampartList = this.roomFacility.getRepairRampartList();
        let structureList: Structure[] = [];
        if (rampartList.length > 0) {
            for (let s of rampartList) {
                if (!s || s.hits >= s.hitsMax - 1000) {
                    continue;
                }
                structureList.push(s);
            }
        }
        let wallList = this.roomFacility.getRepairWallList();
        if (wallList.length > 0) {
            for (let s of wallList) {
                if (!s || s.hits >= s.hitsMax - 1000) {
                    continue;
                }
                structureList.push(s);
            }
        }
        if (structureList.length == 0) {
            return null;
        }
        structureList = _.sortBy(structureList, s => s.hits);
        // 20k一个等级
        let firstLevel = Math.floor(structureList[0].hits / 20000);
        structureList = structureList.filter(s => s.hits < firstLevel * 20000 + 20000);
        // 返回最近的
        let lastDistance = Infinity;
        let lastStructure = null;
        for (let s of structureList) {
            let distance = creep.pos.getRangeTo(s);
            if (distance < lastDistance) {
                lastDistance = distance;
                lastStructure = s;
            }
        }
        return lastStructure;
    }

    private getPartConfigByAuto(): CreepPartConfig {
        if (Game.time % 10 != 0) {
            return null;
        }
        if (this.roomFacility.getController().level < 3) {
            return null;
        }
        // 资源不足
        // let storage = this.roomFacility.getStorage();
        // if (storage && storage.store.getUsedCapacity(RESOURCE_ENERGY) < 50000) {
        //     return null;
        // }
        // 不能保证creep安全
        if (!this.roomFacility.isInSafeMode() && this.roomFacility.ticksSinceLastAttacked() < 100) {
            return null;
        }

        let shouldSpawn = false;
        let wallList = this.roomFacility.getRepairWallList();
        if (wallList && wallList.length > 0) {
            shouldSpawn = true;
        }
        let rampartList = this.roomFacility.getRepairRampartList();
        if (rampartList && rampartList.length > 0) {
            shouldSpawn = true;
        }
        if (!shouldSpawn) {
            return null;
        }

        let result: CreepPartConfig = {};
        let energyAmount = this.roomFacility.getCapacityEnergy();
        //1 work
        result.workNum = 1;
        result.carryNum = 2;
        result.moveNum = 1;
        result.autoNum = 1;

        //1 work
        if (energyAmount >= 1 * 100 + 8 * 50 + 1 * 50) {
            result.workNum = 1;
            result.carryNum = 8;
            result.moveNum = 1;
            result.autoNum = 1;
        }

        //4 work
        if (energyAmount >= 4 * 100 + 8 * 50 + 4 * 50) {
            result.workNum = 4;
            result.carryNum = 8;
            result.moveNum = 4;
            result.autoNum = 1;
        }
        return result;
    }
}