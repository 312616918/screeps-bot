import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";
import {roomConfigMap} from "./Config";

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

    protected getSpawnConfigList(): SpawnConfig[] {
        let config = roomConfigMap[this.roomName].harvest;
        if(this.memory.creepNameList.length==config.workPosList.length){
            return [];
        }

        let partNum = 5
        if (this.roomFacility.isInLowEnergy()) {
            partNum = Math.min(partNum, 2);
        } else {
            let availableEnergy = this.roomFacility.getCapacityEnergy();
            let availablePartNum = Math.floor((availableEnergy - 100) / 100);
            partNum = Math.min(5, availablePartNum);
            // console.log(`room:${this.roomName} availableEnergy: ${availableEnergy} availablePartNum: ${availablePartNum} partNum: ${partNum}`)
        }
        let body: BodyPartConstant[] = [];
        for (let i = 0; i < partNum; i++) {
            body.push(WORK);
        }
        body.push(CARRY);
        body.push(MOVE);

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


        if (creep.memory.harvest.containerId && Game.time % 10 == 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) <10) {
            let container = Game.getObjectById<StructureContainer>(creep.memory.harvest.containerId);
            if (container && container.hits + 200 < container.hitsMax) {
                creep.repair(container);
                return;
            }
        }


        creep.harvest(target);

        if(this.roomFacility.getController().level<4 && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 10) {
            let site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            if (site && site.structureType == STRUCTURE_CONTAINER && creep.pos.getRangeTo(site) <= 3) {
                creep.build(site);
                return;
            }
        }

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


        if (!hasTransfer && creep.memory.harvest.linkId) {
            let link = Game.getObjectById<StructureLink>(creep.memory.harvest.linkId);
            if (link && link.store.getFreeCapacity(RESOURCE_ENERGY) > 100
                && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= energyIncrease) {
                creep.transfer(link, RESOURCE_ENERGY);
                hasTransfer = true;
            }
        }

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