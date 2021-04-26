//@ts-check

var special = {

    spawnCreeps: function () {

        var creepPlan = [{
                name: "Special-Retrieve-01",
                body: [CARRY, CARRY, MOVE],
                memory: {},
                bakTick: 0
            }, {
                name: "Special-Retrieve-02",
                body: [CARRY, CARRY, MOVE],
                memory: {},
                bakTick: 0
            },
            // {
            //     name: "Special-inv-02",
            //     body: [WORK, WORK, WORK, WORK, WORK, WORK,
            //         CARRY,
            //         MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            //     ],
            //     memory: {},
            //     bakTick: 0
            // },
            // {
            //     name: "Special-Bait-01",
            //     body: [
            //         MOVE, MOVE, MOVE, MOVE, MOVE,
            //         MOVE, MOVE, MOVE, MOVE, MOVE,
            //         HEAL, HEAL, HEAL, HEAL, HEAL,
            //         HEAL, HEAL, HEAL, HEAL, HEAL
            //     ],
            //     memory: {
            //         workPos: {
            //             x: 28,
            //             y: 26,
            //             roomName: "W4N15"
            //         }
            //     },
            //     bakTick: 150
            // },


            // {
            //     name: "Special-Protecter-02",
            //     body: [
            //         RANGED_ATTACK,RANGED_ATTACK,ATTACK,ATTACK,ATTACK,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,
            //         MOVE,MOVE,MOVE,MOVE,MOVE,

            //         HEAL,HEAL,HEAL,HEAL,HEAL,
            //         MOVE,MOVE,MOVE,MOVE,MOVE


            //     ],
            //     memory: {
            //         workPos: {
            //             x: 38,
            //             y: 40,
            //             roomName: "W4N15"
            //         }

            //     },
            //     bakTick: 0
            // },


            // {
            //     name: "Special-Protecter-02",
            //     body: [
            //         ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
            //         MOVE, MOVE, MOVE, MOVE, MOVE,

            //         ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
            //         MOVE, MOVE, MOVE, MOVE, MOVE,

            //         ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
            //         MOVE, MOVE, MOVE, MOVE, MOVE,

            //         ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
            //         MOVE, MOVE, MOVE, MOVE, MOVE,

            //         HEAL, HEAL, HEAL, HEAL, HEAL,
            //         MOVE, MOVE, MOVE, MOVE, MOVE


            //     ],
            //     memory: {
            //         workPos: {
            //             x: 45,
            //             y: 12,
            //             roomName: "W4N15"
            //         }

            //     },
            //     bakTick: 0
            // },




            // {
            //     name: "Special-inv-01",
            //     body: [CARRY, MOVE],
            //     memory: {},
            //     bakTick: 0
            // }

        ];

        for (let i in creepPlan) {
            if (Game.creeps[creepPlan[i].name]) {
                continue;
            }
            let spawn = Game.spawns['Spawn1'];
            if (creepPlan[i].name.indexOf("-inv-") != -1) {
                spawn = Game.spawns['Spawn3']
            }
            if (creepPlan[i].name.indexOf("-Bait") != -1) {
                spawn = Game.spawns['Spawn2']
            }
            if (spawn.spawnCreep(creepPlan[i].body, creepPlan[i].name, {
                    memory: creepPlan[i].memory
                }) != OK) {
                console.log("[SpawnCreep]:" + creepPlan[i].name + "-wait");
            } else {
                console.log("[SpawnCreep]:" + creepPlan[i].name + "-OK");
            };
            break;
        }

    },

    /**
     * 
     * @param {Creep} creep 
     */
    run: function (creep) {

        // creep.heal(creep);
        if (creep.name.indexOf("-Pro") != -1) {

            if (creep.hitsMax - creep.hits >= 500) {
                creep.heal(creep);
            }


            if (creep.pos.roomName != creep.memory.workPos.roomName) {
                let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
                if (creep.pos.getRangeTo(tarPos)) {
                    creep.moveTo(tarPos);
                    return;
                }
                return;
            }


            let tar = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (c) => {

                    // return c.body.length==50;

                    if (c.body.length != 10) {
                        return false;
                    }


                    for (let i in c.body) {
                        if (c.body[i].type == RANGED_ATTACK) {
                            return true;
                        }
                    }

                    return false;
                }
            })

            let subtar = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (c) => {

                    // return c.body.length==50;

                    if (c.body.length != 10) {
                        return false;
                    }


                    for (let i in c.body) {
                        if (c.body[i].type == HEAL) {
                            return true;
                        }
                    }

                    return false;
                }
            })

            // tar = Game.getObjectById("5f8ebf92a032972a2f3f01b7")
            // if (creep.id == "5f8ec79710960b91efc3190e") {
            //     tar = Game.getObjectById("5f8ebf92a0329727cc3f01ba")
            // }

            if (tar) {
                if (creep.attack(tar) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(tar, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                } else {
                    if (creep.attack(subtar) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(subtar, {
                            visualizePathStyle: {
                                stroke: '#ffaa00'
                            }
                        });
                    }
                }
            }
            creep.attack(Game.getObjectById("5f940c23dd45077c66a2da78"))
            return;
        }
        if (creep.name.indexOf("-Bait") != -1) {

            if (creep.hitsMax - creep.hits >= 50) {
                creep.heal(creep);
            }

            // if (creep.pos.roomName != creep.memory.workPos.roomName) {
            //     let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
            //     if (creep.pos.getRangeTo(tarPos)) {
            //         creep.moveTo(tarPos);
            //         return;
            //     }
            //     return;
            // }

            let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
            if (creep.pos.getRangeTo(tarPos)) {
                creep.moveTo(tarPos);
                return;
            }

            // let tar = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            //     filter: (c) => {
            //         if (c.body.length != 10) {
            //             return false;
            //         }
            //         for (let i in c.body) {
            //             if (c.body[i].type == RANGED_ATTACK) {
            //                 return true;
            //             }
            //         }
            //         return false;
            //     }
            // })

            // if (tar) {
            //     if(creep.pos.getRangeTo(tar)>1){
            //         creep.moveTo(tar, {
            //             visualizePathStyle: {
            //                 stroke: '#ffaa00'
            //             }
            //         });
            //     }
            // }
            return;
        }

        if (creep.memory.workPos) {
            let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);
            if (creep.pos.getRangeTo(tarPos)) {
                creep.moveTo(tarPos);
                return;
            }
        }
        if (creep.name.indexOf("Retrieve") != -1) {

            let source = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                filter: (s) => {
                    return s.store && s.store.getUsedCapacity()
                }
            });
            let drop = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);

            if (creep.store.getUsedCapacity() == 0 && !source && !drop) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                return;
            }

            if (creep.store.getFreeCapacity() == 0 || !(source || drop)) {
                let target = Game.getObjectById("5f50de8dbd95e2f91bf16ca4");
                if (creep.pos.getRangeTo(target) > 1) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else {
                    for (let type in creep.store) {
                        // @ts-ignore
                        creep.transfer(target, type);
                    }
                }
                return;
            }

            if (source) {
                if (creep.pos.getRangeTo(source) > 1) {
                    creep.moveTo(source, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else {
                    for (let type in source.store) {
                        //@ts-ignore
                        creep.withdraw(source, type);
                    }
                }
                return;
            }
            // console.log(drop);
            if (drop) {
                if (creep.pos.getRangeTo(drop) > 1) {
                    creep.moveTo(drop, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else {
                    creep.pickup(drop);
                }
                return;
            }


            return;
        }
        if (creep.name.indexOf("-inv-") != -1) {
            creep.pickup(Game.getObjectById("5faadab53f0cd2a994e75ad4"));
            let cs = creep.room.find(FIND_HOSTILE_CREEPS);
            if (Game.flags["f"]) {
                creep.moveTo(Game.flags["f"], {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    },
                    costCallback: function (roomName, costMatrix) {
                        for (let i in cs) {
                            for (let x = cs[i].pos.x - 5; x < cs[i].pos.x + 5; x++) {
                                for (let y = cs[i].pos.y - 5; y < cs[i].pos.y + 5; y++) {
                                    if (x < 0 || x > 49 || y < 0 || y > 49) {
                                        continue;
                                    }
                                    costMatrix.set(x, y, 255);
                                }
                            }
                        }
                    }
                });
                return;
            }
            // let controller=creep.room.controller;
            // creep.moveTo(controller, {
            //     visualizePathStyle: {
            //         stroke: '#ffaa00'
            //     }
            // });
            // creep.claimController(controller);

            let source = Game.getObjectById("5bbcac7e9099fc012e6358cb");
            if (creep.pos.getRangeTo(source) != 1) {
                creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    },
                    costCallback: function (roomName, costMatrix) {
                        for (let i in cs) {
                            for (let x = cs[i].pos.x - 5; x < cs[i].pos.x + 5; x++) {
                                for (let y = cs[i].pos.y - 5; y < cs[i].pos.y + 5; y++) {
                                    if (x < 0 || x > 49 || y < 0 || y > 49) {
                                        continue;
                                    }
                                    costMatrix.set(x, y, 255);
                                }
                            }
                        }
                    }
                });
            }

            creep.harvest(source);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < 10) {
                let con = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                creep.build(con);
            }

        }



        return;

        // if (creep.memory.linkId) {
        //     let link = Game.getObjectById(creep.memory.linkId);
        //     let container = Game.getObjectById(creep.memory.containerId);
        //     if (link.store.getUsedCapacity(RESOURCE_ENERGY)) {

        //         creep.withdraw(link, RESOURCE_ENERGY)
        //         creep.transfer(container, RESOURCE_ENERGY, creep.store.getUsedCapacity(RESOURCE_ENERGY) - 50);
        //     } else {
        //         creep.withdraw(container, RESOURCE_ENERGY)
        //     }
        //     // if (creep.store.getUsedCapacity() <= 20) {
        //     //     creep.memory.needEnergy = true;
        //     // } else {
        //     //     creep.memory.needEnergy = false;
        //     // }




        // } else {
        //     if (creep.store.getUsedCapacity() <= 50) {
        //         creep.memory.needEnergy = true;
        //     } else {
        //         creep.memory.needEnergy = false;
        //     }
        // }



        // creep.memory.needEnergy = false;


        // creep.upgradeController(Game.rooms[creep.memory.workPos.roomName].controller);

        // // creep.build(Game.getObjectById("5f6847cec79a3b4a068339b3"));


    }
}

module.exports = special;