import {BaseModule} from "./baseModule";
import {RoomName} from "./globalConfig";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {Carry} from "./carry";
import {FacilityMemory} from "./facility";


export type BuildMemory = {
    creepNameList: string[];
}

export type BuildCreepMemory = {
    roomName: RoomName;
    targetId: string;
}


export class Build {

    protected readonly roomName: RoomName;
    protected memory: BuildMemory;
    protected fac: FacilityMemory;

    public constructor(roomName: RoomName, m: BuildMemory, fac: FacilityMemory) {
        this.roomName = roomName;
        this.memory = m;
        this.fac = fac;
    }

    protected spawnCreeps() {

        if (this.memory.creepNameList.length >= 1) {
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
            body: [WORK, CARRY, MOVE],
            memory: {
                module: "build",
                build: {
                    roomName: this.roomName,
                    targetId: "",
                }
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