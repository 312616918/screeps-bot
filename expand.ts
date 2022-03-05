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
            body: [WORK, WORK, WORK,WORK,
                CARRY,
                MOVE, MOVE, MOVE, MOVE],
            // body: [WORK, WORK, MOVE],
            // body: [MOVE],
            // body: [CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE],
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
            // creep.suicide();
            // //bite
            // let biteFlag = Game.flags["bite"];
            // if (creep.body.length == 1 && biteFlag) {
            //     creep.moveTo(biteFlag, {
            //         visualizePathStyle: {
            //             stroke: '#ffffff'
            //         }
            //     });
            //     continue;
            // }


            // //attack
            // if (creep.pos.y <= 48 && creep.pos.roomName == "W4N21" && creep.body.map(b => b.type).indexOf(RANGED_ATTACK) != -1) {
            //     let target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            //         filter: (c) => {
            //             console.log(creep.body.map(b => b.hits > 0 ? b.type : CARRY));
            //             return !c.my && creep.body.map(b => b.hits > 0 ? b.type : CARRY).indexOf(ATTACK) != -1;
            //         }
            //     })
            //     console.log(target);
            //     if (target) {
            //         if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE) {
            //             creep.moveTo(target, {
            //                 visualizePathStyle: {
            //                     stroke: '#ffffff'
            //                 }
            //             });
            //         }
            //         if (creep.pos.getRangeTo(target) <= 2) {
            //             creep.moveTo(new RoomPosition(40, 7, "W4N20"), {
            //                 visualizePathStyle: {
            //                     stroke: '#ffffff'
            //                 }
            //             });
            //         }
            //     }
            //     continue
            // }


            //to target room
            let targetRoomName = "W8N24";
            if (creep.pos.roomName != targetRoomName) {
                let tarPos = new RoomPosition(2, 21, targetRoomName);
                let flagIndex = 0;
                if (creep.memory["flagIndex"]) {
                    flagIndex = creep.memory["flagIndex"];
                }
                let index;
                let midFlag
                for (index = flagIndex + 1; index < 10; index++) {
                    midFlag = Game.flags["expand_mid_" + index];
                    if (midFlag) {
                        tarPos = midFlag.pos;
                        break;
                    }
                }

                creep.moveTo(tarPos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });

                if (index && midFlag && creep.pos.getRangeTo(midFlag) == 0) {
                    creep.memory["flagIndex"] = index;
                }
                continue;
            }

            //renew
            // let reRoomName = RoomName.W8N21;
            // if(creep.pos.roomName==reRoomName&&creep.memory["has_renewed"]){
            //     let cont = Game.getObjectById<STRUCTURE_CONTROLLER>("62231161f71be3cac3725456");
            //     if(cont.re)
            // }





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


            // let target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            // if(target){
            //     let wall = target.pos.findClosestByRange(FIND_STRUCTURES,{
            //         filter: (s) => {
            //             return s.structureType == STRUCTURE_WALL
            //         }
            //     })
            //     if(target.pos.getRangeTo(wall)<=4){
            //         if (creep.dismantle(wall) == ERR_NOT_IN_RANGE) {
            //             creep.moveTo(wall, {
            //                 visualizePathStyle: {
            //                     stroke: '#ffffff'
            //                 }
            //             });
            //         }
            //     }
            //     if (creep.store.getUsedCapacity("energy") > 20) {
            //         creep.build(target);
            //     }
            // }

            //harvest
            // let source = creep.pos.findClosestByRange<FIND_SOURCES>(FIND_SOURCES)
            let source = Game.getObjectById<Source>("5bbcac6f9099fc012e63572c")
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

            //dismantle
            // let target = Game.getObjectById<Structure>("606f4fdbe6f7f8d2504b237e")
            // if (target) {
            //     if (creep.dismantle(target) == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(target, {
            //             visualizePathStyle: {
            //                 stroke: '#ffffff'
            //             }
            //         });
            //     }
            // }

        }

        this.spawnCreeps()
    }
}