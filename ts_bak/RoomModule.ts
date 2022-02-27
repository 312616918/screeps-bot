import {RoomName} from "./config";
import {Carry, CarryMemory} from "./carry";
import {Facility, FacilityMemory} from "./facility";
import {Harvest, HarvestMemory} from "./harvest";
import {Upgrade, UpgradeMemory} from "./upgrade";
import {Build, BuildMemory} from "./build";
import {Move, MoveMemory} from "./move";
import {Spawn} from "./spawn";

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
}


export class RoomModule {

    private readonly roomName: RoomName;
    private roomMemory: RoomMemory;

    //sub module
    private facility :Facility;
    private carry: Carry;
    private harvest:Harvest;
    private upgrade:Upgrade;
    private build:Build;

    constructor(roomName:RoomName) {
        this.roomName = roomName;

        //init sub module
        this.facility = new Facility(this.roomName);
        this.carry = new Carry(this.roomName);
        this.harvest = new Harvest(this.roomName);
        this.upgrade = new Upgrade(this.roomName);
        this.build = new Build(this.roomName);

        //init memory
        if(!Memory.roomData){
            Memory.roomData = {}
        }
        if(!Memory.roomData[this.roomName]){
            Memory.roomData[this.roomName]={
                build: {},
                carry: {},
                facility: {},
                harvest: {},
                move: {},
                upgrade: {}
            }
        }
    }

    //主流程
    public run():void{
        //facility
        this.facility


        let moveModule = new Move(this.roomName);

        this.facility.runLink();

        this.carry.run();
        this.carry.visual();

        this.harvest.run();

        this.upgrade.run();

        this.build.run();

        moveModule.moveAll();

        Spawn.spawnCreep();

        let room = Game.rooms[this.roomName];

        let sourceConfig = Memory.facility[this.roomName].sources;
        if (sourceConfig) {
            // for (let sourceId in sourceConfig) {
            //     let config = sourceConfig[sourceId];
            //     let container = Game.getObjectById<StructureContainer>(config.containerId);
            //     if (!container) {
            //         continue;
            //     }
            //     let amount = container.store.getUsedCapacity("energy");
            //     if (amount < 200) {
            //         continue;
            //     }
            //     carryModule.addCarryReq(container, "output", "energy", amount);
            // }
        }

        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                this.carry.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }
        try {
            let fac = Memory.facility;
            let upgradeLink = Game.getObjectById<StructureLink>(fac[this.roomName].upgrade.linkId)
            if (upgradeLink && upgradeLink.store.getUsedCapacity("energy") > 0) {
                this.carry.addCarryReq(upgradeLink, "output", "energy", upgradeLink.store.getUsedCapacity("energy"));
            }
        } catch (e) {
            console.log(e)
        }


        let spawn = Game.spawns["Spawn1"];
        if (spawn.store.getFreeCapacity("energy") != 0) {
            this.carry.addCarryReq(spawn, "input", "energy", spawn.store.getFreeCapacity("energy"));
        }

    }
}