import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";
import {roomConfigMap} from "./Config";

export type UpgradeMemory = {} & GroupMemory;

export type UpgradeCreepMemory = {
    targetId?: string;
    //工作地点，无此属性代表以就位
    workPosition: RoomPosition;
}

export class UpgradeGroup extends BaseGroup<UpgradeMemory> {
    protected moduleName: string = "upgrade";

    protected getSpawnConfigList(): SpawnConfig[] {
        let config = roomConfigMap[this.roomName].upgrade;
        let partNum = config.partNum;
        if (this.roomFacility.isInLowEnergy()) {
            partNum = Math.min(partNum, 2);
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
            spawnConfigList.push({
                body: body,
                memory: {
                    module: this.moduleName,
                    upgrade: {
                        workPosition: workPos
                    }
                },
                num: 1
            });
        });
        return spawnConfigList;
    }

    protected runEachCreep(creep: Creep) {
        var target = Game.getObjectById<StructureController>(creep.memory.upgrade.targetId);
        if (!target) {
            target = this.roomFacility.getController();
            creep.memory.upgrade.targetId = target.id;
        }
        let pos = creep.memory.upgrade.workPosition;
        // let workPos = pos;
        if (pos) {
            let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
            if (creep.pos.getRangeTo(workPos)) {
                creep.moveTo(workPos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                return;
            } else {
                delete creep.memory.upgrade["workPosition"];
            }
        }
        creep.upgradeController(target);


        if (creep.store.getUsedCapacity() < 20) {
            this.roomFacility.submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: RESOURCE_ENERGY,
                objId: creep.id,
                amount: creep.store.getCapacity(),
                objType: "upgrader"
            })
        }
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }


}