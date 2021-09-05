"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Harvest = void 0;
const baseModule_1 = require("./baseModule");
const spawn_1 = require("./spawn");
class Harvest extends baseModule_1.BaseModule {
    constructor(roomName) {
        super(roomName);
        if (!Memory.harvest) {
            Memory.harvest = {};
        }
        if (!Memory.harvest[this.roomName]) {
            Memory.harvest[this.roomName] = {
                creepNameSet: new Set()
            };
        }
        let roomMemory = Memory.harvest[this.roomName];
        this.creepNameSet = roomMemory.creepNameSet;
    }
    spawnCreeps() {
        let targetsInfo = Memory.facility[this.roomName].sources;
        if (this.creepNameSet.size >= 1) {
            return;
        }
        let room = Game.rooms[this.roomName];
        let source = room.find(FIND_SOURCES)[0];
        let creepName = "harvest-" + Game.time;
        spawn_1.Spawn.reserveCreep({
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
        });
        this.creepNameSet.add(creepName);
    }
    recoveryCreep(creepName) {
        delete Memory.creeps[creepName];
        this.creepNameSet.delete(creepName);
    }
    run() {
        this.spawnCreeps();
        for (let creepName of this.creepNameSet) {
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            var target = Game.getObjectById(creep.memory.harvest.targetId);
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
exports.Harvest = Harvest;
//# sourceMappingURL=harvest.js.map