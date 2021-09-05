//@ts-check

var spawn = require("../spawn")

let config={
    "5bbcaca69099fc012e635f07":{
        /**
         * @type CenterSource
         */
        memory:{
            enable: false,
            isSafe: false,
            isInvaded:false,
            harvestPos: {
                x: 42,
                y: 8,
                roomName: "W4N15"
            },
            targetId:"5f7d1538f1269111316998f5",
            safePoint: {
                x: 5,
                y: 12,
                roomName: "W3N15"
            }
        },
        creepPlan:{
            harvester:{
                name: "RemoteHarvester-01",
                body: [WORK, WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,
                    CARRY,
                    MOVE,MOVE,MOVE,MOVE
                ],
                bakTick:50
            },
            attacker:{
                name: "Attacker-01",
                body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH,

                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,

                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,

                    HEAL,HEAL
                ],
                bakTick:300
            },
            carrier:{
                namePrefix: "RemoteCarrier-A-",
                amount: 2,
                body: [CARRY, CARRY, CARRY, CARRY,
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE
                ]
            }
        }
    }
}



var centerSource = {

    initMemory: function () {

        for(let id in config){
            let c=config[id]
            // Memory.centerSource[id]=
        }


        // if (Memory.centerSource == undefined) {
        //     Memory.centerSource = {
        //         "5bbcaca69099fc012e635f07": {
        //             enable: false,
        //             isSafe: false,
        //             harvestPos: {
        //                 x: 42,
        //                 y: 8,
        //                 roomName: "W4N15"
        //             },
        //             safePoint: {
        //                 x: 5,
        //                 y: 12,
        //                 roomName: "W3N15"
        //             }
        //         },
        //         "5bbcaca69099fc012e635f0d": {
        //             enable: false,
        //             isSafe: false,
        //             harvestPos: {
        //                 x: 37,
        //                 y: 44,
        //                 roomName: "W4N15"
        //             },
        //             safePoint: {
        //                 x: 10,
        //                 y: 38,
        //                 roomName: "W3N15"
        //             }
        //         }
        //     }
        // }
    },

    spawnCreeps: function () {

        let cs = Memory.centerSource;
        let fac = Memory.facility;
        var creepPlan = [{
                name: "RemoteHarvester-01",
                body: [WORK, WORK, WORK, WORK, WORK,
                    WORK, WORK, WORK,
                    CARRY,
                    MOVE, MOVE, MOVE, MOVE
                ],
                sourceId: "5bbcaca69099fc012e635f07",
                bakTick: 50
            },
            {
                name: "RemoteHarvester-02",
                body: [WORK, WORK, WORK, WORK, WORK,
                    WORK, WORK, WORK,
                    CARRY,
                    MOVE, MOVE, MOVE, MOVE
                ],
                sourceId: "5bbcaca69099fc012e635f0d",
                bakTick: 50
            }
        ]

        for (let i in creepPlan) {

            let plan = creepPlan[i];
            let sourceNode = cs[plan.sourceId];
            if (!sourceNode || !sourceNode.enable) {
                continue;
            }

            /**
             * @type SpawnTemplate
             */
            let template = {
                name: plan.name,
                body: plan.body,
                spawnNames: fac["W3N15"].spawnNames,
                priority: 5,
                memory: {
                    workPos: sourceNode.harvestPos,
                    sourceId: plan.sourceId
                }
            }

            spawn.reserveCreepBak(template, plan.bakTick);
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

    run: function (creep) {

        // if(creep.hits<creep.hitsMax){
        //     creep.heal(creep);
        // }else if(Game.creeps["Attacker-01"]&&Game.creeps["Attacker-01"].hits<Game.creeps["Attacker-01"].hitsMax){
        //     if(creep.heal(Game.creeps["Attacker-01"])==ERR_NOT_IN_RANGE){
        //         creep.rangedHeal(Game.creeps["Attacker-01"]);
        //     }
        // }

        let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
        if (creep.pos.getRangeTo(tarPos)) {
            creep.moveTo(tarPos);
        } else {
            creep.harvest(Game.getObjectById(creep.memory.sourceId));

            // var con=Game.getObjectById("5f59c6fb63f2a98799947056");
            var con = creep.pos.findClosestByRange(FIND_STRUCTURES);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < 20) {
                if (creep.pos.getRangeTo(con) < 4 && con.hits < con.hitsMax) {
                    creep.repair(con);
                } else {
                    creep.transfer(con, RESOURCE_ENERGY);
                }
                creep.build(creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES))
            }
        }
    }
}

module.exports = centerSource;