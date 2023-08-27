import {RoomController} from "./RoomController";
import {RoomName} from "./Config";
import {ExpandController} from "./ExpandController";
import {CenterController} from "./CenterController";


const profiler = require('screeps-profiler');


profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function () {
        let controller = new CenterController();
        controller.run();
    });
}

