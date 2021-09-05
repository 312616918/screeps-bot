import {RoomName} from "./config";
import {Harvest} from "./harvest";
import {Upgrade} from "./upgrade";
import {Carry} from "./carry";
import {Facility} from "./facility";

module.exports.loop = function () {
    Facility.refresh();
    for (let roomNameStr in RoomName) {
        let roomName = <RoomName>roomNameStr;
        let harvestModule = new Harvest(roomName);
        harvestModule.run();

        let upgradeModule = new Upgrade(roomName);
        upgradeModule.run();

        let carryModule = new Carry(roomName);
        carryModule.run();

        let room = Game.rooms[roomName];
        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                carryModule.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }
    }
}