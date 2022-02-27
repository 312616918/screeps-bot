import {BaseModule} from "./baseModule";
import {RoomName} from "./config";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {Carry} from "./carry";


export type BuildMemory = {
    [roomName in RoomName]?: {
        creepNameList: string[];
    }
}

export type BuildCreepMemory = {
    roomName: RoomName;
    targetId: string;
}


export class Build extends BaseModule {

    protected readonly roomName: RoomName;
    creepNameList: string[];

    public constructor(roomName: RoomName) {
        super(roomName);
        if (!Memory.build) {
            Memory.build = {};
        }
        if (!Memory.build[this.roomName]) {
            Memory.build[this.roomName] = {
                creepNameList: []
            }
        }
        let roomMemory = Memory.build[this.roomName];
        this.creepNameList = roomMemory.creepNameList;
    }

    protected spawnCreeps() {

        if (this.creepNameList.length >= 1) {
            return;
        }
        let room = Game.rooms[this.roomName];
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length == 0) {
            return;
        }

        let creepName = "build-" + Game.time;

        Spawn.reserveCreep({
            bakTick: 0,
            body: [WORK,  CARRY, MOVE],
            memory: {
                module: "build",
                build: {
                    roomName: this.roomName,
                    targetId: "",
                }
            },
            name: creepName,
            priority: 0,
            spawnNames: ["Spawn1"]
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
            let target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            if (!target) {
                return;
            }
            let res = creep.build(target);
            if (res == ERR_NOT_IN_RANGE) {
                if (creep.pos.getRangeTo(target)) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            }
            if (creep.store.getFreeCapacity() > 20) {
                let carryModule = Carry.entities[this.roomName];
                if (carryModule) {
                    carryModule.addCarryReq(creep, "input", "energy", creep.store.getCapacity() + 600);
                }
            }
        }
        this.spawnCreeps()
    }

}