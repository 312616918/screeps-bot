import {RoomName} from "./globalConfig";
import {Carry, CarryMemory} from "./carry";
import {Facility, FacilityMemory} from "./facility";
import {Harvest, HarvestMemory} from "./harvest";
import {Upgrade, UpgradeMemory} from "./upgrade";
import {Build, BuildMemory} from "./build";
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
    // move: MoveMemory;
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
    private roomData: RoomData;

    constructor(roomName: RoomName) {
        this.roomName = roomName;


        //init memory
        if (!Memory.roomData) {
            Memory.roomData = {}
        }
        if (!Memory.roomData[this.roomName]) {

            //todo check and init sub module data
            Memory.roomData[this.roomName] = {
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
                // move: {},
                upgrade: {
                    creepNameList: []
                }
            }
        }
        //init sub module
        this.roomData = Memory.roomData[this.roomName];
        this.facility = new Facility(this.roomName, this.roomData.facility);
        this.carry = new Carry(this.roomName, this.roomData.carry, this.roomData.facility);
        this.harvest = new Harvest(this.roomName, this.roomData.harvest, this.roomData.facility);
        this.upgrade = new Upgrade(this.roomName, this.roomData.upgrade, this.roomData.facility);
        this.build = new Build(this.roomName, this.roomData.build, this.roomData.facility);
    }

    //主流程
    public run(): void {
        //1. facility
        this.facility.refresh()

        //2. normal module
        this.harvest.run()
        this.carry.run()
        this.upgrade.run()
        this.build.run()

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
        let room = Game.rooms[this.roomName];
        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                this.carry.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }

        if (this.roomData.facility.upgrade) {
            let upgradeLink = Game.getObjectById<StructureLink>(this.roomData.facility.upgrade.linkId)
            if (upgradeLink && upgradeLink.store.getUsedCapacity("energy") > 0) {
                this.carry.addCarryReq(upgradeLink, "output", "energy", upgradeLink.store.getUsedCapacity("energy"));
            }
        }

        let spawn = Game.spawns["s1"];
        if (spawn.store.getFreeCapacity("energy") != 0) {
            this.carry.addCarryReq(spawn, "input", "energy", spawn.store.getFreeCapacity("energy"));
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

    }
}