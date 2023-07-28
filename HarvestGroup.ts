import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";

export type HarvestMemory = {} & GroupMemory;


export type HarvestCreepMemory = {
    targetId: string;
    towerIds: string[];
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}


export class HarvestGroup extends BaseGroup<HarvestMemory> {

    protected moduleName: string = "harvest";

    protected getSpawnConfigList(): SpawnConfig[] {
        return [
            {
                body: [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE],
                memory: {
                    module: this.moduleName,
                    harvest: {
                        targetId: "5bbcacc39099fc012e636284",
                        towerIds: [],
                        workPosition: new RoomPosition(16, 14, "W2N18")
                    }
                },
                num: 1
            },
            {
                body: [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE],
                memory: {
                    module: this.moduleName,
                    harvest: {
                        targetId: "5bbcacc39099fc012e636285",
                        towerIds: [],
                        workPosition: new RoomPosition(19, 17, "W2N18")
                    }
                },
                num: 1
            }
        ];
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
            delete creep.memory.harvest["workPos"];
        }
        creep.harvest(target);

        let towerIds = creep.memory.harvest.towerIds;
        if (towerIds.length > 0) {
            towerIds.forEach(towerId => {
                let tower = Game.getObjectById<StructureTower>(towerId);
                if (!tower) {
                    return;
                }
                if (tower.store.getFreeCapacity(RESOURCE_ENERGY) > 100) {
                    creep.transfer(tower, RESOURCE_ENERGY);
                }
            })
        }
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

}