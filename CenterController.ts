import {availableRoomName, RoomName, TerminalConfig, terminalConfigMap} from "./Config";
import {RoomController} from "./RoomController";
import {ExpandController} from "./ExpandController";
import {Metric} from "./Metric";
import _ = require("lodash");


export class CenterController {
    public run() {
        let roomControllerList = this.getRoomControllerList();
        for (let i = 0; i < roomControllerList.length; i++) {
            let roomController = roomControllerList[i];
            try {
                let bucket = Game.cpu.bucket;
                //占领中，全速运行
                let fac = roomController.getRoomFacility();
                if (bucket < 200 && i > 2 && !fac.needChaim() && !fac.isRunningExpand()) {
                    Metric.recordCount(1, "type", "room_stop", "room", roomController.getRoomName())
                    continue;
                }
                let startTimestamp = (new Date()).valueOf();
                roomController.run();
                let cost = (new Date()).valueOf() - startTimestamp;
                Metric.recordGauge(cost, "type", "room_time_cost", "room", roomController.getRoomName());
            } catch (e) {
                console.log(`room ${roomController.getRoomName()} error`);
                console.log(e.stack);
            }
        }
        this.deleteDeadCreep();
        this.runExpand();
        this.runPixel();
        // this.runTerminal(roomControllerList);
        this.drawCode();
        this.clearLossRoomMemory();
    }

    private clearLossRoomMemory(){
        if(Game.time % 1000 !=0){
            return;
        }
        let memoryRooms = Object.keys(Memory.roomData);
        for(let roomName of memoryRooms) {
            if (!availableRoomName.includes(<RoomName>roomName)) {
                console.log(`delete room ${roomName}`);
                delete Memory.roomData[roomName];
            }
        }
    }

    private getRoomControllerList() {

        if (!Memory.roomData) {
            Memory.roomData = {}
        }

        let roomControllerList: RoomController[] = [];
        for (let roomName of availableRoomName) {
            let roomMemory = Memory.roomData[roomName];
            if (!roomMemory) {
                // @ts-ignore
                roomMemory = {};
                Memory.roomData[roomName] = roomMemory;
            }
            let roomController = new RoomController(RoomName[roomName], roomMemory);
            roomControllerList.push(roomController);
        }
        // shuffle，以免cpu不足，room长期不能执行
        roomControllerList = _.shuffle(roomControllerList)
        return roomControllerList;
    }

    private runExpand() {
        try {
            if (!Memory.expand) {
                Memory.expand = {}
            }
            let expandController = new ExpandController(Memory.expand);
            expandController.run();
        } catch (e) {
            console.log(e.stack);
        }
    }

    private runPixel() {
        let bucket = Game.cpu.bucket;
        // blue
        console.log(`<span style="color: #66FFFF;">[REPORT] [${Game.time % 1000}]cpu: ${Game.cpu.getUsed().toFixed(2)} bucket: ${bucket}</span>`)
        // console.log("[CPU]:" + Game.cpu.getUsed().toFixed(2) + "  [BUCKET]:" + bucket)

        if (Game.time % 10 == 0) {
            if (!Memory.status) {
                Memory.status = {
                    bucketTime: Game.time
                }
            }

            if (bucket >= 10000 && Game.time - Memory.status.bucketTime >= 10) {
                Game.cpu.generatePixel();
            }
            Memory.status.bucketTime = Game.time;
        }
    }

    private deleteDeadCreep() {
        if (Game.time % 1000 == 0) {
            for (let name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    console.log(`delete creep ${name}`)
                    delete Memory.creeps[name];
                }
            }
        }
    }

    private runTerminal(roomControllerList: RoomController[]) {
        let sendInRoomController: RoomController;
        let sendInConfig: TerminalConfig;
        roomControllerList.forEach(roomController => {
            let config = terminalConfigMap[roomController.getRoomName()];
            if (!config) {
                return;
            }
            if (config.type == "input") {
                sendInRoomController = roomController;
                sendInConfig = config;
            }
        })

        if (!sendInRoomController) {
            return;
        }

        let sendInTerminal = sendInRoomController.getRoomFacility().getTerminal();
        let sendInStorage = sendInRoomController.getRoomFacility().getStorage();
        if (!sendInTerminal || !sendInStorage) {
            return;
        }

        roomControllerList.forEach(roomController => {
            let config = terminalConfigMap[roomController.getRoomName()];
            if (!config) {
                return;
            }
            if (config.type != "output") {
                return;
            }
            let terminal = roomController.getRoomFacility().getTerminal();
            let storage = roomController.getRoomFacility().getStorage();
            if (!terminal || !storage) {
                return;
            }
            if (storage.store.getUsedCapacity("energy") <= config.maxStorageEnergy) {
                return;
            }
            if (terminal.store.getUsedCapacity("energy") >= 50000 && sendInTerminal.store.getFreeCapacity("energy") >= 50000) {
                let sendAmount = Math.min(terminal.store.getUsedCapacity("energy"), 50000 / 2);
                let res = terminal.send("energy", sendAmount, sendInRoomController.getRoomName());
                console.log(`send energy ${sendAmount} ${res}`)
                return;
            }
            if (terminal.store.getFreeCapacity("energy") < 10000) {
                return;
            }
            roomController.getRoomFacility().submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: "energy",
                objId: terminal.id,
                amount: 50000,
                objType: "terminal"
            })
        })

        if (sendInTerminal.store.getUsedCapacity("energy") > 1000
            && sendInStorage.store.getFreeCapacity("energy") > 1000) {
            sendInRoomController.getRoomFacility().submitEvent({
                    type: "needCarry",
                    subType: "output",
                    resourceType: "energy",
                    objId: sendInTerminal.id,
                    amount: sendInTerminal.store.getUsedCapacity("energy"),
                    objType: "terminal"
                }
            )
        }
    }

    private drawCode() {
        if (!Memory.codeDraw) {
            return;
        }
        try {
            for (let key in Memory.codeDraw) {
                let showFlag = Game.flags[`${key}_show`]
                if (!showFlag) {
                    continue;
                }
                let build = false;
                if (Game.flags[`${key}_build`]) {
                    build = true;
                }
                let valueStr = Memory.codeDraw[key];
                let codeArray = JSON.parse(valueStr);
                let room = Game.rooms[showFlag.pos.roomName];
                for (let i = 0; i < codeArray.length; i++) {
                    for (let j = 0; j < codeArray[i].length; j++) {
                        let pos = new RoomPosition(showFlag.pos.x + j, showFlag.pos.y + i, showFlag.pos.roomName);
                        room.visual.text(codeArray[i][j], pos, {
                            align: "left",
                            font: "10px monospace",
                            opacity: 0.5
                        })
                        if (!build) {
                            continue;
                        }
                        if (codeArray[i][j] == 0) {
                            continue;
                        }
                        // 已经有建筑或者site
                        if (pos.lookFor(LOOK_STRUCTURES).length > 0) {
                            continue;
                        }
                        if (pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
                            build = false;
                            continue;
                        }
                        room.createConstructionSite(pos, STRUCTURE_WALL);
                        build = false;
                    }
                }
            }
        } catch (e) {
            console.log(e.stack)
        }
    }
}