//@ts-check
var spawn = require("./spawn")

var upgrade = {

    spawnCreeps: function () {

        var creepPlan = [{
                name: "RemoteHarvester-01",
                body: [WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE
                ],
                memory: {
                    sourceId: "5ff1208fb7ad23dd0cece65f"
                },
                bakTick: 200
            },
            {
                name: "RemoteHarvester-Carry-01",
                body: [CARRY, CARRY, 
                    MOVE, MOVE
                ],
                memory: {
                    sourceId: "5ff1208fb7ad23dd0cece65f"
                },
                bakTick: 50
            }
        ]

        let fac = Memory.facility;

        for (let i in creepPlan) {

            /**
             * @type Deposit
             */
            let target=Game.getObjectById(creepPlan[i].memory.sourceId);
            if(!target||target.lastCooldown>150){
                return;
            }

            /**
             * @type SpawnTemplate
             */
            let plan = {
                name: creepPlan[i].name,
                body: creepPlan[i].body,
                memory: creepPlan[i].memory,
                priority: 3,
                spawnNames: fac["W3N19"].spawnNames

            }

            spawn.reserveCreep(plan)
        }

        // for (let i in creepPlan) {
        //     if (Game.creeps[creepPlan[i].name]) {
        //         continue;
        //     }
        //     if (Game.spawns['Spawn2'].spawnCreep(creepPlan[i].body, creepPlan[i].name, {
        //             memory: creepPlan[i].memory
        //         }) != OK) {
        //         console.log("[SpawnCreep]:" + creepPlan[i].name + "-wait");
        //     } else {
        //         console.log("[SpawnCreep]:" + creepPlan[i].name + "-OK");
        //     };
        //     break;
        // }

    },

    /**
     * 
     * @param {Creep} creep 
     */
    run: function (creep) {

        let target = Game.getObjectById(creep.memory.sourceId);
        if (creep.name.indexOf("Carry") != -1) {
            let storage = Game.getObjectById("5f967652d05ff6480ff9a69d");
            if (creep.store.getUsedCapacity()) {
                if (creep.transfer(storage, RESOURCE_SILICON) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                }
                return;
            }
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });
            return;
        }

        if(creep.store.getFreeCapacity()==0){
            return;
        }

        if(creep.harvest(target)==ERR_NOT_IN_RANGE){
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });
            return;
        }
        creep.transfer(Game.creeps["RemoteHarvester-Carry-01"],RESOURCE_SILICON);
    }
}

module.exports = upgrade;