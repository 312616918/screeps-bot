import {RoomName} from "./config";

type WorkPosConfig = {
    [roomName in RoomName]: {
        sources: RoomPosition[];
        // mineral:RoomPosition;
        // dispatch:RoomPosition;
        upgrade?: RoomPosition[];
    }
}

let workPos: WorkPosConfig = {

    W23S23: {
        sources: [
            new RoomPosition(37, 27, "W23S23"),
            new RoomPosition(24, 45, "W23S23"),
        ],
        // mineral: new RoomPosition(33, 16, "W23S23"),
        // dispatch: new RoomPosition(33, 34, "W23S23"),
        upgrade: [
            new RoomPosition(19, 32, "W23S23"),
            new RoomPosition(20, 31, "W23S23"),
            new RoomPosition(20, 33, "W23S23")
        ]
    }

    // W3N15: {
    //     sources: [
    //         new RoomPosition(29, 25, "W3N15"),
    //         new RoomPosition(38, 11, "W3N15")
    //     ],
    //     mineral: new RoomPosition(33, 16, "W3N15"),
    //     dispatch: new RoomPosition(33, 34, "W3N15"),
    //     upgrade: new RoomPosition(21, 30, "W3N15")
    // },
    //
    // W2N15: {
    //     sources: [
    //         new RoomPosition(45, 12, "W2N15"),
    //         new RoomPosition(4, 31, "W2N15")
    //     ],
    //     mineral: new RoomPosition(39, 41, "W2N15"),
    //     dispatch: new RoomPosition(10, 29, "W2N15")
    //
    // },
    // W2N16: {
    //     sources: [
    //         new RoomPosition(13, 31, "W2N16"),
    //         new RoomPosition(34, 12, "W2N16")
    //     ],
    //     mineral: new RoomPosition(4, 34, "W2N16"),
    //     dispatch: new RoomPosition(13, 27, "W2N16"),
    //     upgrade: new RoomPosition(9, 37, "W2N16")
    // },
    // W2N18: {
    //     sources: [
    //         new RoomPosition(16, 14, "W2N18"),
    //         new RoomPosition(19, 17, "W2N18")
    //     ],
    //     mineral: new RoomPosition(10, 3, "W2N18"),
    //     dispatch: new RoomPosition(19, 21, "W2N18"),
    //     upgrade: new RoomPosition(14, 12, "W2N18")
    // },
    // W3N19: {
    //     sources: [
    //         new RoomPosition(28, 27, "W3N19"),
    //         new RoomPosition(29, 32, "W3N19")
    //     ],
    //     mineral: new RoomPosition(37, 22, "W3N19"),
    //     dispatch: new RoomPosition(32, 28, "W3N19")
    // },
    // W7N16: {
    //     sources: [
    //         new RoomPosition(45, 11, "W7N16"),
    //         new RoomPosition(31, 3, "W7N16")
    //     ],
    //     mineral: new RoomPosition(5, 29, "W7N16"),
    //     upgrade: new RoomPosition(40, 26, "W7N16"),
    //     dispatch: new RoomPosition(40, 6, "W7N16")
    // }
}

/**
 * @type LabConfig
 */
