import {BaseGroup, CreepPartConfig, GroupMemory} from "./BaseGroup";
import {roomConfigMap, RoomName} from "./Config";
import {SpawnConfig} from "./Spawn";
import _ = require("lodash");

export type UpgradeMemory = {} & GroupMemory;

export type UpgradeCreepMemory = {
    targetId?: string;
    //工作地点，无此属性代表以就位
    workPosition: RoomPosition;
    inputObjId?: string;
    linkId?: string;
    towerIdList?: string[];
    //最后从容器获取的时间
    lastInputTime?: number;
}

export class UpgradeGroup extends BaseGroup<UpgradeMemory> {
    protected moduleName: string = "upgrade";

    protected getSpawnConfigList(): SpawnConfig[] {
        if (this.memory.creepNameList.length >= 4) {
            return [];
        }

        let partConfig = this.getPartConfigByAuto();
        if (!partConfig) {
            partConfig = this.getPartConfigByConfig();
        }
        if (this.roomFacility.getController().level < 3) {
            partConfig.autoNum = 4;
            if (this.roomFacility.getSourceList().length == 1) {
                partConfig.autoNum = 2;
            }
        }

        let body: BodyPartConstant[] = [];
        body = body.concat(_.times(partConfig.workNum, () => WORK),
            _.times(partConfig.carryNum, () => CARRY),
            _.times(partConfig.moveNum, () => MOVE));

        let config = roomConfigMap[this.roomName].upgrade;
        let workPosList = config.workPosList;
        if (partConfig.autoNum && partConfig.autoNum > 1
            && this.memory.creepNameList.length < partConfig.autoNum) {
            workPosList = [].concat(workPosList);
            let centerPos = new RoomPosition(workPosList[0].x, workPosList[0].y, this.roomName);
            let posList = [];
            for (let roomPos of this.getPosList(this.roomFacility.getController().pos, 3)) {
                if (workPosList.some(pos => pos.x == roomPos.x && pos.y == roomPos.y)) {
                    continue;
                }
                //验证地形
                let terrain = roomPos.lookFor(LOOK_TERRAIN)[0];
                if (terrain == "wall") {
                    continue;
                }
                //验证建筑，除了container, road外不能有其他的建筑
                let structures = roomPos.lookFor(LOOK_STRUCTURES);
                if (structures.some(struct => struct.structureType != "container" && struct.structureType != "road")) {
                    continue;
                }
                let sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
                if (sites.length > 0) {
                    continue;
                }
                posList.push({
                    dis: roomPos.getRangeTo(centerPos),
                    pos: roomPos
                });
            }
            //取最近的
            let subSize = partConfig.autoNum - workPosList.length;
            if (subSize > posList.length) {
                subSize = posList.length;
            }
            if (subSize < 0) {
                subSize = 0;
            }
            posList.sort((a, b) => a.dis - b.dis);
            workPosList = workPosList.concat(posList.slice(0, subSize).map(pos => pos.pos));
            this.logInfo(`${this.roomName} fast mode, add ${subSize} positions to workPosList, total ${workPosList.length}, pos:${JSON.stringify(workPosList)}`);
        }
        let spawnConfigList: SpawnConfig[] = [];
        workPosList.forEach(pos => {
            let workPos = new RoomPosition(pos.x, pos.y, this.roomName);
            spawnConfigList.push({
                body: body,
                memory: {
                    module: this.moduleName,
                    upgrade: {
                        workPosition: workPos
                    }
                },
                configHash: `${workPos.x}-${workPos.y}`,
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
            if (linkRecord.distance <= 1) {
                creep.memory.upgrade.inputObjId = linkRecord.objId;
            }
            if (this.roomFacility.getRoom().storage && workPos.getRangeTo(this.roomFacility.getRoom().storage) <= 1) {
                creep.memory.upgrade.inputObjId = this.roomFacility.getRoom().storage.id;
            }
            if (this.roomFacility.getTowerList().length > 0) {
                creep.memory.upgrade.towerIdList = this.roomFacility.getTowerList()
                    .filter(tower => {
                        return workPos.getRangeTo(tower) <= 1;
                    })
                    .map(tower => tower.id);
            }
            delete creep.memory.upgrade["workPosition"];
        }
        creep.upgradeController(target);
        if (creep.memory.upgrade.towerIdList && Game.time % 2 == 0) {
            creep.memory.upgrade.towerIdList.forEach(towerId => {
                let tower = Game.getObjectById<StructureTower>(towerId);
                if (!tower) {
                    return;
                }
                if (tower.store.getFreeCapacity(RESOURCE_ENERGY) < 200) {
                    return;
                }
                creep.transfer(tower, RESOURCE_ENERGY);
            });
        }
        if (creep.memory.upgrade.inputObjId) {
            let energyCost = creep.getActiveBodyparts(WORK);
            if (creep.store.getUsedCapacity() > energyCost) {
                return;
            }
            let inputObj = Game.getObjectById<StructureStorage>(creep.memory.upgrade.inputObjId);
            if (inputObj && inputObj.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                creep.withdraw(inputObj, RESOURCE_ENERGY);
                creep.memory.upgrade.lastInputTime = Game.time;
                return;
            }
        }
        // // 长期从容器获取，不额外新增carry任务
        // let lastTime = creep.memory.upgrade.lastInputTime;
        // if (lastTime && Game.time - lastTime < 100 && this.roomName != RoomName.E9N9) {
        //     return;
        // }

        let leftRate = creep.store.getUsedCapacity() / creep.store.getCapacity();
        if (leftRate < 0.5) {
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

    private getPartConfigByAuto(): CreepPartConfig {
        if (this.roomFacility.getController().level == 8) {
            return null;
        }
        if (this.roomFacility.isInLowEnergy()) {
            return null;
        }
        let result: CreepPartConfig = {};
        // if (this.roomName == RoomName.E9N6) {
        //     result = {
        //         workNum: 10,
        //         carryNum: 2,
        //         moveNum: 2,
        //         autoNum: 4
        //     }
        //     if (this.isPartConfigAvailable(result)) {
        //         return result;
        //     }
        // }


        let energyAmount = this.roomFacility.getCapacityEnergy();
        //4 work
        if (energyAmount >= 4 * 100 + 2 * 50 + 1 * 50) {
            result.workNum = 4;
            result.carryNum = 2;
            result.moveNum = 1;
            result.autoNum = 4;
        }
        //8 work
        if (energyAmount >= 8 * 100 + 2 * 50 + 2 * 50) {
            result.workNum = 8;
            result.carryNum = 2;
            result.moveNum = 2;
            result.autoNum = 2;
        }
        //16 work
        if (energyAmount >= 16 * 100 + 4 * 50 + 4 * 50) {
            result.workNum = 16;
            result.carryNum = 4;
            result.moveNum = 4;
            result.autoNum = 1;
        }
        if (!result.workNum) {
            return null;
        }

        if (this.roomName == RoomName.E3N11 || this.roomName == RoomName.E4N13) {
            result.autoNum *= 2;
        }

        //单矿房减半
        if (this.roomFacility.getSourceList().length < 2) {
            if (result.autoNum > 1) {
                result.autoNum /= 2;
            } else if (result.workNum > 1) {
                result.workNum /= 2;
            }
        }

        // 资源过剩，放双倍
        if (this.roomFacility.getStorage()
            && this.roomFacility.getStorage().store.getUsedCapacity(RESOURCE_ENERGY) > 800000) {
            result.autoNum *= 2;
        }
        // 资源不足，只保证最低限度消耗
        if (this.roomFacility.getController().level > 5
            && this.roomFacility.getStorage()
            && this.roomFacility.getStorage().store.getUsedCapacity(RESOURCE_ENERGY) < 200000) {
            result.workNum = 2;
            result.moveNum = 1;
            result.autoNum = 1;
        }
        // if (!this.roomFacility.getStorage()
        //     && this.roomFacility.getController().level >= 4) {
        //     result.workNum = 2;
        //     result.moveNum = 1;
        //     result.autoNum = 1;
        // }
        return result;
    }

    private getPartConfigByConfig(): CreepPartConfig {
        let config = roomConfigMap[this.roomName].upgrade;

        let result: CreepPartConfig = {};
        result.workNum = config.workNum;
        result.carryNum = config.carryNum ? config.carryNum : 1;
        result.moveNum = config.moveNum ? config.moveNum : 1;
        result.autoNum = config.autoNum ? config.autoNum : -1;
        if (this.roomFacility.isInLowEnergy()) {
            result.workNum = Math.min(result.workNum, 2);
            result.carryNum = Math.min(result.carryNum, 1);
            result.moveNum = Math.min(result.moveNum, 1);
        }
        return result;
    }


}