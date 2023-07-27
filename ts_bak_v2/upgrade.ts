import {BaseModule} from "./baseModule";
import {globalConfig, RoomName} from "./globalConfig";
import {Spawn} from "./spawn";
import * as _ from "lodash";
import {Carry} from "./carry";
import {FacilityMemory} from "./facility";


export type UpgradeMemory = {
    creepNameList: string[];
}

export type UpgradeCreepMemory = {
    roomName: RoomName;
    index: number;
    targetId: string;
    //工作地点，无此属性代表以就位
    workPosition?: RoomPosition;
}

export class Upgrade {

    protected readonly roomName: RoomName;
    protected link: StructureLink;
    protected memory: UpgradeMemory;
    protected fac: FacilityMemory;

    public constructor(roomName: RoomName, m: UpgradeMemory, fac: FacilityMemory) {
        this.roomName = roomName;
        this.memory = m;
        this.fac = fac;
        if(fac.upgrade){
            this.link = Game.getObjectById(fac.upgrade.linkId);
        }
    }

    protected spawnCreeps() {

        if (this.memory.creepNameList.length >= globalConfig[this.roomName].upgrade.creepConfigs.length) {
            return;
        }
        let room = Game.rooms[this.roomName];
        for (let i in globalConfig[this.roomName].upgrade.creepConfigs) {
            let isExist = false;
            for (let creepName of this.memory.creepNameList) {
                let creep = Game.creeps[creepName];
                if (!creep) {
                    continue;
                }
                if (creep.memory.upgrade.index == Number.parseInt(i)) {
                    isExist = true;
                    break;
                }
            }
            if (isExist) {
                continue;
            }
            let pos = globalConfig[this.roomName].upgrade.creepConfigs[i].pos;
            let creepName = `upgrade-${this.roomName}-${Game.time}-${i}`;

            let bodys: BodyPartConstant[] = [];
            for (let part in globalConfig[this.roomName].upgrade.defaultParts) {
                let partAmount = globalConfig[this.roomName].upgrade.defaultParts[part];
                bodys = bodys.concat(new Array(partAmount).fill(part))
            }
            Spawn.reserveCreep({
                bakTick: 0,
                body: bodys,
                memory: {
                    module: "upgrade",
                    upgrade: {
                        roomName: this.roomName,
                        index: Number.parseInt(i),
                        targetId: room.controller.id,
                        workPosition: pos
                    }
                },
                name: creepName,
                priority: 0,
                spawnNames: this.fac.spawnNames
            })
            this.memory.creepNameList.push(creepName);
        }

    }

    protected recoveryCreep(creepName: string) {
        delete Memory.creeps[creepName];
        _.remove(this.memory.creepNameList, function (e) {
            return e == creepName;
        })
    }

    run() {
        let nameSet = {}
        for (let creepName of this.memory.creepNameList) {
            if (nameSet[creepName]) {
                console.log(`creep name duplicate: ${this.roomName} ${creepName}`);
                continue;
            }
            nameSet[creepName] = true
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            var target = Game.getObjectById<StructureController>(creep.memory.upgrade.targetId);
            if (!target) {
                return;
            }
            let pos = creep.memory.upgrade.workPosition;
            // let workPos = pos;
            if (pos) {
                let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
                if (creep.pos.getRangeTo(workPos)) {
                    creep.moveTo(workPos, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        },
                        costCallback: function(roomName, costMatrix) {
                            if(roomName == "W7N24") {
                                for(let x = 0;x < 50;x++){
                                    costMatrix.set(x,0,255)
                                    costMatrix.set(x,1,0)
                                }
                            }
                        }
                    });
                    // return;
                } else {
                    delete creep.memory.upgrade["workPosition"];
                }
            }
            creep.upgradeController(target);
            if (creep.store.getFreeCapacity() <= 20) {
                continue;
            }
            if (this.link && this.link.store.getUsedCapacity("energy") != 0) {
                creep.withdraw(this.link, "energy");
                continue;
            }
            let carryModule = Carry.entities[this.roomName];
            if (carryModule) {
                carryModule.addCarryReq(creep, "input", "energy", creep.store.getCapacity() + 400);
            }else{
                console.log("no carry module "+ this.roomName);
            }

        }
        this.spawnCreeps()
    }
}