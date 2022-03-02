import {RoomName} from "./globalConfig";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {FacilityMemory} from "./facility";


export type ExpandMemory = {
    creepNameList: string[];
}

export type ExpandCreepMemory = {
    roomName: RoomName;
    // index: number;
    // targetId: string;
    // //工作地点，无此属性代表以就位
    // workPosition?: RoomPosition;
}

export class Expand {

    protected readonly roomName: RoomName;
    protected link: StructureLink;
    protected memory: ExpandMemory;
    protected fac: FacilityMemory;

    public constructor(roomName: RoomName, m: ExpandMemory, fac: FacilityMemory) {
        this.roomName = roomName;
        this.memory = m;
        this.fac = fac;
    }

    protected spawnCreeps() {

        // console.log("out sp")
        if (this.memory.creepNameList.length >= 0) {
            return;
        }
        // console.log("in sp")
        let room = Game.rooms[this.roomName];
        let creepName = "expand-" + Game.time + "-" + 0;
        Spawn.reserveCreep({
            bakTick: 0,
            body: [WORK, WORK, WORK,WORK,WORK,
                CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE],
            memory: {
                module: "expand",
                // upgrade: {
                //     roomName: this.roomName,
                //     index: Number.parseInt(i),
                //     targetId: room.controller.id,
                //     workPosition: pos
                // }
            },
            name: creepName,
            priority: 0,
            spawnNames: this.fac.spawnNames
        })
        this.memory.creepNameList.push(creepName);


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

            //to target room
            let targetRoomName = "W3N19";
            if (creep.pos.roomName != targetRoomName) {
                let tarPos = new RoomPosition(2, 39, targetRoomName);
                let midFlag = Game.flags["expand_mid"];
                if (midFlag) {
                    tarPos = midFlag.pos;
                }
                let avoidPos = [];
                for(let i = 0;i<50;i++){
                    avoidPos.push(new RoomPosition(i,4,this.roomName))
                }
                creep.moveTo(tarPos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    },
                    avoid:avoidPos
                });
                continue;
            }

            //claim controller
            let targetRoom = Game.rooms[targetRoomName];
            if (!targetRoom.controller.my) {
                if (creep.claimController(targetRoom.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetRoom.controller, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                    continue;
                }
            }

            //harvest
            let source = creep.pos.findClosestByRange<FIND_SOURCES>(FIND_SOURCES)
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }

            //build
            if (creep.store.getUsedCapacity("energy") > 20) {
                let target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                creep.build(target);
            }

        }

        this.spawnCreeps()
    }
}