import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";
import {directionBiasMap, roomConfigMap} from "./Config";

export type UpgradeMemory = {} & GroupMemory;

export type UpgradeCreepMemory = {
    targetId?: string;
    //工作地点，无此属性代表以就位
    workPosition: RoomPosition;
    inputObjId?: string;
    linkId?: string;
}

export class UpgradeGroup extends BaseGroup<UpgradeMemory> {
    protected moduleName: string = "upgrade";

    protected getSpawnConfigList(): SpawnConfig[] {
        let config = roomConfigMap[this.roomName].upgrade;
        let workNum = config.partNum;
        let carryNum = config.carryNum || 2;
        let moveNum = config.moveNum || 2;

        if (this.roomFacility.isInLowEnergy()) {
            workNum = Math.min(workNum, 2);
            carryNum = Math.min(carryNum, 1);
            moveNum = Math.min(moveNum, 1);
        }
        let body: BodyPartConstant[] = [];
        for (let i = 0; i < workNum; i++) {
            body.push(WORK);
        }
        for (let i = 0; i < carryNum; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < moveNum; i++) {
            body.push(MOVE);
        }

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
                this.move.reserveMove(creep, workPos, 0);
                return;
            }
            let linkRecord = this.roomFacility.getClosestLink(creep.id);
            if(linkRecord.distance<=1){
                creep.memory.upgrade.inputObjId = linkRecord.objId;
            }
            if (this.roomFacility.getRoom().storage && workPos.getRangeTo(this.roomFacility.getRoom().storage) <= 1) {
                creep.memory.upgrade.inputObjId = this.roomFacility.getRoom().storage.id;
            }
            delete creep.memory.upgrade["workPosition"];
        }
        creep.upgradeController(target);
        if (creep.memory.upgrade.inputObjId) {
            let energyCost = creep.getActiveBodyparts(WORK);
            if (creep.store.getUsedCapacity() > energyCost) {
                return;
            }
            let inputObj = Game.getObjectById<StructureStorage>(creep.memory.upgrade.inputObjId);
            if (inputObj && inputObj.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                creep.withdraw(inputObj, RESOURCE_ENERGY);
                return;
            }
        }
        let leftRate = creep.store.getUsedCapacity() / creep.store.getCapacity();
        if (leftRate < 0.2) {
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