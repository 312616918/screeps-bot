// var finfra = require("./infra");

// var carry=require("./carry")


var upgrade = {

    spawnCreeps: function () {

        var creepPlan = [{
                name: "Upgrader-01",
                spawnName: "Spawn2",
                body: [WORK, WORK, WORK, WORK, WORK,
                    // WORK, WORK, WORK, WORK, WORK,
                    // WORK, WORK, WORK, WORK, WORK,
                    // WORK, WORK, WORK, WORK, WORK,
                    // WORK, WORK, WORK, WORK, WORK,
                    CARRY, CARRY,
                    // MOVE, MOVE, MOVE,
                    MOVE, MOVE
                ],
                memory: {
                    workPos: {
                        x: 21,
                        y: 30,
                        roomName: "W3N15"
                    },
                    linkId: "5f6846a59b3005dcb256e128",
                    containerId: "5f6d4c59b3ee3a3f78723ee1"
                }
            },
            {
                name: "Upgrader-02",
                spawnName: "Spawn3",
                body: [WORK, WORK, WORK, WORK,
                    CARRY,
                    MOVE, MOVE
                ],
                memory: {
                    workPos: {
                        x: 9,
                        y: 37,
                        roomName: "W2N16"
                    },
                    // linkId: "5f7c18468591b317c1e2b422"
                }
            },
            {
                name: "Upgrader-W2N18-01",
                spawnName: "Spawn4",
                body: [WORK, WORK, WORK, WORK,
                    CARRY,
                    MOVE, MOVE
                ],
                memory: {
                    workPos: {
                        x: 14,
                        y: 12,
                        roomName: "W2N18"
                    },
                    containerId: "604b9f0b219bf5e72f13a1f6"
                }
            },
            {
                name: "Upgrader-W7N16-01",
                spawnName: "Spawn7",
                body: [WORK, WORK, WORK, WORK,
                    CARRY,CARRY,
                    MOVE, MOVE
                ],
                memory: {}
            },

            // {
            //     name: "Upgrader-W7N16-03",
            //     spawnName: "Spawn7",
            //     body: [WORK, WORK, WORK, WORK,WORK,
            //         WORK, WORK, WORK, WORK,WORK,
            //         CARRY,CARRY,
            //         MOVE, MOVE,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 42,
            //             y: 26,
            //             roomName: "W7N16"
            //         }
            //     }
            // },
            // {
            //     name: "Upgrader-W7N16-04",
            //     spawnName: "Spawn7",
            //     body: [WORK, WORK, WORK, WORK,WORK,
            //         WORK, WORK, WORK, WORK,WORK,
            //         CARRY,CARRY,
            //         MOVE, MOVE,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 40,
            //             y: 28,
            //             roomName: "W7N16"
            //         }
            //     }
            // },
            // {
            //     name: "Upgrader-W7N16-05",
            //     spawnName: "Spawn7",
            //     body: [WORK, WORK, WORK, WORK,WORK,
            //         WORK, WORK, WORK, WORK,WORK,
            //         CARRY,CARRY,
            //         MOVE, MOVE,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 42,
            //             y: 28,
            //             roomName: "W7N16"
            //         }
            //     }
            // },
            // {
            //     name: "Upgrader-W7N16-06",
            //     spawnName: "Spawn7",
            //     body: [WORK, WORK, WORK, WORK,WORK,
            //         WORK, WORK, WORK, WORK,WORK,
            //         CARRY,CARRY,
            //         MOVE, MOVE,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 41,
            //             y: 26,
            //             roomName: "W7N16"
            //         }
            //     }
            // },
            // {
            //     name: "Upgrader-W7N16-07",
            //     spawnName: "Spawn7",
            //     body: [WORK, WORK, WORK, WORK,WORK,
            //         WORK, WORK, WORK, WORK,WORK,
            //         CARRY,CARRY,
            //         MOVE, MOVE,MOVE
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 42,
            //             y: 27,
            //             roomName: "W7N16"
            //         }
            //     }
            // }

        ]
        // return;
        for (let i in creepPlan) {

            try {
                            
                if (Game.creeps[creepPlan[i].name]) {
                    continue;
                }
                if (Game.spawns[creepPlan[i].spawnName].spawnCreep(creepPlan[i].body, creepPlan[i].name, {
                        memory: creepPlan[i].memory
                    }) != OK) {
                    console.log("[SpawnCreep]:" + creepPlan[i].name + "-wait");
                } else {
                    console.log("[SpawnCreep]:" + creepPlan[i].name + "-OK");
                };
                break;
            } catch (error) {
                console.log(error);
                console.log("[SpawnCreep]:" + creepPlan[i].name + "-error");
            }
            

        }

    },

    run: function (creep) {
        if (creep.memory.workPos == undefined) {
            creep.memory.workPos = Memory.facility[creep.room.name].upgrade.workPos;
        }
        let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
        if (creep.pos.getRangeTo(tarPos)) {
            creep.moveTo(tarPos);
            return;
        }


        let fac = Memory.facility;

        let roomName = creep.memory.workPos.roomName;
        let roomFac = fac[roomName];
        if (roomFac.upgrade.towerIds) {
            for (let i in roomFac.upgrade.towerIds) {
                let id = roomFac.upgrade.towerIds[i];
                let tower = Game.getObjectById(id);
                if (tower && tower.store.getFreeCapacity(RESOURCE_ENERGY) >= 50) {
                    creep.transfer(tower, RESOURCE_ENERGY);
                }
            }
        }

        // let tower=creep.pos.findClosestByRange(FIND_STRUCTURES,{
        //     filter:(s)=>{return s.structureType==STRUCTURE_TOWER&&creep.pos.getRangeTo(s)==1&&s.store.getFreeCapacity(RESOURCE_ENERGY)}
        // });
        // if(tower){
        //     creep.transfer(tower,RESOURCE_ENERGY);
        // }

        if (roomFac.upgrade.linkId) {
            if (creep.store.getUsedCapacity() <= 15) {
                let link = Game.getObjectById(roomFac.upgrade.linkId);
                let container = Game.getObjectById(creep.memory.containerId);
                if (link.store.getUsedCapacity(RESOURCE_ENERGY)) {

                    creep.withdraw(link, RESOURCE_ENERGY)
                    creep.transfer(container, RESOURCE_ENERGY, creep.store.getUsedCapacity(RESOURCE_ENERGY) - 50);
                } else {
                    creep.withdraw(container, RESOURCE_ENERGY)
                }
                creep.memory.needEnergy = false;
            }


        } else if (creep.memory.containerId) {
            let container = Game.getObjectById(creep.memory.containerId);
            creep.withdraw(container, RESOURCE_ENERGY)
            creep.memory.needEnergy = 0;
        } else {
            if (creep.store.getUsedCapacity() <= 70) {
                creep.memory.needEnergy = creep.store.getFreeCapacity() + 100;
            } else {
                creep.memory.needEnergy = 0;
            }
        }

        // if (creep.store.getUsedCapacity() <= 70) {
        //     creep.memory.needEnergy = creep.store.getFreeCapacity() + 100;
        // } else {
        //     creep.memory.needEnergy = 0;
        // }


        creep.upgradeController(Game.rooms[creep.memory.workPos.roomName].controller);

        // creep.build(Game.getObjectById("5f6847cec79a3b4a068339b3"));

        // let con =creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        // if(con&&creep.pos.getRangeTo(con)<4){
        //     creep.build(con);
        // }


    }
}

module.exports = upgrade;