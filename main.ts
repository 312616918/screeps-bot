import {RoomName} from "./globalConfig";
import {RoomModule} from "./RoomModule";
import {Spawn} from "./spawn";
import {Expand} from "./expand";
// import {RoomModule} from "./room_modules/RoomModule";

module.exports.loop = function () {

    for (let r in RoomName) {
        let roomName = <RoomName>r;

        let roomModule = new RoomModule(roomName);
        roomModule.run();
    }
    Spawn.spawnCreep();
    Spawn.show();

}