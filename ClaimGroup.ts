import {RoomName} from "./Config";
import {BaseGroup, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";


export type ClaimCreepMemory = {
    roomName: RoomName;
    role: "claim" | "build" | "protect";
    sourceId?: string;
    siteId?: string;
    state?: "harvest" | "build" | "input";
    attackId?: string;
    stepIdx?: number;
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

    protected runClaim(creep: Creep) {
        if (this.roomFacility.roomIsMine()) {
            return;
        }
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            let runWithFlag = this.runWithFlag(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            }
            return;
        }
        if (creep.pos.getRangeTo(creep.room.controller) > 1) {
            let runWithFlag = this.runWithFlag(creep);
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
        if (!this.roomFacility.roomIsMine() || this.roomFacility.getSpawnList().length != 0) {
            return;
        }
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            let runWithFlag = this.runWithFlag(creep);
            if (!runWithFlag) {
                this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            }
            return;
        }
        if (creepMemory.state == "build") {
            let energyNum = creep.getActiveBodyparts(WORK) * 5;
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= energyNum) {
                creepMemory.state = "harvest";
            }
            let site = Game.getObjectById<ConstructionSite>(creepMemory.siteId);
            if (!site) {
                let sites = creep.room.find(FIND_CONSTRUCTION_SITES).filter(site => {
                    return site.structureType == STRUCTURE_SPAWN;
                });
                if (sites.length == 0) {
                    return;
                }
                site = sites[0];
                creepMemory.siteId = site.id;
            }
            if (creep.pos.getRangeTo(site) > 3) {
                // this.moveNormal(creep, site.pos, 3);
                this.move.reserveMove(creep, site.pos, 3)
                return;
            }
            creep.build(site);
            return;
        }
        let energyNum = creep.getActiveBodyparts(WORK) * 2;
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= energyNum) {
            creepMemory.state = "build";
        }
        let sources = Game.getObjectById<Source>(creepMemory.sourceId);
        if (!sources) {
            sources = creep.pos.findClosestByPath(FIND_SOURCES)
            if (creepMemory.siteId) {
                creepMemory.sourceId = sources.id;
            }
        }
        if (creep.pos.getRangeTo(sources) > 1) {
            this.moveNormal(creep, sources.pos, 1);
            return;
        }
        creep.harvest(sources);
    }

    protected runProtect(creep: Creep) {
        if (!this.roomFacility.roomIsMine() || this.roomFacility.getSpawnList().length != 0) {
            return;
        }
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            return;
        }
        let enemyCreep = Game.getObjectById<Creep>(creepMemory.attackId);
        if (!enemyCreep || Game.time % 10 == 0) {
            enemyCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        }
        if (!enemyCreep) {
            return;
        }
        creepMemory.attackId = enemyCreep.id;
        if (creep.pos.getRangeTo(enemyCreep) > 3) {
            this.moveNormal(creep, enemyCreep.pos, 3);
            return;
        }
        creep.rangedAttack(enemyCreep);
        creep.heal(creep);
    }

    protected getSpawnConfigList(): SpawnConfig[] {
        // if (this.roomFacility.roomIsMine() && this.roomFacility.getController().level > 1) {
        //     return [{
        //         spawnRoomName: RoomName.W3N18,
        //         body: [MOVE, MOVE, RANGED_ATTACK, HEAL],
        //         memory: {
        //             module: this.moduleName,
        //             claim: {
        //                 roomName: this.roomName,
        //                 role: "protect"
        //             }
        //         },
        //         num: 1
        //     }]
        // }

        if (!this.roomFacility.roomIsMine()) {
            return [{
                spawnRoomName: RoomName.W2N18,
                body: [CLAIM, MOVE],
                memory: {
                    module: this.moduleName,
                    claim: {
                        roomName: this.roomName,
                        role: "claim"
                    }
                },
                num: 1
            }];
        }
        if (this.roomFacility.getSpawnList().length != 0) {
            return;
        }
        return [{
            spawnRoomName: RoomName.W2N18,
            body: [WORK, WORK, WORK, WORK,
                CARRY,
                MOVE, MOVE, MOVE, MOVE],
            memory: {
                module: this.moduleName,
                claim: {
                    roomName: this.roomName,
                    role: "build"
                }
            },
            num: 1,
            configHash: "build-0"
        }];
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }


}