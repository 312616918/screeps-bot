import {BaseGroup, CreepPartConfig, GroupMemory} from "./BaseGroup";
import {roomConfigMap} from "./Config";
import {SpawnConfig} from "./Spawn";
import {Metric} from "./Metric";
import _ = require("lodash");

export type MineralHarvestMemory = {} & GroupMemory;


export type MineralHarvestCreepMemory = {
    targetId: string;
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}


export class MineralHarvestGroup extends BaseGroup<MineralHarvestMemory> {

    protected moduleName: string = "mineralHarvest";


    protected beforeRunEach(creepList: Creep[]) {
        // 监控资源开采
        let mineralList = this.roomFacility.getMineralList();
        for (let i in mineralList) {
            let amount = mineralList[i].mineralAmount;
            Metric.recordGauge(amount, "type", `mineral_amount_${i}`, "room", this.roomName);
        }
        let config = roomConfigMap[this.roomName].mineralHarvest;
        if (!config) {
            return;
        }

        //每10000个周期，检查有没有container
        if (Game.time % 10000 != 0) {
            return;
        }
        let workPos = new RoomPosition(config.workPos.x, config.workPos.y, this.roomName);
        if (workPos.lookFor(LOOK_STRUCTURES).some(s => s.structureType == STRUCTURE_CONTAINER)) {
            return;
        }
        if (workPos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
            return;
        }
        this.logInfo(`add container to ${workPos}`);
        this.roomFacility.getRoom().createConstructionSite(workPos, STRUCTURE_CONTAINER);
    }

    protected getSpawnConfigList(): SpawnConfig[] {
        let config = roomConfigMap[this.roomName].mineralHarvest;
        if (!config) {
            return;
        }
        if (this.memory.creepNameList.length > 0) {
            return;
        }
        if (Game.time % 10 != 0) {
            return;
        }
        let mineralList = this.roomFacility.getMineralList();
        if (mineralList.length != 1) {
            this.logError(`mineral list error: ${this.roomName}`);
            return;
        }
        if (mineralList[0].mineralAmount <= 0) {
            return;
        }

        let partConfig = this.getPartConfigByAuto();
        if (!partConfig) {
            return;
        }

        let body: BodyPartConstant[] = [];
        body = body.concat(_.times(partConfig.workNum, () => WORK),
            _.times(partConfig.moveNum, () => MOVE));

        let spawnConfigList: SpawnConfig[] = [];
        let workPos = new RoomPosition(config.workPos.x, config.workPos.y, this.roomName);
        spawnConfigList.push({
            body: body,
            memory: {
                module: this.moduleName,
                mineralHarvest: {
                    targetId: mineralList[0].id,
                    workPosition: workPos
                }
            },
            num: 1
        })
        return spawnConfigList;
    }

    protected runEachCreep(creep: Creep) {
        if(!creep.memory.mineralHarvest){
            this.logError(`creep memory error: ${creep.name}`);
            return;
        }
        let target = Game.getObjectById<Mineral>(creep.memory.mineralHarvest.targetId);
        if (!target) {
            return;
        }
        let pos = creep.memory.mineralHarvest.workPosition;
        if (pos) {
            let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
            if (creep.pos.getRangeTo(workPos)) {
                this.move.reserveMove(creep, workPos, 0);
                return;
            }
            delete creep.memory.mineralHarvest["workPosition"];
        }
        creep.harvest(target);
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    private getPartConfigByAuto(): CreepPartConfig {
        if (this.roomFacility.isInLowEnergy()) {
            return null;
        }

        let result: CreepPartConfig = {};
        let energyAmount = this.roomFacility.getCapacityEnergy();
        let startWorkerNum = 5;
        for (let i = startWorkerNum; i > 1; i--) {
            result.workNum = i;
            result.moveNum = 2;
            if (result.workNum < 5) {
                result.moveNum = 1;
            }
            if (this.getPartConfigCost(result) <= energyAmount) {
                return result;
            }
        }
        return null;
    }
}