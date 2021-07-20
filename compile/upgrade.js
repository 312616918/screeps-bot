"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upgrade = void 0;
const baseModule_1 = require("./baseModule");
const spawn_1 = require("./spawn");
class Upgrade extends baseModule_1.BaseModule {
    constructor(roomName) {
        super(roomName);
        if (!Memory.upgrade) {
            Memory.upgrade = {};
        }
        if (!Memory.upgrade[this.roomName]) {
            Memory.upgrade[this.roomName] = {
                creepNameSet: new Set()
            };
        }
        let roomMemory = Memory.upgrade[this.roomName];
        this.creepNameSet = roomMemory.creepNameSet;
    }
    spawnCreeps() {
        if (this.creepNameSet.size >= 1) {
            return;
        }
        let room = Game.rooms[this.roomName];
        let creepName = "upgrade-" + Game.time;
        spawn_1.Spawn.reserveCreep({
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
            creep.harvest(target);
        }
    }
}
exports.Upgrade = Upgrade;
//# sourceMappingURL=upgrade.js.map