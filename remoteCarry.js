// var finfra = require("./infra");


var carry = {

    spawnCreeps: function () {


        var creepPlan = [{
            namePrefix: "RemoteCarrier-A-",
            amount: 2,
            body: [CARRY, CARRY, CARRY, CARRY,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE
            ],
            memory: {
                sourceId: "5bbcaca69099fc012e635f07",
                targetId: "5f7d1538f1269111316998f5"
            }
        }, {
            namePrefix: "RemoteCarrier-B-",
            amount: 2,
            body: [CARRY, CARRY, CARRY, CARRY,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE
            ],
            memory: {
                sourceId: "5bbcaca69099fc012e635f0d",
                targetId: "5f7d19169b5f8b3f9a9a3336"
            }
        }];

        if (!Memory.attackTime&&false) {

            for (let i in creepPlan) {
                let plan = creepPlan[i];
                for (let i = 0; i < plan.amount; i++) {
                    let name = plan.namePrefix + i;
                    if (Game.creeps[name]) {
                        continue;
                    }
                    if (Game.spawns['Spawn2'].spawnCreep(plan.body, name, {
                            memory: plan.memory
                        }) != OK) {
                        console.log("[SpawnCreep]:" + name + "-wait");
                    } else {
                        console.log("[SpawnCreep]:" + name + "-OK");
                    };
                    break;
                }

            }
        }








        // var creepPlan = [

        //     {
        //         name: "RemoteCarrier-01",
        //         body: [CARRY, CARRY, CARRY, CARRY,
        //             CARRY, CARRY, CARRY, CARRY,
        //             MOVE, MOVE, MOVE, MOVE
        //         ],
        //         memory: {
        //             sourceId: "5f71f8edc089314e41267de9",
        //             targetId: "5f52743fec448e69c2bc19e6"
        //         }
        //     },
        // ]
        // for (let i in creepPlan) {
        //     if (Game.creeps[creepPlan[i].name]) {
        //         continue;
        //     }
        //     if (Game.spawns['Spawn1'].spawnCreep(creepPlan[i].body, creepPlan[i].name, {
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
        // var target=Game.getObjectById(creep.memory.targetId);
        // creep.moveTo(target, {
        //     visualizePathStyle: {
        //         stroke: '#ffffff'
        //     }
        // });
        // return;
        // creep.memory.targetId="5f61d7a3f795e6c9432a8e87";

        // creep.transfer(Game.getObjectById("5f6d53566a2c0d1499b18455"),RESOURCE_CATALYST)

        if (creep.store.getUsedCapacity()) {
            var target = Game.getObjectById(creep.memory.targetId);
            // if(target.store.getFreeCapacity(RESOURCE_ENERGY)<400){
            //     target=Game.getObjectById("5f61d7a3f795e6c9432a8e87")
            // }



            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });

            creep.transfer(target, RESOURCE_ENERGY);
            return;

        }


        var source = Game.getObjectById(creep.memory.sourceId);

        if(creep.name.indexOf("-A-")!=-1||creep.name.indexOf("-B-")!=-1){
            source=Game.getObjectById(creep.memory.sourceId).pos.findClosestByRange(FIND_STRUCTURES,{
                filter:(s)=>{
                    return s.structureType == STRUCTURE_CONTAINER
                }
            })
        }
        if (source.store.getFreeCapacity(RESOURCE_ENERGY)) {

            let dropEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (d) => {
                    return d.resourceType == RESOURCE_ENERGY && creep.pos.getRangeTo(d) < 10
                }
            });
            if (dropEnergy) {
                creep.moveTo(dropEnergy, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                creep.pickup(dropEnergy);
                return;
            }

            let tomb = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                filter: (s) => {
                    return s.store && s.store.getUsedCapacity(RESOURCE_ENERGY) && creep.pos.getRangeTo(s) < 10
                }
            });

            if (tomb&&tomb.store.getUsedCapacity(RESOURCE_ENERGY)) {
                // console.log(tomb)
                source = tomb;
            }
        }


        // console.log("!23")
        if (source.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            return;
        }

        creep.moveTo(source, {
            visualizePathStyle: {
                stroke: '#ffffff'
            }
        });

        creep.withdraw(source, RESOURCE_ENERGY);
        return;

    }
}

module.exports = carry;