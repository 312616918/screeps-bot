import {globalConfig, RoomName} from "./globalConfig";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {FacilityMemory} from "./facility";


enum TurningStage{

}

let locConfig:{
    [i:number]:number[]
}={
    0:[0,1],
    1:[2,3]
}

export type GroupMemory = {
    creepNameList: string[];
    direction:DirectionConstant;
}


export type GroupCreepMemory = {
    roomName: RoomName;
    targetId: string;
    towerIds: string[];
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}

export class Group {

    protected readonly roomName: RoomName;
    protected memory: GroupMemory;
    protected fac: FacilityMemory;

    constructor(roomName: RoomName, m: GroupMemory, fac: FacilityMemory) {
        this.roomName = roomName;
        this.memory = m;
        this.fac = fac;
    }

    protected spawnCreeps() {
        let sourceConfig = globalConfig[this.roomName].harvest;
        let sourceCreepTicks: {
            [sourceId: string]: number
        } = {};
        for (let creepName of this.memory.creepNameList) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }

            let targetId = creep.memory.harvest.targetId;
            let beforeTicks = sourceCreepTicks[targetId];
            let remainTicks = creep.ticksToLive;
            if (beforeTicks == undefined || beforeTicks < remainTicks) {
                sourceCreepTicks[targetId] = remainTicks;
            }
        }
        for (let cc of sourceConfig.creepConfigs) {
            let sourceId = ""
            for (let sId in this.fac.sources) {
                let sc = this.fac.sources[sId];
                if (cc.pos.x == sc.harvestPos.x && cc.pos.y == sc.harvestPos.y) {
                    sourceId = sId;
                    break;
                }
            }
            let remainTicks = sourceCreepTicks[sourceId];
            if (remainTicks != undefined && remainTicks > 20) {
                continue;
            }
            let bodys: BodyPartConstant[] = [];
            for (let part in sourceConfig.defaultParts) {
                let partAmount = sourceConfig.defaultParts[part];
                bodys = bodys.concat(new Array(partAmount).fill(part))
            }
            // let room = Game.rooms[this.roomName];
            // if (room.energyAvailable < 700) {
            //     bodys = [WORK, WORK, CARRY, MOVE]
            // }
            let creepName = `harvest-${this.roomName}-${Game.time}`;
            Spawn.reserveCreep({
                bakTick: 0,
                body: bodys,
                memory: {
                    module: "harvest",
                    harvest: {
                        roomName: this.roomName,
                        targetId: sourceId,
                        towerIds: this.fac.sources[sourceId].towerIds,
                        workPosition: cc.pos
                    }
                },
                name: creepName,
                priority: 0,
                spawnNames: this.fac.spawnNames
            })
            this.memory.creepNameList.push(creepName);
        }
    }

    protected recoveryCreep(creepName: string) {
        delete Memory.creeps[creepName];
        _.remove(this.memory.creepNameList, function (e) {
            return e == creepName;
        })
    }

    run() {

        for (let creepName of this.memory.creepNameList) {
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            var target = Game.getObjectById<Source>(creep.memory.harvest.targetId);
            if (!target) {
                return;
            }
            let pos = creep.memory.harvest.workPosition;
            if (pos) {
                // let workPos = pos;
                let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
                if (creep.pos.getRangeTo(workPos)) {
                    creep.moveTo(workPos, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                    return;
                }
                delete creep.memory.harvest["workPos"];
            }
            creep.harvest(target);

            // let sourceConfig = this.fac.sources[creep.memory.harvest.targetId];
            // let link = Game.getObjectById<StructureLink>(sourceConfig.linkId);
            // if (link
            //     && link.store.getFreeCapacity("energy") > 0
            //     && creep.store.getFreeCapacity("energy") == 0) {
            //     creep.transfer(link, "energy");
            // }

            //transfer tower 高优先级
            let towerIds = creep.memory.harvest.towerIds;
            if (towerIds) {
                for (let id of towerIds) {
                    let tower = Game.getObjectById<StructureTower>(id);
                    if (tower.store.getFreeCapacity("energy") >= 50) {
                        creep.transfer(tower, "energy");
                    }
                }
            }
            if (creep.store.getUsedCapacity("energy") > 20) {

                let target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                creep.build(target);

            }

            // if(this.fac.sources[creep.memory.harvest.targetId].controllerId){
            //     let controller = Game.getObjectById(this.fac.sources[creep.memory.harvest.targetId].controllerId)
            //     if(controller){
            //         target.
            //     }
            // }
        }
        this.spawnCreeps()
    }
}