// let labConfig = {
//     "W3N15": {
//         5: {
//             resourcesType: "OH",
//             input: true
//         },
//         8: {
//             resourcesType: "KH",
//             input: true,
//         },
//         9: {
//             resourcesType: "KO",
//             input: true,
//         },
//         1: {
//             resourcesType: "X",
//             input: true
//         },
//
//
//         6: {
//             resourcesType: "KH2O",
//             input: true,
//             output: true,
//             runIndexs: [8, 5]
//         },
//         7: {
//             resourcesType: "KHO2",
//             input: true,
//             output: true,
//             runIndexs: [9, 5]
//         },
//
//         0: {
//             resourcesType: "XKH2O",
//             output: true,
//             runIndexs: [6, 1]
//         },
//         2: {
//             resourcesType: "XKH2O",
//             output: true,
//             runIndexs: [6, 1]
//         },
//
//         4: {
//             resourcesType: "XKHO2",
//             output: true,
//             runIndexs: [7, 1]
//         },
//         3: {
//             resourcesType: "XKHO2",
//             output: true,
//             runIndexs: [7, 1]
//         }
//
//
//     },
//
//     "W2N16": {
//         3: {
//             resourcesType: "K",
//             input: true
//         },
//         0: {
//             resourcesType: "H",
//             input: true,
//         },
//         1: {
//             resourcesType: "KH",
//             output: true,
//             runIndexs: [0, 3]
//         },
//
//         2: {
//             resourcesType: "KH",
//             output: true,
//             runIndexs: [0, 3]
//         },
//         5: {
//             resourcesType: "KH",
//             output: true,
//             runIndexs: [0, 3]
//         },
//         4: {
//             resourcesType: "KH",
//             output: true,
//             runIndexs: [0, 3]
//         },
//
//
//
//     },
//
//     "W2N18": {
//         1: {
//             resourcesType: "H",
//             input: true,
//         },
//         5: {
//             resourcesType: "O",
//             input: true,
//         },
//
//
//         0: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 5]
//         },
//         4: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 5]
//         },
//         2: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 5]
//         },
//         3: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 5]
//         }
//     },
//     "W3N19": {
//         1: {
//             resourcesType: "H",
//             input: true
//         },
//         2: {
//             resourcesType: "O",
//             input: true
//         },
//
//         0: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 2]
//         },
//         3: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 2]
//         },
//         4: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 2]
//         },
//         5: {
//             resourcesType: "OH",
//             output: true,
//             runIndexs: [1, 2]
//         }
//     }
// }

/**
 * @type ReactConfig
 */
// let reactConfig = {
//     "W3N15": {
//         spupply: ["XKH2O","XKH2O","KHO2","XUHO2", "KH2O","KH"]
//     },
//     "W2N15":{
//         spupply:["XKH2O","KH2O","KH","OH"]
//     },
//     "W2N16": {
//         spupply: ["XKH2O", "XKHO2", "KH2O", "KHO2", "KH"]
//     },
//     "W2N18":{
//         spupply:["XKH2O", "KH2O", "KH","OH"]
//     },
//     "W3N19": {
//         spupply: ["XKH2O", "KH2O","KH","OH"]
//     },
//     "W7N16": {
//         spupply: ["XUHO2","UHO2"]
//     }
// }

/**
 * @type ReactConstant
 */
// let reactConstant = {
//     "XKH2O": ["KH2O", "X"],
//     "XKHO2": ["KHO2", "X"],
//
//     "XUHO2": ["UHO2", "X"],
//
//     "KH2O": ["KH", "OH"],
//     "KHO2": ["KO", "OH"],
//
//     "UHO2": ["UO", "OH"],
//
//     "KH": ["K", "H"],
//
//     "UO": ["U", "O"],
//
//     "OH":["H","O"]
// }
export type FacilityMemory = {
    [roomName in RoomName]?: {
        sources: {
            [sourceId: string]: {
                harvestPos: RoomPosition,
                containerId?: string,
                towerIds?: string[],
                linkId?: string,
                controllerId?: string
            }
        },
        mineral?: {
            id: string,
            resourceType: MineralConstant,
            harvestPos: RoomPosition,
            containerId?: string
        }
        upgrade?: {
            wordPositions: RoomPosition[],
            containerId?: string,
            linkId?: string,
            towerIds?: string[]
        },
        terminalId?: string,
        storageId?: string,
        centerLinkId?: string,
        towerIds?: string[],
        spawnNames?: string[],
        labIds?: string[],
        lab?: {
            centerIds: string[];
            subIds: string[];
        },
        extensionIds: string[];
    }
}

