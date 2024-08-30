import {RoomName} from "./Config";
import {BaseGroup, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";


export type BuildCreepMemory = {
    targetId: string;
    workPos?: RoomPosition;
    sourceId?: string;
}

export type BuildMemory = {
    workPosMap: { [targetId: string]: string };
} & GroupMemory;

export class BuilderGroup extends BaseGroup<BuildMemory> {
    protected moduleName: string = "build";

    protected getSpawnConfigList(): SpawnConfig[] {
        if (Game.time % 10 != 0) {
            return [];
        }
        let sites = this.roomFacility.getConstructionSiteList();
        if (sites.length == 0) {
            return [];
        }
        let body: BodyPartConstant[] = [];
        if (this.roomFacility.isInLowEnergy()) {
            body = [WORK, CARRY, MOVE];
        } else {
            let partNum = (this.roomFacility.getRoom().energyAvailable - 100) / 200;
            partNum = Math.floor(partNum);
            partNum = Math.min(4, partNum);
            if (partNum < 1) {
                return [];
            }
            for (let i = 0; i < partNum; i++) {
                body.push(WORK);
                body.push(CARRY);
                body.push(CARRY);
            }
            body.push(MOVE);
            body.push(MOVE);
        }
        this.logInfo(`room ${this.roomName} build body: ${JSON.stringify(body)}`)
        return [{
            body: body,
            memory: {
                module: this.moduleName,
                build: {
                    targetId: sites[0].id,
                }
            },
            num: 1
        }];
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.build;
        let target = Game.getObjectById<ConstructionSite>(creepMemory.targetId);
        if (!target) {
            let sites = this.roomFacility.getConstructionSiteList();
            if (sites.length == 0) {
                return;
            }
            target = sites[0];
            creepMemory.targetId = target.id;
            creepMemory.sourceId = "";
        }
        if (creep.pos.getRangeTo(target) > 3) {
            this.move.reserveMove(creep, target.pos, 3);
            return;
        }
        this.setSourceId(creep, creepMemory);

        let res = creep.build(target);
        if (creep.store.getFreeCapacity() > 20) {
            let handled = this.getEnergyFromSource(creep, creepMemory);
            if (handled) {
                return;
            }
            this.roomFacility.submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: RESOURCE_ENERGY,
                objId: creep.id,
                amount: creep.store.getCapacity(),
                objType: "builder"
            })
        }
    }

    private setSourceId(creep: Creep, creepMemory: BuildCreepMemory) {
        // 20tick，寻找一次
        if (Game.time % 20 != 0) {
            return;
        }
        if (creepMemory.sourceId) {
            return;
        }
        if (!creepMemory.targetId) {
            return;
        }
        let target = Game.getObjectById<ConstructionSite>(creepMemory.targetId);
        if (!target) {
            return;
        }
        creepMemory.sourceId = target.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                if (structure.structureType != STRUCTURE_CONTAINER
                    && structure.structureType != STRUCTURE_LINK
                    && structure.structureType != STRUCTURE_STORAGE) {
                    return false;
                }
                if (structure.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                    return false;
                }
                //距离site小于4
                return structure.pos.getRangeTo(target) <= 4;
            }
        })?.id;
        if (creepMemory.sourceId) {
            return;
        }
        creepMemory.sourceId = target.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: (resource) => {
                if (resource.resourceType != RESOURCE_ENERGY) {
                    return false;
                }
                //距离site小于4
                return resource.pos.getRangeTo(target) <= 4;
            }
        })?.id;
    }

    private getEnergyFromSource(creep: Creep, creepMemory: BuildCreepMemory): boolean {
        if (!creepMemory.sourceId) {
            return false;
        }
        //有sourceId，直接就近取
        let source = Game.getObjectById<Source>(creepMemory.sourceId);
        if (!source) {
            creepMemory.sourceId = "";
            return false;
        }
        if (creep.pos.getRangeTo(source) > 1) {
            this.move.reserveMove(creep, source.pos, 1);
            return false;
        }
        //判断类型
        if (source instanceof StructureContainer
            || source instanceof StructureLink
            || source instanceof StructureStorage) {
            if (source.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                creepMemory.targetId = "";
            }
            creep.withdraw(source, RESOURCE_ENERGY)
            return true;
        }
        if (source instanceof Resource) {
            creep.pickup(source)
            return true;
        }
        this.logInfo(`error source type: ${source}`)
        creepMemory.sourceId = ""
        return false;
    }


    protected beforeRecycle(creepMemory: CreepMemory): void {
        let workPos = creepMemory.build.workPos;
        if (workPos) {
            let posKey = `${workPos.x}-${workPos.y}`;
            delete this.memory.workPosMap[posKey];
        }
    }


}