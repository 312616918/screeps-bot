import {ALL_CHAIM_CONFIG, RoomName} from "./Config";
import {BaseGroup, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";
import _ = require("lodash");

type RoleType = "claim" | "build" | "protect" | "block";

export type ClaimCreepMemory = {
    roomName: RoomName;
    role: RoleType;
    targetId?: string;
    state?: "harvest" | "build" | "upgrade" | "input" | "idle" | "pickup" | "withdraw" | "deposit";
    stepIdx?: number;
    workPos?: InnerPosition;
};


export class ClaimGroup extends BaseGroup<GroupMemory> {

    protected moduleName = "claim";

    protected runEachCreep(creep: Creep) {
        switch (creep.memory.claim.role) {
            case "claim":
                this.runClaim(creep);
                break;
            case "build":
                this.runBuild(creep);
                break;
            case "protect":
                this.runProtect(creep);
                break;
            case "block":
                this.runBlock(creep);
                break;
        }
    }

    protected runWithFlag(creep: Creep): boolean {
        let creepMemory = creep.memory.claim;
        // delete creepMemory.stepIdx;
        if (creepMemory.stepIdx == -1) {
            return false;
        }
        if (creepMemory.stepIdx == undefined) {
            creepMemory.stepIdx = 0;
        }
        let flagName = `${this.roomName}_claim_pos_${creepMemory.stepIdx}`;
        let flag = Game.flags[flagName];
        if (!flag) {
            flagName = flagName.replace(" ", "");
            flag = Game.flags[flagName];
        }
        console.log(flagName, flag)

        if (!flag) {
            creepMemory.stepIdx = -1;
            return false;
        }
        if (creep.pos.getRangeTo(flag) > 1) {
            this.moveNormal(creep, flag.pos, 1);
            return true;
        }
        // let spawns = flag.pos.lookFor(LOOK_STRUCTURES).filter(structure => {
        //     return structure.structureType == STRUCTURE_SPAWN;
        // });
        // if(spawns.length != 0){
        //     let spawn = <StructureSpawn>spawns[0];
        //     spawn.renewCreep(creep);
        //     if(creep.di)
        // }
        creepMemory.stepIdx++;
        return false;
    }

    protected runWithConfig(creep: Creep): boolean {
        let chaimConfig = ALL_CHAIM_CONFIG[this.roomName];
        if (!chaimConfig) {
            this.logError(`not found chaim config for ${this.roomName}`)
            return this.runWithFlag(creep);
        }

        let creepMemory = creep.memory.claim;
        if (creepMemory.stepIdx == -1) {
            return false;
        }
        if (creepMemory.stepIdx == undefined) {
            creepMemory.stepIdx = 0;
        }
        if (creepMemory.stepIdx >= chaimConfig.milestoneList.length) {
            creepMemory.stepIdx = -1;
            return false;
        }
        let posStr = chaimConfig.milestoneList[creepMemory.stepIdx];
        if (!posStr) {
            creepMemory.stepIdx = -1;
            return false;
        }
        let sp = posStr.split("_");
        let pos: RoomPosition = null;
        if (sp.length == 1) {
            pos = new RoomPosition(25, 25, sp[0]);
            if (creep.pos.roomName != sp[0]) {
                this.moveNormal(creep, pos, 1);
                return true;
            }
        } else if (sp.length == 3) {
            pos = new RoomPosition(parseInt(sp[1]), parseInt(sp[2]), sp[0]);
            if (creep.pos.getRangeTo(pos) > 1) {
                this.moveNormal(creep, pos, 1);
                return true;
            }
        } else {
            creepMemory.stepIdx = -1;
            return false;
        }
        creepMemory.stepIdx++;
        return false;
    }

    protected runBlock(creep: Creep) {
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            let runWithFlag = this.runWithConfig(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            }
            return;
        }
        let workPos = new RoomPosition(creepMemory.workPos.x, creepMemory.workPos.y, this.roomName);
        if (creep.pos.getRangeTo(workPos) > 1) {
            let runWithFlag = this.runWithConfig(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, creep.room.controller.pos, 1);
            }
            return;
        }
    }

    protected runClaim(creep: Creep) {
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            let runWithFlag = this.runWithConfig(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            }
            return;
        }
        if (creep.pos.getRangeTo(creep.room.controller) > 1) {
            let runWithFlag = this.runWithConfig(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, creep.room.controller.pos, 1);
            }
            return;
        }
        if (creep.room.controller.my) {
            creep.suicide();
            return;
        }
        if (creep.room.controller.owner || creep.room.controller.reservation) {
            creep.attackController(creep.room.controller)
            return;
        }
        creep.claimController(creep.room.controller);
    }

    protected runBuild(creep: Creep) {
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            let runWithFlag = this.runWithConfig(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            }
            return;
        }
        if (creepMemory.state == "pickup") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
                creepMemory.state = "idle";
                return;
            }
            let drop = Game.getObjectById<Resource>(creepMemory.targetId);
            if (!drop) {
                this.logError(`not found drop for ${creepMemory.roomName}`)
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(drop) > 1) {
                this.moveNormal(creep, drop.pos, 1);
                return;
            }
            creep.pickup(drop);
            return;
        }
        if (creepMemory.state == "withdraw") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
                creepMemory.state = "idle";
                return;
            }
            let structure = Game.getObjectById<StructureStorage | StructureTower | StructureExtension | StructureLink>(creepMemory.targetId);
            if (!structure || structure.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                this.logError(`not found structure for ${creepMemory.roomName}`)
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(structure) > 1) {
                this.moveNormal(creep, structure.pos, 1);
                return;
            }
            creep.withdraw(structure, RESOURCE_ENERGY);
            return;
        }

        if (creepMemory.state == "harvest") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
                creepMemory.state = "idle";
            }
            let sources: Source = Game.getObjectById(creepMemory.targetId);
            if (!sources) {
                this.logError(`not found source for ${creepMemory.roomName}`)
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(sources) > 1) {
                this.moveNormal(creep, sources.pos, 1);
                return;
            }
            creep.harvest(sources);
            return;
        }
        if (creepMemory.state == "input") {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                creepMemory.state = "idle";
                return;
            }
            let target: StructureSpawn | StructureExtension | StructureTower = Game.getObjectById(creepMemory.targetId);
            if (!target) {
                this.logError(`not found input target for ${creepMemory.roomName}`)
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(target) > 1) {
                this.moveNormal(creep, target.pos, 1);
                return;
            }
            creep.transfer(target, RESOURCE_ENERGY);
            creepMemory.targetId = null;
            return;
        }
        if (creepMemory.state == "build") {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                creepMemory.state = "idle";
                return;
            }
            let site = Game.getObjectById<ConstructionSite>(creepMemory.targetId);
            if (!site) {
                this.logError(`not found build target for ${creepMemory.roomName}`)
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(site) > 3) {
                this.moveNormal(creep, site.pos, 3);
                // this.move.reserveMove(creep, site.pos, 3)
                return;
            }
            creep.build(site);
            return;
        }
        if (creepMemory.state == "upgrade") {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                creepMemory.state = "idle";
                return;
            }
            let controller = this.roomFacility.getController();
            if (!controller) {
                this.logError(`not found controller for ${creepMemory.roomName}`);
                creepMemory.state = "idle";
                return;
            }
            if (controller.upgradeBlocked && controller.upgradeBlocked > 10) {
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(controller) > 3) {
                this.moveNormal(creep, controller.pos, 3);
                return;
            }
            creep.upgradeController(controller);
            return;
        }

        if (creepMemory.state == "deposit") {
            let target = Game.getObjectById<Structure>(creepMemory.targetId);
            if (!target) {
                this.logError(`not found deposit target for ${creepMemory.roomName}`)
                creepMemory.state = "idle";
                return;
            }
            if (creep.pos.getRangeTo(target) > 1) {
                this.moveNormal(creep, target.pos, 1);
                return;
            }
            creep.dismantle(target);
            return;
        }

        if (!creepMemory.state || creepMemory.state == "idle") {
            // //拆除invader core
            // if(!this.roomFacility.roomIsMine()){
            //     let target = this.roomFacility.getRoom().find(FIND_STRUCTURES, {
            //         filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
            //     })
            //     if(target){
            //         creepMemory.state = "deposit";
            //         creepMemory.targetId = target[0].id;
            //         return;
            //     }
            // }

            // 没资源，先找资源
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: resource => resource.resourceType == RESOURCE_ENERGY
                });
                console.log("drop" + drop);
                if (drop && drop.amount > 100) {
                    creepMemory.targetId = drop.id;
                    creepMemory.state = "pickup";
                    return;
                }

                let hostileStructureList = this.roomFacility.getHostileStructureList();
                hostileStructureList = _.filter(hostileStructureList, structure => {
                    if (structure.structureType != STRUCTURE_STORAGE
                        && structure.structureType != STRUCTURE_EXTENSION
                        && structure.structureType != STRUCTURE_TOWER
                        && structure.structureType != STRUCTURE_LINK) {
                        return false;
                    }

                    return (<StructureStorage | StructureExtension | StructureTower | StructureLink>structure).store
                        .getUsedCapacity(RESOURCE_ENERGY) > 0;
                });
                if (hostileStructureList.length > 0) {
                    let closestHostileStructure = creep.pos.findClosestByRange(hostileStructureList);
                    creepMemory.targetId = closestHostileStructure.id;
                    creepMemory.state = "withdraw";
                    return;
                }

                let sources = creep.pos.findClosestByPath(FIND_SOURCES, {
                    range: 2
                })
                if (!sources) {
                    this.logError(`not found source for ${creepMemory.roomName}`)
                    creepMemory.state = "idle";
                    return;
                }
                creepMemory.targetId = sources.id;
                creepMemory.state = "harvest";
                return;
            }
            // 优先input，10tick找一次
            if (Game.time % 2 == 0) {
                let obj = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: structure => {
                        if (structure.structureType != STRUCTURE_SPAWN
                            && structure.structureType != STRUCTURE_EXTENSION
                            && structure.structureType != STRUCTURE_TOWER) {
                            return false;
                        }
                        if (!structure.my) {
                            return false;
                        }
                        return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                if (obj) {
                    creepMemory.targetId = obj.id;
                    creepMemory.state = "input";
                    return;
                }
            }

            // build
            let sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (sites.length != 0) {
                creepMemory.targetId = sites[0].id;
                creepMemory.state = "build";
                return;
            }

            //upgrade
            let upgradeBlocked = this.roomFacility.getController().upgradeBlocked;
            if (!upgradeBlocked || upgradeBlocked < 10) {
                creepMemory.state = "upgrade";
            }
        }
    }

    protected runProtect(creep: Creep) {
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName
            || (creepMemory.stepIdx != undefined && creepMemory.stepIdx != -1)) {
            let runWithFlag = this.runWithConfig(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            }
            return;
        }

        let enemyCreep = Game.getObjectById<Creep>(creepMemory.targetId);
        if (!enemyCreep || Game.time % 10 == 0) {
            enemyCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        }
        let target: any = enemyCreep;
        if (!enemyCreep) {
            let invaderCore = this.roomFacility.getRoom().find(FIND_STRUCTURES, {
                filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
            });
            if (invaderCore.length > 0) {
                target = invaderCore[0];
            }
        }
        if (!target) {
            return;
        }
        creepMemory.targetId = target.id;
        if (creep.pos.getRangeTo(target) > 1) {
            this.moveNormal(creep, target.pos, 1);
            return;
        }
        creep.rangedAttack(target);
        creep.attack(target);
        creep.heal(creep);
    }

    protected getSpawnConfigList(): SpawnConfig[] {
        if (!this.roomFacility.needChaim()) {
            return [];
        }
        let numConfig: {
            [role in RoleType]: number
        } = {
            "claim": 1,
            "build": 4,
            "protect": 1,
            "block": 0
        }
        if (this.roomName == RoomName.E31N9) {
            numConfig.build = 4;
        }
        let fullConfig = {...numConfig};

        this.memory.creepNameList.forEach(name => {
            let creep = Game.creeps[name];
            if (!creep) {
                return;
            }
            let role = creep.memory.claim.role;
            numConfig[role]--;
        })

        let chaimConfig = ALL_CHAIM_CONFIG[this.roomName];
        if (!chaimConfig) {
            this.logError(`not found chaim config for ${this.roomName}`);
            return;
        }
        if (numConfig.claim > 0 && !this.roomFacility.roomIsMine()) {
            return [{
                spawnRoomName: chaimConfig.spawnRoom,
                body: [CLAIM, MOVE],
                memory: {
                    module: this.moduleName,
                    claim: {
                        roomName: this.roomName,
                        role: "claim"
                    }
                },
                num: 1,
                configHash: "chaim-0"
            }];
        }
        if (numConfig.build > 0) {
            return [{
                spawnRoomName: chaimConfig.spawnRoom,
                body: [WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE],
                memory: {
                    module: this.moduleName,
                    claim: {
                        roomName: this.roomName,
                        role: "build"
                    }
                },
                num: fullConfig.build,
                configHash: "chaim-b"
            }];
        }
        // Game.spawns['Spawn14'].spawnCreep([RANGED_ATTACK, MOVE], 'Worker1', {
        //     memory: {
        //         module: "claim",
        //         group: {
        //             "configHash": "chaim-b"
        //         },
        //         claim: {
        //             roomName: "W1N8",
        //             role: "protect"
        //         },
        //     }
        // });
        // Memory["roomData"]["W1N8"]["claim"].creepNameList.push("Worker1");
        if (numConfig.protect > 0 && Game.time % 19 == 0) {
            if (Game.rooms[this.roomName]) {
                let enemyCreep = Game.rooms[this.roomName].find(FIND_HOSTILE_CREEPS);
                if (enemyCreep && enemyCreep.length > 0) {
                    return [{
                        spawnRoomName: chaimConfig.spawnRoom,
                        body: [MOVE, MOVE, RANGED_ATTACK, HEAL],
                        memory: {
                            module: this.moduleName,
                            claim: {
                                roomName: this.roomName,
                                role: "protect"
                            }
                        },
                        num: fullConfig.protect,
                        configHash: "chaim-p"
                    }]
                }
                let invaderCore = this.roomFacility.getRoom().find(FIND_STRUCTURES, {
                    filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
                });
                if (invaderCore && invaderCore.length > 0) {
                    return [{
                        spawnRoomName: chaimConfig.spawnRoom,
                        body: [MOVE, MOVE, MOVE, MOVE,
                            ATTACK, ATTACK, ATTACK, ATTACK],
                        memory: {
                            module: this.moduleName,
                            claim: {
                                roomName: this.roomName,
                                role: "protect"
                            }
                        },
                        num: 3,
                        configHash: "chaim-p"
                    }]
                }
            }
        }
        // if (this.roomFacility.roomIsMine() && Game.time % 19 == 0) {
        //     let existPosSet = {}
        //     for (let name of this.memory.creepNameList) {
        //         let creep = Game.creeps[name];
        //         if (!creep) {
        //             continue;
        //         }
        //         if (creep.memory.claim.role != "block") {
        //             continue;
        //         }
        //         let key = creep.memory.claim.workPos.x + "_" + creep.memory.claim.workPos.y;
        //         existPosSet[key] = true;
        //     }
        //
        //     // controller 周围围上block
        //     let controllerPos = this.roomFacility.getController().pos;
        //     let curSpawnRoomName = chaimConfig.spawnRoom;
        //     if (this.roomFacility.getSpawnList() && this.roomFacility.getSpawnList().length > 0) {
        //         curSpawnRoomName = this.roomName;
        //     }
        //     for (let dir in directionBiasMap) {
        //         let bias = directionBiasMap[dir];
        //         let blockPos = new RoomPosition(controllerPos.x + bias.x, controllerPos.y + bias.y, controllerPos.roomName);
        //         let key = blockPos.x + "_" + blockPos.y;
        //         if (existPosSet[key]) {
        //             continue;
        //         }
        //
        //         if (!checkPos(blockPos)) {
        //             continue;
        //         }
        //         this.logInfo(`blockPos: ${blockPos.x} ${blockPos.y} ${blockPos.roomName}`);
        //         // 没有建筑，不是墙
        //         let structures = blockPos.lookFor(LOOK_STRUCTURES);
        //         if (structures && structures.length > 0) {
        //             continue;
        //         }
        //         this.logInfo(`blockPos2: ${blockPos.x} ${blockPos.y} ${blockPos.roomName}`);
        //         if (new Room.Terrain(blockPos.roomName).get(blockPos.x, blockPos.y) == TERRAIN_MASK_WALL) {
        //             continue;
        //         }
        //         this.logInfo(`blockPos3: ${blockPos.x} ${blockPos.y} ${blockPos.roomName}`);
        //         return [{
        //             spawnRoomName: curSpawnRoomName,
        //             body: [MOVE],
        //             memory: {
        //                 module: this.moduleName,
        //                 claim: {
        //                     roomName: this.roomName,
        //                     role: "block",
        //                     workPos: blockPos
        //                 }
        //             },
        //             num: 1,
        //             configHash: "chaim-block"
        //         }]
        //     }
        // }
        return [];
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    protected moveNormal(creep: Creep, pos: RoomPosition | { pos: RoomPosition }, range: number) {
        creep.moveTo(pos, {
            visualizePathStyle: {
                stroke: '#ffffff'
            },
            range: range,
            costCallback(roomName: string, costMatrix: CostMatrix): void | CostMatrix {
                if (roomName != this.roomName) {
                    return;
                }
                for (let i = 0; i < 50; i++) {
                    costMatrix.set(0, i, 255)
                    costMatrix.set(49, i, 255)
                    costMatrix.set(i, 0, 255)
                    costMatrix.set(i, 49, 255)
                }
            }
        });
    }
}