export class Facility {
    static refresh(): void {
        if (Memory.facility == undefined) {
            Memory.facility = {};
        }
        let fac = Memory.facility;
        for (let roomName in workPos) {
            let roomPos = workPos[<RoomName>roomName];
            let room = Game.rooms[roomName];
            if (!room) {
                continue;
            }

            fac[roomName] = {
                sources: {}
            };

            let roomFac = fac[<RoomName>roomName];

            //tower
            let roomTowers = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_TOWER
                }
            });
            roomFac.towerIds = roomTowers.map((v) => {
                return v.id;
            })

            //source
            for (let i in roomPos.sources) {
                let pos = roomPos.sources[i];
                let source = pos.findClosestByRange(FIND_SOURCES, {
                    filter: (s) => {
                        return pos.getRangeTo(s) <= 1;
                    }
                })
                if (!source) {
                    console.log("[ERROR] 未找到source")
                    continue;
                }
                roomFac.sources[source.id] = {
                    harvestPos: pos
                };
                let sourceNode = roomFac.sources[source.id];

                let towers = pos.findInRange(roomTowers, 1);
                if (towers.length) {
                    sourceNode.towerIds = towers.map((s) => {
                        return s.id
                    });
                }

                let containers = pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_CONTAINER
                    }
                });
                if (containers.length) {
                    sourceNode.containerId = containers[0].id;
                }

                let link = pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_LINK
                    }
                });
                if (link) {
                    sourceNode.linkId = link.id;
                }

                if (pos.getRangeTo(room.controller) <= 3) {
                    sourceNode.controllerId = room.controller.id;
                }
            }
            let storages = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_STORAGE
                }
            })
            if (storages.length) {
                roomFac.storageId = storages[0].id;
            }
            //
            //     let terminals = pos.findInRange(FIND_STRUCTURES, 1, {
            //         filter: (s) => {
            //             return s.structureType == STRUCTURE_TERMINAL
            //         }
            //     })
            //     if (terminals.length) {
            //         roomFac.terminalId = terminals[0].id;
            //     }
            //
            //     let centerLinks = pos.findInRange(FIND_STRUCTURES, 1, {
            //         filter: (s) => {
            //             return s.structureType == STRUCTURE_LINK
            //         }
            //     })
            //     if (centerLinks.length) {
            //         roomFac.centerLinkId = centerLinks[0].id;
            //     }
            //
            // }
            //
            // if (roomPos.mineral) {
            //     let pos = roomPos.mineral;
            //
            //     let mineral = pos.findClosestByRange(FIND_MINERALS);
            //
            //     roomFac.mineral = {
            //         id: mineral.id,
            //         harvestPos: pos,
            //         resourceType: mineral.mineralType
            //     };
            //
            //     let containers = pos.findInRange(FIND_STRUCTURES, 1, {
            //         filter: (s) => {
            //             return s.structureType == STRUCTURE_CONTAINER
            //         }
            //     });
            //
            //     if (containers.length) {
            //         roomFac.mineral.containerId = containers[0].id;
            //     }
            // }

            if (roomPos.upgrade) {
                let pos = roomPos.upgrade[0];
                roomFac.upgrade = {
                    wordPositions: roomPos.upgrade
                }

                let containers = pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_CONTAINER
                    }
                });
                if (containers.length) {
                    roomFac.upgrade.containerId = containers[0].id;
                }

                let link = pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_LINK
                    }
                });
                if (link) {
                    roomFac.upgrade.linkId = link.id;
                }

                let towers = pos.findInRange(roomTowers, 1);
                if (towers.length) {
                    roomFac.upgrade.towerIds = towers.map((s) => {
                        return s.id
                    });
                }
            }

            roomFac.spawnNames = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_SPAWN
                }
            }).map((s) => {
                return s["name"];
            })

            //lab
            let labs = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_LAB
                }
            })
            if (labs.length) {
                roomFac.labIds = labs.map((s) => {
                    return s.id
                });

                roomFac.lab = {
                    centerIds: [],
                    subIds: []
                };

                for (let i in labs) {
                    let lab1 = labs[i];
                    let flag = true;
                    for (let j in labs) {
                        let lab2 = labs[j];
                        if (lab1.pos.getRangeTo(lab2) > 2) {
                            flag = false;
                            break;
                        }
                    }
                    if (flag && roomFac.lab.centerIds.length < 2) {
                        roomFac.lab.centerIds.push(lab1.id);
                    } else {
                        roomFac.lab.subIds.push(lab1.id);
                    }
                }

            }

            //extension
            roomFac.extensionIds = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_EXTENSION;
                }
            }).map(s => s.id)

        }
    };

    public static runTower(): void {
        let fac = Memory.facility;
        for (let roomName in fac) {
            let roomFac = fac[roomName];
            if (!roomFac.towerIds) {
                continue;
            }
            for (let i in roomFac.towerIds) {
                let tower = Game.getObjectById<StructureTower>(roomFac.towerIds[i]);
                if (!tower) {
                    continue;
                }
                let hostiles = tower.room.find(FIND_HOSTILE_CREEPS);
                if (hostiles.length) {
                    tower.attack(hostiles[Math.floor(Math.random() * hostiles.length)]);
                } else {
                    var DamagedStructure = tower.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            if (structure.structureType != STRUCTURE_WALL &&
                                structure.structureType != STRUCTURE_RAMPART) {
                                return structure.hits < structure.hitsMax - 1000;
                            }
                            return structure.hits < 20000;
                        }
                    });
                    if (DamagedStructure.length) {
                        tower.repair(DamagedStructure[Math.floor(Math.random() * DamagedStructure.length)]);
                    }
                }
            }
        }
    }

    // runLab() {
    //
    //     if (Memory.roomConfig == undefined) {
    //         Memory.roomConfig = {};
    //     }
    //     let roomConfig = Memory.roomConfig;
    //
    //
    //     // return;
    //     let fac = Memory.facility;
    //
    //     /**
    //      * @type RoomName
    //      */
    //     let roomName = null;
    //     // @ts-ignore
    //     for (roomName in fac) {
    //         let roomFac = fac[roomName];
    //         if (!roomFac.labIds) {
    //             continue;
    //         }
    //         /**
    //          * @type StructureStorage
    //          */
    //         let storage = Game.getObjectById(roomFac.storageId);
    //
    //         let roomLabeConfig = labConfig[roomName];
    //
    //         //新版本
    //         let config = reactConfig[roomName];
    //         if (config) {
    //
    //             if (roomConfig[roomName] == undefined) {
    //                 roomConfig[roomName] = {
    //                     curReact: null
    //                 }
    //             }
    //
    //
    //             /**
    //              * @type StructureLab[]
    //              */
    //             let cLabs = roomFac.lab.centerIds.map((id) => {
    //                 return Game.getObjectById(id);
    //             });
    //             /**
    //              * @type StructureLab[]
    //              */
    //             let sLabs = roomFac.lab.subIds.map((id) => {
    //                 return Game.getObjectById(id);
    //             });
    //             let cAmount = cLabs.map((lab) => {
    //                 let amount = lab.store.getUsedCapacity(lab.mineralType);
    //                 return amount ? amount : 0;
    //             });
    //             let sAmount = sLabs.map((lab) => {
    //                 let amount = lab.store.getUsedCapacity(lab.mineralType);
    //                 return amount ? amount : 0;
    //             });
    //
    //
    //             //更换反应
    //             //1.当前无反应  2.无反应原料且lab已经耗尽
    //             let iTypes = reactConstant[roomConfig[roomName].curReact];
    //             if (!roomConfig[roomName].curReact || storage.store.getUsedCapacity(roomConfig[roomName].curReact)>30000||
    //                 ((storage.store.getUsedCapacity(iTypes[0]) == 0 || storage.store.getUsedCapacity(iTypes[1]) == 0) &&
    //                     (cAmount[0] < 10 || cAmount[1] < 10))) {
    //
    //                 for (let i in config.spupply) {
    //                     let oType = config.spupply[i];
    //                     let iTypes = reactConstant[oType];
    //
    //                     //反应表还未补充
    //                     if (!iTypes) {
    //                         console.log("No ReactConstant")
    //                         continue;
    //                     }
    //
    //                     //跳过过量反应
    //                     if(storage.store.getUsedCapacity(oType)>30000){
    //                         continue;
    //                     }
    //
    //                     // console.log(iTypes);
    //
    //                     //跳过原料储量不足1k的反应
    //                     if (storage.store.getUsedCapacity(iTypes[0]) < 400 || storage.store.getUsedCapacity(iTypes[1]) < 400) {
    //                         continue;
    //                     }
    //
    //                     roomConfig[roomName].curReact = oType;
    //                     break;
    //
    //                 }
    //             }
    //
    //             iTypes = reactConstant[roomConfig[roomName].curReact];
    //             if (!iTypes) {
    //                 continue;
    //             }
    //
    //             //反应物流
    //
    //             //处理中心lab
    //             for (let i in cLabs) {
    //                 let lab = cLabs[i];
    //
    //                 //移除残留
    //                 if (lab.mineralType && lab.mineralType != iTypes[i]) {
    //                     carry.addReq(lab, "output", lab.mineralType, lab.store.getUsedCapacity(lab.mineralType));
    //                     continue;
    //                 }
    //
    //                 //添加原料
    //                 if (cAmount[i] < 200) {
    //                     carry.addReq(lab, "input", iTypes[i], 500);
    //                 }
    //             }
    //
    //             //处理附属lab
    //             for (let i in sLabs) {
    //                 let lab = sLabs[i];
    //
    //                 //移除残留
    //                 if (lab.mineralType && lab.mineralType != roomConfig[roomName].curReact) {
    //                     carry.addReq(lab, "output", lab.mineralType, lab.store.getUsedCapacity(lab.mineralType));
    //                     continue;
    //                 }
    //
    //                 //移除产物
    //                 if (sAmount[i] > 400) {
    //                     carry.addReq(lab, "output", lab.mineralType, 300);
    //                 }
    //
    //                 //执行反应
    //                 lab.runReaction(cLabs[0], cLabs[1]);
    //
    //             }
    //             continue;
    //
    //         }
    //
    //
    //         for (let i in roomLabeConfig) {
    //             let config = roomLabeConfig[i];
    //             let resourcesType = config.resourcesType;
    //
    //             /**
    //              * @type StructureLab
    //              */
    //             let lab = Game.getObjectById(roomFac.labIds[i]);
    //
    //
    //             if (lab.mineralType && lab.mineralType != resourcesType) {
    //                 carry.addReq(lab, "output", lab.mineralType, lab.store.getUsedCapacity(lab.mineralType));
    //                 continue;
    //             }
    //
    //
    //             let usedCapacity = lab.store.getUsedCapacity(resourcesType)
    //             let freeCapacity = lab.store.getFreeCapacity(resourcesType)
    //
    //
    //             if (config.input && usedCapacity < 200) {
    //                 carry.addReq(lab, "input", resourcesType, freeCapacity / 4);
    //             }
    //             if (config.output && freeCapacity < 200) {
    //                 carry.addReq(lab, "output", resourcesType, usedCapacity / 4)
    //             }
    //
    //             if (config.runIndexs) {
    //                 let lab1 = Game.getObjectById(roomFac.labIds[config.runIndexs[0]]);
    //                 let lab2 = Game.getObjectById(roomFac.labIds[config.runIndexs[1]]);
    //                 lab.runReaction(lab1, lab2);
    //             }
    //
    //
    //         }
    //
    //     }
    // },

    show(): void {
        let fac = Memory.facility;
        for (let roomName in fac) {
            let roomFac = fac[roomName];
            if (roomFac.labIds) {
                for (let i in roomFac.labIds) {
                    /**
                     * @type StructureLab
                     */
                    let lab = Game.getObjectById<StructureLab>(roomFac.labIds[i]);

                    let color = 'green';
                    if (roomFac.lab.centerIds.indexOf(lab.id) == -1) {
                        color = 'red'
                    }

                    new RoomVisual(roomName).text(i, lab.pos.x, lab.pos.y, {
                        color: color,
                        font: 0.3
                    });
                }
            }
        }
    }
}