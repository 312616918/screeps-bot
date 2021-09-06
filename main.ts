import {RoomName} from "./config";
import {Harvest} from "./harvest";
import {Upgrade} from "./upgrade";
import {Carry} from "./carry";
import {Facility} from "./facility";
import {Spawn} from "./spawn";
import {Build} from "./build";

module.exports.loop = function () {
    Facility.refresh();
    for (let roomNameStr in RoomName) {
        let roomName = <RoomName>roomNameStr;

        let carryModule = new Carry(roomName);
        carryModule.run();

        let harvestModule = new Harvest(roomName);
        harvestModule.run();

        let upgradeModule = new Upgrade(roomName);
        upgradeModule.run();

        let buildModule = new Build(roomName);
        buildModule.run();


        Spawn.spawnCreep();

        let room = Game.rooms[roomName];
        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                carryModule.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }

        let spawn=Game.spawns["Spawn-W23S23-01"];
        if(spawn.store.getFreeCapacity("energy")!=0){
            carryModule.addCarryReq(spawn,"input","energy",spawn.store.getFreeCapacity("energy"));
        }
    }
}