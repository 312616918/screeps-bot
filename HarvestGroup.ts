import {BaseGroup, CreepPartConfig, GroupMemory} from "./BaseGroup";
import {roomConfigMap} from "./Config";
import {SpawnConfig} from "./Spawn";
import {Metric} from "./Metric";
import _ = require("lodash");

export type HarvestMemory = {} & GroupMemory;


export type HarvestCreepMemory = {
    targetId: string;
    towerIds: string[];
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
    transferObjId?: string;
    linkId?: string;
    containerId?: string;
}


export class HarvestGroup extends BaseGroup<HarvestMemory> {

    protected moduleName: string = "harvest";


    protected beforeRunEach(creepList: Creep[]) {
        // 监控资源开采
        let source_list = this.roomFacility.getSourceList();
        for (let i in source_list) {
            let amount = source_list[i].energy;
            Metric.recordGauge(amount, "type", `source_amount_${i}`, "room", this.roomName);
        }

        //每10000个周期，检查有没有container
        if (Game.time % 10000 != 0) {
            return;
        }
        let workPosList = roomConfigMap[this.roomName].harvest.workPosList;
        if (workPosList.length <= this.roomFacility.getSourceContainerList().length) {
            return;
        }
        workPosList.forEach(pos => {
            let workPos = new RoomPosition(pos.x, pos.y, this.roomName);
            if (workPos.lookFor(LOOK_STRUCTURES).some(s => s.structureType == STRUCTURE_CONTAINER)) {
                return;
            }
            if (workPos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
                return;
            }
            this.logInfo(`add container to ${workPos}`);
            this.roomFacility.getRoom().createConstructionSite(workPos, STRUCTURE_CONTAINER);
        })
    }


    private getPartConfigByAuto(): CreepPartConfig {
        if (this.roomFacility.isInLowEnergy()) {
            return null;
        }
        let result: CreepPartConfig = {};
        let energyAmount = this.roomFacility.getCapacityEnergy();
        //5 work
        if (energyAmount >= 5 * 100 + 2 * 50 + 2 * 50) {
            result.workNum = 5;
            result.carryNum = 2;
            result.moveNum = 2;
        }
        //10 work
        if (energyAmount >= 10 * 100 + 2 * 50 + 2 * 50) {
            result.workNum = 10;
            result.carryNum = 2;
            result.moveNum = 2;
        }
        if (!result.workNum) {
            return null;
        }
        return result;
    }

    private getPartConfigByConfig(): CreepPartConfig {
        let result: CreepPartConfig = {};
        let availableEnergy = this.roomFacility.getCapacityEnergy();
        let availablePartNum = Math.floor((availableEnergy - 100) / 100);
        result.workNum = Math.min(5, availablePartNum);
        if (this.roomFacility.isInLowEnergy()) {
            result.workNum = 2;
            result.carryNum = 1;
            result.moveNum = 1;
        }
        return result;
    }

    protected getSpawnConfigList(): SpawnConfig[] {
        let config = roomConfigMap[this.roomName].harvest;
        if (this.memory.creepNameList.length == config.workPosList.length) {
            return [];
        }
        let partConfig = this.getPartConfigByAuto();
        if (!partConfig) {
            partConfig = this.getPartConfigByConfig();
        }

        let body: BodyPartConstant[] = [];
        body = body.concat(_.times(partConfig.workNum, () => WORK),
            _.times(partConfig.carryNum, () => CARRY),
            _.times(partConfig.moveNum, () => MOVE));

        let spawnConfigList: SpawnConfig[] = [];
        config.workPosList.forEach(pos => {
            let workPos = new RoomPosition(pos.x, pos.y, this.roomName);
            let source = workPos.findClosestByRange(FIND_SOURCES);
            spawnConfigList.push({
                body: body,
                memory: {
                    module: this.moduleName,
                    harvest: {
                        targetId: source.id,
                        towerIds: [],
                        workPosition: workPos
                    }
                },
                num: 1
            })
        })
        return spawnConfigList;
    }

    protected runEachCreep(creep: Creep) {
        var target = Game.getObjectById<Source>(creep.memory.harvest.targetId);
        if (!target) {
            return;
        }
        let pos = creep.memory.harvest.workPosition;
        if (pos) {
            let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
            if (creep.pos.getRangeTo(workPos)) {
                this.move.reserveMove(creep, workPos, 0);
                return;
            }
            let towerList = this.roomFacility.getTowerList();
            creep.memory.harvest.towerIds = towerList.filter(tower => {
                return tower.pos.getRangeTo(workPos) <= 1;
            }).map(tower => tower.id);
            if (this.roomFacility.getRoom().storage && this.roomFacility.getRoom().storage.pos.getRangeTo(workPos) <= 1) {
                creep.memory.harvest.transferObjId = this.roomFacility.getRoom().storage.id;
            }
            let linkList = this.roomFacility.getLinkList().filter(link => {
                return link.pos.getRangeTo(workPos) <= 1;
            });
            if (linkList.length > 0) {
                creep.memory.harvest.linkId = linkList[0].id;
            }
            if (this.roomFacility.getTowerList().length == 0) {
                let cons = workPos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType == STRUCTURE_CONTAINER);
                if (cons.length != 0) {
                    creep.memory.harvest.containerId = cons[0].id;
                }
            }

            delete creep.memory.harvest["workPos"];
        }


        // 修理container
        if (creep.memory.harvest.containerId && Game.time % 10 == 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) < 10) {
            let container = Game.getObjectById<StructureContainer>(creep.memory.harvest.containerId);
            if (container && container.hits + 200 < container.hitsMax) {
                creep.repair(container);
                return;
            }
        }

        //采矿，节省cpu
        if(!target.ticksToRegeneration || target.energy >= target.ticksToRegeneration * 10){
            creep.harvest(target);
        }

        //填充tower
        let energyIncrease = creep.getActiveBodyparts(WORK) * 2;
        let towerIds = creep.memory.harvest.towerIds;
        let hasTransfer = false;
        if (towerIds.length > 0) {
            towerIds.forEach(towerId => {
                let tower = Game.getObjectById<StructureTower>(towerId);
                if (!tower) {
                    return;
                }
                if (tower.store.getFreeCapacity(RESOURCE_ENERGY) > 100 && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= energyIncrease) {
                    creep.transfer(tower, RESOURCE_ENERGY);
                    hasTransfer = true;
                }
            })
        }

        //填充link
        if (!hasTransfer && creep.memory.harvest.linkId) {
            let link = Game.getObjectById<StructureLink>(creep.memory.harvest.linkId);
            if (link && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= energyIncrease) {
                creep.transfer(link, RESOURCE_ENERGY);
                hasTransfer = true;
            }
        }

        //填充其他
        if (!hasTransfer && creep.memory.harvest.transferObjId) {
            let transferObj = Game.getObjectById<StructureStorage>(creep.memory.harvest.transferObjId);
            if (transferObj
                && transferObj.store.getFreeCapacity(RESOURCE_ENERGY) > 100
                && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= energyIncrease) {
                creep.transfer(transferObj, RESOURCE_ENERGY);
                hasTransfer = true;
            }
        }

    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

}