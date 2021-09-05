import {BaseModule} from "./baseModule";
import {RoomName} from "./config";
import {Spawn} from "./spawn";


export type UpgradeMemory = {
    [roomName in RoomName]?: {
        creepNameSet: Set<string>;
    }
}

export type UpgradeCreepMemory = {
    roomName: RoomName;

    targetId: string;
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}

export class Upgrade extends BaseModule {

    protected readonly roomName: RoomName;
    protected creepNameSet: Set<string>;

    public constructor(roomName: RoomName) {
        super(roomName);
        if (!Memory.upgrade) {
            Memory.upgrade = {};
        }
        if (!Memory.upgrade[this.roomName]) {
            Memory.upgrade[this.roomName] = {
                creepNameSet: new Set<string>()
            }
        }
        let roomMemory = Memory.upgrade[this.roomName];
        this.creepNameSet = roomMemory.creepNameSet;
    }

    protected spawnCreeps() {
        if (this.creepNameSet.size >= 1) {
            return;
        }
        let room = Game.rooms[this.roomName];
        let creepName = "upgrade-" + Game.time;

        Spawn.reserveCreep({
            bakTick: 0,
            body: [WORK, WORK, CARRY, MOVE],
            memory: {
                module: "upgrade",
                harvest: {
                    targetId: room.controller.id,
                    workPos: Memory.facility[this.roomName].upgrade.workPos
                }
            },
            name: creepName,
            priority: 0,
            spawnNames: []
        })
        this.creepNameSet.add(creepName);
    }

    protected recoveryCreep(creepName: string) {
        delete Memory.creeps[creepName];
        this.creepNameSet.delete(creepName);
    }

    run() {
        this.spawnCreeps()

        for (let creepName of this.creepNameSet) {
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            var target = Game.getObjectById<Source>(creep.memory.harvest.targetId);
            if (!target) {
                return;
            }
            let workPos = creep.memory.harvest.workPos;
            if (creep.pos.getRangeTo(workPos)) {
                creep.moveTo(workPos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                return;
            }
            creep.harvest(target);
        }
    }
}