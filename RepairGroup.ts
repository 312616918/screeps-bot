import {BaseGroup, CreepPartConfig, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";
import _ = require("lodash");

export type RepairMemory = {} & GroupMemory;

export type RepairCreepMemory = {
    status : "idle" | "repair" | "withdraw" | "sleep",
    targetId?: string;
    sleepTick?: number;
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
                repair: {
                    status: "idle",
                }
            },
            num: 1
        });
        return spawnConfigList;
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.repair;
        if(!creepMemory.status){
            creepMemory.status="idle";
        }


        if(creepMemory.status=="sleep"){
            if(!creepMemory.sleepTick || creepMemory.sleepTick<=0){
                creepMemory.status="idle";
                return;
            }
            creepMemory.sleepTick--;
            return;
        }

        if(creepMemory.status=="idle"){
            // withdraw
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY)<=0){
                let sourceList = [];
                let linkList = this.roomFacility.getLinkList();
                sourceList.push(...linkList);
                if(this.roomFacility.getStorage()){
                    sourceList.push(this.roomFacility.getStorage());
                }
                let sourceContainerList = this.roomFacility.getSourceContainerList();
                sourceList.push(...sourceContainerList);

                let distance = Infinity;
                let target = null;
                for(let source of sourceList) {
                    if(source.store.getUsedCapacity(RESOURCE_ENERGY)<=100){
                        continue;
                    }
                    let d = creep.pos.getRangeTo(source);
                    if (d < distance) {
                        distance = d;
                        target = source;
                    }
                }
                if(!target){
                    this.logError(`no source in ${this.roomName}`);
                    creepMemory.status = "sleep";
                    creepMemory.sleepTick = 100;
                    return;
                }
                creepMemory.status = "withdraw";
                creepMemory.targetId = target.id;
                return;
            }
            //repair
            let target = this.getRepairStructure(creep);
            if(!target){
                this.logError(`no target in ${this.roomName}`);
                creepMemory.status = "sleep";
                creepMemory.sleepTick = 100;
                return;
            }
            creepMemory.status = "repair";
            creepMemory.targetId = target.id;
            // creepMemory.targetHits = target.hits + 20000 * 1.2;
            return;
        }

        if(creepMemory.status=="withdraw"){
            if(creep.store.getFreeCapacity()<=0){
                creepMemory.status = "idle";
                return;
            }
            let target = Game.getObjectById<Structure>(creepMemory.targetId);
            if(!target) {
                this.logError(`no withdraw target in ${this.roomName}`);
                creepMemory.status = "idle";
                return;
            }
            if(target instanceof StructureWall){
                this.logError(`no withdraw target in ${this.roomName}`);
                creepMemory.status = "idle";
                return;
            }
            if (creep.pos.getRangeTo(target) > 1) {
                this.move.reserveMove(creep, target.pos, 1);
                return;
            }
            creep.withdraw(target, RESOURCE_ENERGY);
            return;
        }

        if(creepMemory.status=="repair"){
            if(creep.store.getUsedCapacity()<=0) {
                creepMemory.status = "idle";
                return;
            }
            let target = Game.getObjectById<Structure>(creepMemory.targetId);
            if(!target) {
                this.logError(`no repair target in ${this.roomName}`);
                creepMemory.status = "idle";
                return;
            }
            if (creep.pos.getRangeTo(target) > 3) {
                this.move.reserveMove(creep, target.pos, 3);
                return;
            }
            creep.repair(target);
            return;
        }
        this.logError(`unknown status ${creepMemory.status} in ${this.roomName}`);
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
        if (this.roomFacility.getLevel() < 3) {
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