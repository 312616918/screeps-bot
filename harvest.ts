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
        let targetsInfo = Memory.facility[this.roomName].sources;
        if (this.creepNameList.length >= 1) {
            return;
        }
        let room = Game.rooms[this.roomName];
        let source = room.find(FIND_SOURCES)[0];
        let creepName = "harvest-" + Game.time;

        Spawn.reserveCreep({
            bakTick: 0,
            body: [WORK, WORK, MOVE],
            memory: {
                module: "harvest",
                harvest: {
                    targetId: source.id,
                    workPos: targetsInfo[source.id].harvestPos
                }
            },
            name: creepName,
            priority: 0,
            spawnNames: ["Spawn-W23S23-01"]
        })
        this.creepNameList.push(creepName);
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
            let pos = creep.memory.harvest.workPos;
            if(pos){
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
        }

        this.spawnCreeps()
    }
}