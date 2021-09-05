//@ts-check
const spawn = require("../spawn");

var upgrade = {

    spawnCreeps: function () {

        var creepPlan = [{
                name: "Harvester-01",
                body: [WORK, WORK, WORK, WORK, WORK, 
                    CARRY,
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(29, 25, "W3N15"),
                    sourceId: "5bbcacb59099fc012e636103",
                    towerId: "5f7c9e3439e97a1aad7a683c"
                },
                bakTick: 30
            },
            {
                name: "Harvester-02",
                body: [WORK, WORK, WORK,WORK, WORK, 
                    CARRY,
                    MOVE, MOVE
                ],
                memory: {
                    workPos: new RoomPosition(38, 11, "W3N15"),
                    sourceId: "5bbcacb59099fc012e636102",
                    linkId: "5f52743fec448e69c2bc19e6",
                    towerId: "5f7cad09f4ce557bd8d83602"
                },
                bakTick: 50
            },
            // {
            //     name: "Harvester-03",
            //     body: [WORK, WORK, WORK, WORK, WORK,
            //         MOVE, MOVE
            //     ],
            //     memory: {
            //         workPos: new RoomPosition(33, 16, "W3N15"),
            //         sourceId: "5bbcb2b540062e4259e93cc7"
            //     },
            //     bakTick: 20
            // },
            {
                name: "Harvester-04",
                body: [WORK, WORK, WORK, WORK, 
                    CARRY,
                    MOVE, MOVE
                ],
                memory: {
                    workPos: new RoomPosition(45, 12, "W2N15"),
                    sourceId: "5bbcacc39099fc012e636290"
                },
                bakTick: 70
            },
            {
                name: "Harvester-W2N15-01",
                spawnName: "Spawn8",
                body: [WORK, WORK, WORK, WORK, WORK,
                    CARRY,
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(4, 31, "W2N15"),
                    sourceId: "5bbcacc39099fc012e636291",
                    linkId: "5f71ff102b43b1d77070cf7b"
                },
                bakTick: 20
            },
            // {
            //     name: "Harvester-06",
            //     body: [WORK, WORK,
            //         CARRY, CARRY,
            //         MOVE, MOVE
            //     ],
            //     memory: {
            //         workPos: new RoomPosition(13, 31, "W2N16"),
            //         sourceId: "5bbcacc39099fc012e63628c"
            //     },
            //     bakTick: 80
            // },
            {
                name: "Harvester-07",
                spawnName: "Spawn3",
                body: [WORK, WORK,WORK, WORK, WORK, 
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(13, 31, "W2N16"),
                    sourceId: "5bbcacc39099fc012e63628c"
                },
                bakTick: 40
            },
            {
                name: "Harvester-08",
                spawnName: "Spawn3",
                body: [WORK, WORK,WORK, WORK, WORK, 
                    CARRY,
                    MOVE,
                ],
                memory: {
                    workPos: new RoomPosition(34, 12, "W2N16"),
                    sourceId: "5bbcacc39099fc012e63628b",
                    linkId: "5f7c0893e99f95f88c6ee992",
                    towerId: "5f7c1e6f74f08b5091689713"
                },
                bakTick: 40
            },
            {
                name: "Harvester-W2N16-03",
                spawnName: "Spawn3",
                body: [WORK, WORK,WORK, WORK, WORK, 
                     MOVE
                ],
                memory: {
                    sourceId: "5bbcb2bf40062e4259e93d32"
                },
                bakTick: 60
            },
            {
                name: "Harvester-W2N18-01",
                spawnName: "Spawn4",
                body: [WORK, WORK, WORK, WORK, WORK,
                    CARRY,
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(16, 14, "W2N18"),
                    sourceId: "5bbcacc39099fc012e636284",
                    containerId: "5f9554248004fb0bfaf52e85"
                },
                bakTick: 30
            },
            {
                name: "Harvester-W2N18-02",
                spawnName: "Spawn4",
                body: [WORK, WORK, WORK, WORK, WORK,
                    CARRY,
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(19, 17, "W2N18"),
                    sourceId: "5bbcacc39099fc012e636285",
                    towerId: "5f858ca060fda536b2bd6d22"
                },
                bakTick: 30
            },
            {
                name: "Harvester-W2N18-03",
                spawnName: "Spawn4",
                body: [WORK, WORK,WORK, WORK, WORK, 
                    MOVE
                ],
                memory: {
                    sourceId: "5bbcb2bf40062e4259e93d30"
                },
                bakTick: 60
            },

            {
                name: "Harvester-W3N19-01",
                spawnName: "Spawn6",
                body: [WORK, WORK, WORK, WORK, WORK, 
                    CARRY,
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(28, 27, "W3N19"),
                    sourceId: "5bbcacb59099fc012e6360f5",
                    controllerId: "5bbcacb59099fc012e6360f4"
                },
                bakTick: 46
            },

            {
                name: "Harvester-W3N19-02",
                spawnName: "Spawn6",
                body: [WORK, WORK, WORK,WORK, WORK, 
                    CARRY,
                    MOVE
                ],
                memory: {
                    workPos: new RoomPosition(29, 32, "W3N19"),
                    sourceId: "5bbcacb59099fc012e6360f6",
                    towerId: "5f8d80706b21970f2733939a"
                },
                bakTick: 10
            },
            {
                name: "Harvester-W3N19-03",
                spawnName: "Spawn6",
                body: [WORK, WORK,WORK, WORK, WORK, 
                    MOVE
                ],
                memory: {
                    sourceId: "5bbcb2b540062e4259e93cc3"
                },
                bakTick: 60
            },
            {
                name: "Harvester-W7N16-01",
                spawnName: "Spawn7",
                body: [WORK, WORK, WORK, WORK,WORK,
                    CARRY,
                    MOVE
                ],
                memory: {
                    sourceId: "5bbcac7e9099fc012e6358cb"
                },
                bakTick: 60
            },
            {
                name: "Harvester-W7N16-02",
                spawnName: "Spawn7",
                body: [WORK, WORK, WORK, WORK,WORK,
                    CARRY,
                    MOVE, MOVE
                ],
                memory: {
                    sourceId: "5bbcac7e9099fc012e6358ca"
                },
                bakTick: 60
            },
            {
                name: "Harvester-W7N16-03",
                spawnName: "Spawn7",
                body: [WORK, WORK, WORK, WORK,WORK,WORK,
                    MOVE, MOVE, MOVE
                ],
                memory: {
                    sourceId: "5bbcb29540062e4259e93b82"
                },
                bakTick: 60
            },
            {
                name: "Harvester-W2N15-03",
                spawnName: "Spawn8",
                body: [WORK, WORK, WORK, WORK,WORK,WORK,
                    MOVE, MOVE, MOVE
                ],
                memory: {
                    sourceId: "5bbcb2bf40062e4259e93d33"
                },
                bakTick: 60
            }

        ]
        for (let i in creepPlan) {


            var target = Game.getObjectById(creepPlan[i].memory.sourceId);
            if (!target || (target.mineralAmount != undefined && target.mineralAmount == 0)) {
                continue;
            }

            let template = {
                name: creepPlan[i].name,
                body: creepPlan[i].body,
                memory: creepPlan[i].memory,
                priority: 2,
                spawnNames: [creepPlan[i].spawnName == undefined ? "Spawn2" : creepPlan[i].spawnName]
            }

            // if(_.indexOf(template.body,CARRY)!=-1){
            //     template.body=[WORK,CARRY,MOVE];
            // }else{
            //     template.body=[WORK,WORK,MOVE];
            // }

            spawn.reserveCreepBak(template, creepPlan[i].bakTick);
        }

    },
    /**
     * 
     * @param {Creep} creep 
     */
    run: function (creep) {

        let fac = Memory.facility;

        // let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);

        var target = Game.getObjectById(creep.memory.sourceId);
        if (!target) {
            return;
        }

        if (target.mineralAmount != undefined) {
            return;
            let mineralNode = fac[target.pos.roomName].mineral;
            let workPos = new RoomPosition(mineralNode.harvestPos.x, mineralNode.harvestPos.y, mineralNode.harvestPos.roomName);

            if (creep.pos.getRangeTo(workPos)) {
                creep.moveTo(workPos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                return;
            }

            creep.harvest(target);
            return;
        }



        let sourceNode = fac[target.pos.roomName].sources[creep.memory.sourceId];

        let workPos = new RoomPosition(sourceNode.harvestPos.x, sourceNode.harvestPos.y, sourceNode.harvestPos.roomName);

        if (creep.pos.getRangeTo(workPos)) {
            creep.moveTo(workPos, {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });
            return;
        }

        let link = Game.getObjectById(sourceNode.linkId);
        let contianer = Game.getObjectById(sourceNode.containerId);
        let controller = Game.getObjectById(sourceNode.controllerId);

        let hasTran = false;
        if (sourceNode.towerIds) {
            for (let i in sourceNode.towerIds) {
                let tower = Game.getObjectById(sourceNode.towerIds[i]);
                if (!tower || hasTran) {
                    continue;
                }
                if (tower["store"].getFreeCapacity(RESOURCE_ENERGY)>=50) {
                    creep.transfer(tower, RESOURCE_ENERGY);
                    hasTran = true;
                }
            }
        }

        if (!hasTran&&creep.store.getFreeCapacity(RESOURCE_ENERGY)<=10) {

            if (!link || creep.transfer(link, RESOURCE_ENERGY) != OK) {
                if (creep.pos.getRangeTo(contianer) != 0) {
                    creep.transfer(contianer, RESOURCE_ENERGY);
                }
            }

        }

        if (controller) {
            creep.upgradeController(controller);
        }

        if (!sourceNode.controllerId || creep.store.getFreeCapacity() >= 20) {
            creep.harvest(target);
        }
    }
}

module.exports = upgrade;