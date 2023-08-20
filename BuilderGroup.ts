import {RoomName} from "./Config";
import {BaseGroup, GroupMemory, SpawnConfig} from "./BaseGroup";


export type BuildCreepMemory = {
    targetId: string;
    workPos?: RoomPosition;
}

export type BuildMemory = {
    workPosMap: { [targetId: string]: string };
} & GroupMemory;

export class BuilderGroup extends BaseGroup<BuildMemory> {
    protected moduleName: string = "build";

    protected getSpawnConfigList(): SpawnConfig[] {
        if (Game.time % 10 != 0) {
            return [];
        }
        let sites = this.roomFacility.getConstructionSiteList();
        if (sites.length == 0) {
            return [];
        }
        let body: BodyPartConstant[] = [];
        if(this.roomFacility.isInLowEnergy()){
            body = [WORK, CARRY, MOVE];
        }else{
            let partNum = (this.roomFacility.getRoom().energyAvailable-100) / 200;
            partNum = Math.floor(partNum);
            partNum = Math.min(4, partNum);
            if(partNum < 1){
                return [];
            }
            for (let i = 0; i < partNum; i++) {
                body.push(WORK);
                body.push(CARRY);
                body.push(CARRY);
            }
            body.push(MOVE);
            body.push(MOVE);
        }
        console.log(`room ${this.roomName} build body: ${JSON.stringify(body)}`)
        return [{
            body: body,
            memory: {
                module: this.moduleName,
                build: {
                    targetId: sites[0].id,
                }
            },
            num: 1
        }];
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.build;
        let target = Game.getObjectById<ConstructionSite>(creepMemory.targetId);
        if (!target) {
            let sites = this.roomFacility.getConstructionSiteList();
            if (sites.length == 0) {
                return;
            }
            target = sites[0];
            creepMemory.targetId = target.id;
        }
        // if (!creepMemory.workPos) {
        //     for (let idx = 0; idx < 9; idx++) {
        //         let curX = target.pos.x + idx % 3 - 1;
        //         let curY = target.pos.y + Math.floor(idx / 3) - 1;
        //         let posKey = `${curX}-${curY}`;
        //         if (!this.memory.workPosMap) {
        //             this.memory.workPosMap = {};
        //         }
        //         if (this.memory.workPosMap[posKey]) {
        //             continue;
        //         }
        //         let pos = new RoomPosition(curX, curY, target.pos.roomName);
        //         let blockObj = pos.look().filter(obj => {
        //             if (obj.type == "structure") {
        //                 if (obj.structure.structureType == STRUCTURE_ROAD || obj.structure.structureType == STRUCTURE_CONTAINER) {
        //                     return false;
        //                 }
        //                 return true;
        //             }
        //             if (obj.type == "terrain") {
        //                 return obj.terrain == "wall";
        //             }
        //             if (obj.type == "creep") {
        //                 let creep = obj.creep;
        //                 return creep.memory.module != "carry";
        //             }
        //             return false;
        //         })
        //         console.log("block obj:" + JSON.stringify(blockObj));
        //         if (blockObj.length > 0) {
        //             continue;
        //         }
        //         creepMemory.workPos = pos;
        //         this.memory.workPosMap[posKey] = creep.name;
        //         break;
        //     }
        // }
        // if (!creepMemory.workPos) {
        //     console.log(`no work pos ${creep.name}`);
        //     return;
        // }
        // let workPos = new RoomPosition(creepMemory.workPos.x, creepMemory.workPos.y, creepMemory.workPos.roomName);
        // if (creep.pos.getRangeTo(workPos) != 0) {
        //     this.move.reserveMove(creep, target.pos, 0);
        //     return;
        // }
        if (creep.pos.getRangeTo(target) > 3) {
            this.move.reserveMove(creep, target.pos, 3);
            return;
        }
        let res = creep.build(target);
        if (creep.store.getFreeCapacity() > 20) {
            this.roomFacility.submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: RESOURCE_ENERGY,
                objId: creep.id,
                amount: creep.store.getCapacity(),
                objType: "builder"
            })
        }
    }


    protected beforeRecycle(creepMemory: CreepMemory): void {
        let workPos = creepMemory.build.workPos;
        if (workPos) {
            let posKey = `${workPos.x}-${workPos.y}`;
            delete this.memory.workPosMap[posKey];
        }
    }


}