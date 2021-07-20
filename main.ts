import {RoomName} from "./config";
import {Harvest} from "./harvest";

module.exports.loop = function () {
    for (let roomNameStr in RoomName) {
        let roomName = <RoomName>roomNameStr;
        let harvestModule = new Harvest(roomName);
        harvestModule.run();

    }
}