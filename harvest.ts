import {BaseModule} from "./baseModule";
import {RoomName} from "./config";
import {Spawn} from "./spawn";
import * as _ from "lodash";


export type HarvestMemory = {
    [roomName in RoomName]?: {
        creepNameList: string[];
    }
}


export type HarvestCreepMemory = {
    roomName: RoomName;
    targetId: string;
    towerIds: string[];
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}

export class Harvest extends BaseModule {

    protected readonly roomName: RoomName;
    protected creepNameList: string[];

    constructor(roomName: RoomName) {
        super(roomName);
        if (!Memory.harvest) {
            Memory.harvest = {};
        }
        if (!Memory.harvest[this.roomName]) {
            Memory.harvest[this.roomName] = {
                creepNameList: []
            }
        }
        let roomMemory = Memory.harvest[this.roomName];
        this.creepNameList = roomMemory.creepNameList;
    }

    protected spawnCreeps() {
        let sourceConfig = Memory.facility[this.roomName].sources;
        let sourceCreepTicks: {
            [sourceId: string]: number
        } = {};
        for (let creepName of this.creepNameList) {
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
        for (let sourceId in sourceConfig) {
            let config = sourceConfig[sourceId];
            let remainTicks = sourceCreepTicks[sourceId];
            if (remainTicks != undefined && remainTicks > 20) {
                continue;
            }
            let bodys = [WORK, WORK, WORK, WORK, WORK,
                CARRY,
                MOVE, MOVE];
            let room = Game.rooms[this.roomName];
            if (room.energyAvailable < 700) {
                bodys = [WORK, WORK, CARRY, MOVE]
            }
            let creepName = "harvest-" + Game.time;
            Spawn.reserveCreep({
                bakTick: 0,
                body: bodys,
                memory: {
                    module: "harvest",
                    harvest: {
                        roomName: this.roomName,
                        targetId: sourceId,
                        towerIds: config.towerIds,
                        workPosition: config.harvestPos
                    }
                },
                name: creepName,
                priority: 0,
                spawnNames: ["Spawn1"]
            })
            this.creepNameList.push(creepName);
        }
    }

    protected recoveryCreep(creepName: string) {
        delete Memory.creeps[creepName];
        _.remove(this.creepNameList, function (e) {
            return e == creepName;
        })
    }

    run() {

        for (let creepName of this.creepNameList) {
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

            let roomFac = Memory.facility[this.roomName];
            if (roomFac) {
                let sourceConfig = roomFac.sources[creep.memory.harvest.targetId];
                let link = Game.getObjectById<StructureLink>(sourceConfig.linkId);
                if (link
                    && link.store.getFreeCapacity("energy") > 0
                    && creep.store.getFreeCapacity("energy") == 0) {
                    creep.transfer(link, "energy");
                }
            }

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


        }

        this.spawnCreeps()
    }
}