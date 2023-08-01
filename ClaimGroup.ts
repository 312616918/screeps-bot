import {RoomName} from "./Config";
import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";


export type ClaimCreepMemory = {
    roomName: RoomName;
    role: "claim" | "build";
    sourceId?: string;
    siteId?: string;
    state?: "harvest" | "build";
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
        }
    }

    protected runClaim(creep: Creep) {
        if (this.roomFacility.roomIsMine()) {
            return;
        }
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
            return;
        }
        if (creep.pos.getRangeTo(creep.room.controller) > 1) {
            this.moveNormal(creep, creep.room.controller.pos, 1);
            return;
        }
        creep.claimController(creep.room.controller);
        creep.suicide();
    }

    protected runBuild(creep: Creep) {
        if (!this.roomFacility.roomIsMine() || this.roomFacility.getSpawnList().length != 0) {
            return;
        }
        let creepMemory = creep.memory.claim;
        let targetRoomName = creepMemory.roomName;
        if (creep.room.name != targetRoomName) {
            this.moveNormal(creep, new RoomPosition(25, 25, targetRoomName), 1);
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
                this.moveNormal(creep, site.pos, 3);
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


    protected getSpawnConfigList(): SpawnConfig[] {
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
            body: [WORK, WORK, WORK, WORK, WORK,
                CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE],
            memory: {
                module: this.moduleName,
                claim: {
                    roomName: this.roomName,
                    role: "build"
                }
            },
            num: 1
        }];
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }


}