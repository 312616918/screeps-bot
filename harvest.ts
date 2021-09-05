import {BaseModule} from "./baseModule";
import {RoomName} from "./config";
import {Spawn} from "./spawn";


export type HarvestMemory = {
    [roomName in RoomName]?: {
        creepNameSet: Set<string>;
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
    protected creepNameSet: Set<string>;

    constructor(roomName: RoomName) {
        super(roomName);
        if (!Memory.harvest) {
            Memory.harvest = {};
        }
        if (!Memory.harvest[this.roomName]) {
            Memory.harvest[this.roomName] = {
                creepNameSet: new Set<string>()
            }
        }
        let roomMemory = Memory.harvest[this.roomName];
        this.creepNameSet = roomMemory.creepNameSet;
    }

    protected spawnCreeps() {
        let targetsInfo = Memory.facility[this.roomName].sources;
        if (this.creepNameSet.size >= 1) {
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
            var target = Game.getObjectById<StructureController>(creep.memory.harvest.targetId);
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
            creep.upgradeController(target);
        }
    }
}