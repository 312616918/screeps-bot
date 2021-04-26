// var finfra = require("./infra");


var invade = {

    spawnCreeps: function () {

        var creepPlan = [
            // {
            //     name: "Invader-CA-01",
            //     body: [
            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         ATTACK,ATTACK,ATTACK,CARRY,CARRY,
            //         MOVE,MOVE,MOVE,MOVE,MOVE
            //     ],
            //     memory: {
            //         // workPos: {
            //         //     x: 10,
            //         //     y: 25,
            //         //     roomName: "W2N16"
            //         // }
            //     }
            // },
            // {
            //     name: "Invader-CA-02",
            //     body: [
            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         ATTACK,ATTACK,ATTACK,CARRY,CARRY,
            //         MOVE,MOVE,MOVE,MOVE,MOVE
            //     ],
            //     memory: {
            //         // workPos: {
            //         //     x: 10,
            //         //     y: 25,
            //         //     roomName: "W2N16"
            //         // }
            //     }
            // },
            // {
            //     name: "Invader-CA-02",
            //     body: [CARRY,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             // x: 10,
            //             // y: 30,
            //             // roomName: "W2N15"
            //         }
            //     }
            // },
            // {
            //     name: "Invader-CL-01",
            //     body: [CLAIM, MOVE],
            //     memory: {
            //         workPos: {
            //             x: 24,
            //             y: 24,
            //             roomName: "W3N19"
            //         }
            //     }
            // },
            // {
            //     name: "Invader-CL-02",
            //     body: [CLAIM,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 10,
            //             y: 9,
            //             roomName: "W2N18"
            //         }
            //     }
            // },

        ]
        // return;
        for (let i in creepPlan) {
            if (Game.creeps[creepPlan[i].name]) {
                continue;
            }
            if (Game.spawns['Spawn4'].spawnCreep(creepPlan[i].body, creepPlan[i].name, {
                    memory: creepPlan[i].memory
                }) != OK) {
                console.log("[SpawnCreep]:" + creepPlan[i].name + "-wait");
            } else {
                console.log("[SpawnCreep]:" + creepPlan[i].name + "-OK");
            };
            break;
        }

    },

    run: function (creep) {

        // if(creep.name.indexOf("CA")!=-1){

        //     if(Game.flags["Flag4"]){
        //         creep.moveTo(Game.flags["Flag4"], {
        //             visualizePathStyle: {
        //                 stroke: '#ffaa00'
        //             }
        //         });
        //     }

        //     // if()
        //     // creep.withdraw(creep.pos.findClosestByPath(FIND_STRUCTURES,{
        //     //     filter:(s)=>{return s.store&&s.store.getUsedCapacity(RESOURCE_ENERGY)}
        //     // }),RESOURCE_ENERGY);
        //     // creep.drop(RESOURCE_ENERGY);
        //     return;
        // }
        // if(creep.name.indexOf("CL")!=-1){
        //     creep.claimController(creep.room.controller);
        // }

        // // creep.heal(creep);
        // // let h=creep.pos.findClosestByRange(FIND_MY_CREEPS,{
        // //     filter:(c)=>{return c.hits<c.hitsMax}
        // // })
        // // if (creep.heal(h) == ERR_NOT_IN_RANGE) {
        // //     creep.rangedHeal(h);
        // // }


        // // if(Game.flags["Flag1"]){
        // //     creep.moveTo(Game.flags["Flag1"], {
        // //         visualizePathStyle: {
        // //             stroke: '#ffaa00'
        // //         }
        // //     });
        // // }

        // // if(Game.flags["Flag2"]){
        // //     creep.attack(Game.flags["Flag2"].pos.lookFor(LOOK_STRUCTURES)[0]);
        // // }

        // // if(Game.flags["Flag3"]){
        // //     creep.withdraw(Game.flags["Flag3"].pos.lookFor(LOOK_STRUCTURES)[0],RESOURCE_ENERGY);
        // // }

        // // if(creep.store.getUsedCapacity()){
        // //     creep.drop(RESOURCE_ENERGY);
        // // }



        // return;


        let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
        // console.log(creep.pos.getRangeTo(tarPos))
        if (creep.pos.getRangeTo(tarPos)) {
            if (Game.flags["Flag1"]) {
                creep.moveTo(Game.flags["Flag1"], {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            } else {
                creep.moveTo(tarPos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }

            return;
        }

        if (creep.name.indexOf("CA") != -1) {
            creep.withdraw(creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.store && s.store.getUsedCapacity(RESOURCE_ENERGY)
                }
            }), RESOURCE_ENERGY);
            creep.drop(RESOURCE_ENERGY);
        }
        if (creep.name.indexOf("CL") != -1) {
            creep.claimController(creep.room.controller);
        }

        return;

        if (creep.memory.linkId) {
            let link = Game.getObjectById(creep.memory.linkId);
            let container = Game.getObjectById(creep.memory.containerId);
            if (link.store.getUsedCapacity(RESOURCE_ENERGY)) {

                creep.withdraw(link, RESOURCE_ENERGY)
                creep.transfer(container, RESOURCE_ENERGY, creep.store.getUsedCapacity(RESOURCE_ENERGY) - 50);
            } else {
                creep.withdraw(container, RESOURCE_ENERGY)
            }
            // if (creep.store.getUsedCapacity() <= 20) {
            //     creep.memory.needEnergy = true;
            // } else {
            //     creep.memory.needEnergy = false;
            // }




        } else {
            if (creep.store.getUsedCapacity() <= 50) {
                creep.memory.needEnergy = true;
            } else {
                creep.memory.needEnergy = false;
            }
        }



        creep.memory.needEnergy = false;


        creep.upgradeController(Game.rooms[creep.memory.workPos.roomName].controller);

        // creep.build(Game.getObjectById("5f6847cec79a3b4a068339b3"));


    }
}

module.exports = invade;