import {BaseModule} from "./baseModule";
import {RoomName} from "./config";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {Carry} from "./carry";


export type UpgradeMemory = {
    [roomName in RoomName]?: {
        creepNameList: string[];
    }
}

export type UpgradeCreepMemory = {
    roomName: RoomName;
    index: number;
    targetId: string;
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}

export class Upgrade extends BaseModule {

    protected readonly roomName: RoomName;
    protected creepNameList: string[];
    protected link: StructureLink;

    public constructor(roomName: RoomName) {
        super(roomName);
        if (!Memory.upgrade) {
            Memory.upgrade = {};
        }
        if (!Memory.upgrade[this.roomName]) {
            Memory.upgrade[this.roomName] = {
                creepNameList: []
            }
        }
        let roomMemory = Memory.upgrade[this.roomName];
        this.creepNameList = roomMemory.creepNameList;
        let roomFac = Memory.facility[this.roomName];
        if (roomFac && roomFac.upgrade) {
            this.link = Game.getObjectById(roomFac.upgrade.linkId);
        }
    }

    protected spawnCreeps() {

        let workPositions = Memory.facility[this.roomName].upgrade.wordPositions;
        if (!workPositions) {
            return;
        }
        if (this.creepNameList.length >= workPositions.length) {
            return;
        }
        let room = Game.rooms[this.roomName];
        for (let i in workPositions) {
            let isExist = false;
            for (let creepName of this.creepNameList) {
                let creep = Game.creeps[creepName];
                if (!creep) {
                    continue;
                }
                if (creep.memory.upgrade.index == Number.parseInt(i)) {
                    isExist = true;
                    break;
                }
            }
            if (isExist) {
                continue;
            }
            let pos = workPositions[i];
            let creepName = "upgrade-" + Game.time + "-" + i;
            Spawn.reserveCreep({
                bakTick: 0,
                body: [WORK, WORK,
                    CARRY,
                    MOVE],
                memory: {
                    module: "upgrade",
                    upgrade: {
                        roomName: this.roomName,
                        index: Number.parseInt(i),
                        targetId: room.controller.id,
                        workPosition: pos
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
            var target = Game.getObjectById<StructureController>(creep.memory.upgrade.targetId);
            if (!target) {
                return;
            }
            let pos = creep.memory.upgrade.workPosition;
            // let workPos = pos;
            if (pos) {
                let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
                if (creep.pos.getRangeTo(workPos)) {
                    creep.moveTo(workPos, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                    // return;
                } else {
                    delete creep.memory.upgrade["workPosition"];
                }
            }
            creep.upgradeController(target);
            if (creep.store.getFreeCapacity() <= 20) {
                continue;
            }
            if (this.link && this.link.store.getUsedCapacity("energy") != 0) {
                creep.withdraw(this.link, "energy");
                continue;
            }
            let carryModule = Carry.entities[this.roomName];
            if (carryModule) {
                carryModule.addCarryReq(creep, "input", "energy", creep.store.getCapacity() + 400);
            }

        }
        this.spawnCreeps()
    }
}