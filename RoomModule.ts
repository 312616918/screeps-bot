import {RoomName} from "./globalConfig";
import {Carry, CarryMemory} from "./carry";
import {Facility, FacilityMemory} from "./facility";
import {Harvest, HarvestMemory} from "./harvest";
import {Upgrade, UpgradeMemory} from "./upgrade";
import {Build, BuildMemory} from "./build";
import {Expand, ExpandMemory} from "./expand";
import {Move, MoveMemory} from "./move";
// import {Move, MoveMemory} from "./move";

export type RoomData = {
    //基础设施
    facility: FacilityMemory;
    //运输模块存储
    carry: CarryMemory;
    //采集模块
    harvest: HarvestMemory;
    //升级模块
    upgrade: UpgradeMemory;
    //建造模块
    build: BuildMemory;
    //移动控制模块
    move: MoveMemory;
    //扩张模块
    expand: ExpandMemory;
}


export class RoomModule {

    private readonly roomName: RoomName;
    private roomMemory: RoomMemory;

    //sub module
    private facility: Facility;
    private carry: Carry;
    private harvest: Harvest;
    private upgrade: Upgrade;
    private build: Build;
    private expand: Expand;
    private move: Move;

    private roomData: RoomData;


    constructor(roomName: RoomName) {
        this.roomName = roomName;


        //init memory
        if (!Memory.roomData) {
            Memory.roomData = {}
        }
        let defaultRoomData: RoomData = {
            build: {
                creepNameList: []
            },
            carry: {
                creepNameList: [],
                taskMap: {}
            },
            facility: {},
            harvest: {
                creepNameList: []
            },
            move: {
                pathCache: {}
            },
            upgrade: {
                creepNameList: []
            },
            expand: {
                creepNameList: []
            }
        }
        if (!Memory.roomData[this.roomName]) {
            Memory.roomData[this.roomName] = defaultRoomData
        }
        //init sub module
        this.roomData = Memory.roomData[this.roomName];
        for (let key in defaultRoomData) {
            if (!this.roomData[key]) {
                this.roomData[key] = defaultRoomData[key];
            }
        }

        this.facility = new Facility(this.roomName, this.roomData.facility);
        this.carry = new Carry(this.roomName, this.roomData.carry, this.roomData.facility);
        this.harvest = new Harvest(this.roomName, this.roomData.harvest, this.roomData.facility);
        this.upgrade = new Upgrade(this.roomName, this.roomData.upgrade, this.roomData.facility);
        this.build = new Build(this.roomName, this.roomData.build, this.roomData.facility);
        // if (this.roomName == RoomName.W3N19) {
        //     this.expand = new Expand(this.roomName, this.roomData.expand, this.roomData.facility);
        // }


        // if (this.roomName == RoomName.W7N18) {
        this.move = new Move(this.roomName, this.roomData.move, this.roomData.facility)
        this.carry.setMove(this.move);
        // }
    }

    //主流程
    public run(): void {

        this.facility.refresh()
        this.facility.initCreepPos()

        let room = Game.rooms[this.roomName];
        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                this.carry.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }

        let ruins = room.find(FIND_RUINS);
        if (ruins.length != 0) {
            for (let r of ruins) {
                for (let type in r.store) {
                    let sAmount = r.store.getUsedCapacity(<ResourceConstant>type);
                    if (sAmount) {
                        this.carry.addCarryReq(r, "output", <ResourceConstant>type, sAmount);
                    }
                }
            }
        }


        for (let spawnName of this.roomData.facility.spawnNames) {
            let spawn = Game.spawns[spawnName];
            if (spawn.store.getFreeCapacity("energy") != 0) {
                this.carry.addCarryReq(spawn, "input", "energy", spawn.store.getFreeCapacity("energy"));
            }
        }

        let extensionIds = this.roomData.facility.extensionIds;
        if (extensionIds) {
            for (let id of extensionIds) {
                let extension = Game.getObjectById<StructureExtension>(id);
                let freeCapacity = extension.store.getFreeCapacity("energy");
                if (freeCapacity > 0) {
                    this.carry.addCarryReq(extension, "input", "energy", freeCapacity);
                }
            }
        }

        for (let sourceId in this.roomData.facility.sources) {
            let config = this.roomData.facility.sources[sourceId];
            let container = Game.getObjectById<StructureContainer>(config.containerId);
            if (!container) {
                continue;
            }
            let amount = container.store.getUsedCapacity("energy");
            if (amount < 200) {
                continue;
            }
            this.carry.addCarryReq(container, "output", "energy", amount);
        }


        //1. facility
        this.facility.refresh()
        this.facility.runTower()
        this.facility.runLink()

        //2. normal module
        this.harvest.run()
        this.carry.run()
        this.carry.visual()
        this.upgrade.run()
        this.build.run()
        if (this.expand) {
            this.expand.run();
        }
        if (this.move) {
            this.move.moveAll();
            this.move.cleanCache();
        }


        //3. arrange carry
        // let sourceConfig = Memory.facility[this.roomName].sources;
        // if (sourceConfig) {
        //     // for (let sourceId in sourceConfig) {
        //     //     let config = sourceConfig[sourceId];
        //     //     let container = Game.getObjectById<StructureContainer>(config.containerId);
        //     //     if (!container) {
        //     //         continue;
        //     //     }
        //     //     let amount = container.store.getUsedCapacity("energy");
        //     //     if (amount < 200) {
        //     //         continue;
        //     //     }
        //     //     carryModule.addCarryReq(container, "output", "energy", amount);
        //     // }
        // }

        // if (this.roomData.facility.upgrade) {
        //     let upgradeLink = Game.getObjectById<StructureLink>(this.roomData.facility.upgrade.linkId)
        //     if (upgradeLink && upgradeLink.store.getUsedCapacity("energy") > 0) {
        //         this.carry.addCarryReq(upgradeLink, "output", "energy", upgradeLink.store.getUsedCapacity("energy"));
        //     }
        // }


        // let cs = room.find(FIND_CREEPS).map((s) => s.name);
        //
        // for(let creepName of cs){
        //     if(creepName.startsWith("carry") && this.roomData.carry.creepNameList.indexOf(creepName)==-1){
        //         this.roomData.carry.creepNameList.push(creepName);
        //     }
        //
        //     if(creepName.startsWith("harvest") && this.roomData.harvest.creepNameList.indexOf(creepName)==-1){
        //         this.roomData.harvest.creepNameList.push(creepName);
        //     }
        //
        //     if(creepName.startsWith("upgrade") && this.roomData.upgrade.creepNameList.indexOf(creepName)==-1){
        //         this.roomData.upgrade.creepNameList.push(creepName);
        //     }
        // }
    }
}