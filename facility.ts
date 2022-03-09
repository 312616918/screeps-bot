import {globalConfig, RoomName} from "./globalConfig";

export type FacilityMemory = {
    sources?: {
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
        // workPositions: RoomPosition[],
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
    extensionIds?: string[];
}

export class Facility {
    protected roomName: RoomName;
    protected fac: FacilityMemory;
    protected room: Room;

    constructor(roomName: RoomName, facilityMemory: FacilityMemory) {
        this.roomName = roomName;
        this.fac = facilityMemory;
        this.room = Game.rooms[this.roomName];
    }


    public runLink() {
        let sourceFac = this.fac.sources;
        let sourceLinks: StructureLink[] = [];
        for (let sourceId in sourceFac) {
            let sourceConfig = sourceFac[sourceId];
            let link = Game.getObjectById<StructureLink>(sourceConfig.linkId);
            if (!link) {
                continue;
            }
            sourceLinks.push(link);
        }
        let upgradeLink = Game.getObjectById<StructureLink>(this.fac.upgrade.linkId);
        if (upgradeLink && sourceLinks.length != 0) {
            sourceLinks.forEach(link => {
                if (link.store.getFreeCapacity("energy") == 0
                    && upgradeLink.store.getUsedCapacity("energy") <= 24) {
                    link.transferEnergy(upgradeLink);
                }
            })
        }
    }


    refresh(): void {

        let room = Game.rooms[this.roomName];

        // tower
        let roomTowers = room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_TOWER
            }
        });
        this.fac.towerIds = roomTowers.map((v) => {
            return v.id;
        })

        //source
        this.fac.sources = {}
        for (let cc of globalConfig[this.roomName].harvest.creepConfigs) {
            let pos = cc.pos;
            let source = pos.findClosestByRange<FIND_SOURCES>(FIND_SOURCES, {
                filter: (s) => {
                    return pos.getRangeTo(s) <= 1;
                }
            })
            if (!source) {
                console.error("can't find source")
                continue;
            }
            this.fac.sources[source.id] = {
                harvestPos: pos
            };
            let sourceNode = this.fac.sources[source.id];

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
        let storages = this.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_STORAGE
            }
        })
        if (storages.length) {
            this.fac.storageId = storages[0].id;
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
        let pos = globalConfig[this.roomName].upgrade.creepConfigs[0].pos;
        // this.facilityMemory.upgrade = {
        //     workPositions: [pos]
        // }
        this.fac.upgrade = {}
        let containers = pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (s) => {
                return s.structureType == STRUCTURE_CONTAINER
            }
        });
        if (containers.length) {
            this.fac.upgrade.containerId = containers[0].id;
        }

        let link = pos.findInRange(FIND_STRUCTURES, 1,{
            filter: (s) => {
                return s.structureType == STRUCTURE_LINK
            }
        });
        if (link.length) {
            this.fac.upgrade.linkId = link[0].id;
        }

        // let towers = pos.findInRange(roomTowers, 1);
        // if (towers.length) {
        //     this.facilityMemory.upgrade.towerIds = towers.map((s) => {
        //         return s.id
        //     });
        // }


        this.fac.spawnNames = this.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_SPAWN
            }
        }).map((s) => {
            return s["name"];
        })
        //
        // //lab
        // let labs = room.find(FIND_STRUCTURES, {
        //     filter: (s) => {
        //         return s.structureType == STRUCTURE_LAB
        //     }
        // })
        // if (labs.length) {
        //     roomFac.labIds = labs.map((s) => {
        //         return s.id
        //     });
        //
        //     roomFac.lab = {
        //         centerIds: [],
        //         subIds: []
        //     };
        //
        //     for (let i in labs) {
        //         let lab1 = labs[i];
        //         let flag = true;
        //         for (let j in labs) {
        //             let lab2 = labs[j];
        //             if (lab1.pos.getRangeTo(lab2) > 2) {
        //                 flag = false;
        //                 break;
        //             }
        //         }
        //         if (flag && roomFac.lab.centerIds.length < 2) {
        //             roomFac.lab.centerIds.push(lab1.id);
        //         } else {
        //             roomFac.lab.subIds.push(lab1.id);
        //         }
        //     }
        //
        // }

        //extension
        this.fac.extensionIds = this.room.find(FIND_MY_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_EXTENSION;
            }
        }).map(s => s.id)


    };


    public runTower(): void {
        if (!this.fac.towerIds) {
            return;
        }
        for (let i in this.fac.towerIds) {
            let tower = Game.getObjectById<StructureTower>(this.fac.towerIds[i]);
            if (!tower) {
                continue;
            }
            let hostiles = tower.room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length) {
                tower.attack(hostiles[Math.floor(Math.random() * hostiles.length)]);
            } else {
                var damagedStructure = tower.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        if (structure.structureType != STRUCTURE_WALL &&
                            structure.structureType != STRUCTURE_RAMPART) {
                            return structure.hits < structure.hitsMax - 1000;
                        }
                        return structure.hits < 20000;
                    }
                });
                if (damagedStructure.length) {
                    tower.repair(damagedStructure[Math.floor(Math.random() * damagedStructure.length)]);
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
        // if (roomFac.labIds) {
        //     for (let i in roomFac.labIds) {
        //         /**
        //          * @type StructureLab
        //          */
        //         let lab = Game.getObjectById<StructureLab>(roomFac.labIds[i]);
        //
        //         let color = 'green';
        //         if (roomFac.lab.centerIds.indexOf(lab.id) == -1) {
        //             color = 'red'
        //         }
        //
        //         new RoomVisual(roomName).text(i, lab.pos.x, lab.pos.y, {
        //             color: color,
        //             font: 0.3
        //         });
        //     }
        // }

    }
}