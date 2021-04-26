//@ts-check
var spawn = require("./spawn")

var build = {

    spawnCreeps: function () {

        let fac = Memory.facility;
        for (let roomName in fac) {
            let room = Game.rooms[roomName];
            if (!room || !room.controller) {
                continue;
            }
            let sites = room.find(FIND_CONSTRUCTION_SITES);
            if (sites.length) {

                /**
                 * @type SpawnTemplate
                 */
                let plan = {
                    name: "Builder-" + roomName,
                    body: [WORK,WORK,WORK,WORK,
                        CARRY,CARRY,CARRY,
                        MOVE,MOVE
                    ],
                    memory: {
                        roomName: roomName,
                        targetId: sites[0].id
                    },
                    priority: 3,
                    spawnNames: fac[roomName].spawnNames

                }

                // if (Game.creeps[plan.name]) {
                //     // continue;
                // }
                // for (let i = 0; i < 3; i++) {
                //     spawn.reserveCreep({
                //         name:plan.name+"-"+i,
                //         body:plan.body,
                //         memory:plan.memory,
                //         priority:plan.priority,
                //         spawnNames:plan.spawnNames
                //     });
                //     // plan.name += ("-"+i)
                // }



                spawn.reserveCreep(plan);

            }
        }

    },

    /**
     * 
     * @param {Creep} creep 
     */
    run: function (creep) {

        let target = Game.getObjectById(creep.memory.targetId);

        creep.withdraw(Game.getObjectById("5facec696df379517e47ec8f"),"energy")

        creep.pickup(creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES))

        if (!target) {
            target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            if (target) {
                creep.memory.targetId = target.id;
            }
            return;
        }

        if (creep.pos.getRangeTo(target) > 1) {
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });
        } else {
            creep.build(target);
            creep.memory.needEnergy = creep.store.getFreeCapacity();
        }
    }
}

module.exports = build;