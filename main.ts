import {RoomController} from "./RoomController";
import {RoomName} from "./Config";
import {ExpandController} from "./ExpandController";
import {CenterController} from "./CenterController";
import {Metric} from "./Metric";
import {TmpMemory} from "./TmpMemory";


const profiler = require('screeps-profiler');


profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function () {
        if (!Memory.metric) {
            Memory.metric = {
                record: []
            }
        }
        Metric.init(Memory.metric);
        Metric.recordCount(1, "type", "tick_run")
        TmpMemory.metric();
        let controller = new CenterController();
        controller.run();
        Metric.recordGauge(Game.cpu.getUsed(), "type", "cpu_used")
        Metric.recordGauge(Game.cpu.bucket, "type", "cpu_bucket")
        Metric.fresh();
    });
}

