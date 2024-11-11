import {availableRoomName, DISPATCH_CONFIG_LIST, RoomName} from "./Config";
import {RoomController} from "./RoomController";
import {ExpandController} from "./ExpandController";
import {Metric} from "./Metric";
import _ = require("lodash");
import {Observer} from "./Observer";


export class CenterController {
    public run() {
        let roomControllerList = this.getRoomControllerList();
        Observer.initEachTick();
        for (let i = 0; i < roomControllerList.length; i++) {
            let roomController = roomControllerList[i];
            try {
                let bucket = Game.cpu.bucket;
                if (bucket < 1000 && i > 2 && !this.mustKeepRunning(roomController)) {
                    Metric.recordCount(1, "type", "room_stop", "room", roomController.getRoomName())
                    continue;
                }
                let startTimestamp = (new Date()).valueOf();
                let cpuUsed = Game.cpu.getUsed();
                roomController.run();
                let cost = (new Date()).valueOf() - startTimestamp;
                let cpuCost = Game.cpu.getUsed() - cpuUsed;
                Metric.recordGauge(cost, "type", "room_time_cost", "room", roomController.getRoomName());
                Metric.recordGauge(cpuCost, "type", "room_cpu_cost", "room", roomController.getRoomName());
            } catch (e) {
                console.log(`room ${roomController.getRoomName()} error`);
                console.log(e.stack);
            }
        }
        this.deleteDeadCreep();
        this.runExpand();
        this.runPixel();
        this.runTerminal(roomControllerList);
        this.drawCode();
        this.clearLossRoomMemory();
    }

    private mustKeepRunning(roomController: RoomController): boolean {
        // 特殊房间
        if (roomController.getRoomName() == RoomName.E9N9) {
            return true;
        }
        // 战争
        let fac = roomController.getRoomFacility();
        //占领中，全速运行
        if (fac.isRunningExpand()) {
            return true;
        }
        //防御中
        if (fac.getHostileCreepList().length > 0) {
            return true;
        }
        //占领中
        if (fac.needChaim()) {
            return true;
        }
        return false;
    }

    private clearLossRoomMemory() {
        if (Game.time % 1000 != 0) {
            return;
        }
        let memoryRooms = Object.keys(Memory.roomData);
        for (let roomName of memoryRooms) {
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
        if (Game.time % 50 != 0) {
            return;
        }
        // terminal至少要有20k energy
        roomControllerList.forEach(controller => {
            let terminal = controller.getRoomFacility().getTerminal();
            if (!terminal) {
                return;
            }
            let amount = 20000 - terminal.store.getUsedCapacity(RESOURCE_ENERGY);
            if (amount <= 0) {
                return;
            }
            controller.getRoomFacility().submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: RESOURCE_ENERGY,
                objId: terminal.id,
                amount: amount,
                objType: "terminal"
            })
        })

        //处理传输配置
        let controllerMap = {};
        roomControllerList.forEach(roomController => {
            controllerMap[roomController.getRoomName()] = roomController;
        });

        let sendMaxBatch = 10000;
        DISPATCH_CONFIG_LIST.forEach(item => {
            // 是否需要传输
            let targetController = controllerMap[item.targetRoomName];
            if (!targetController) {
                return;
            }
            let terminal = targetController.getRoomFacility().getTerminal();
            let storage = targetController.getRoomFacility().getStorage();
            if (!terminal || !storage) {
                return;
            }

            // 转移多余资源
            let limitAmount = item.targetTerminalAmount;
            if (item.resourceType == RESOURCE_ENERGY) {
                limitAmount = Math.min(20000, item.targetTerminalAmount) + 10000;
            }
            let terminalAmount = terminal.store.getUsedCapacity(item.resourceType);
            let outAmount = terminalAmount - limitAmount;
            if (outAmount > 0 && storage.store.getFreeCapacity() > 100000) {
                targetController.getRoomFacility().submitEvent({
                    type: "needCarry",
                    subType: "output",
                    resourceType: item.resourceType,
                    objId: terminal.id,
                    amount: outAmount,
                    objType: "terminal"
                })
                return;
            }

            // 空间不足
            if (terminal.store.getFreeCapacity() <= 100000
                || storage.store.getFreeCapacity() <= 100000) {
                return;
            }
            // 总量完成
            let amount = terminalAmount + storage.store.getUsedCapacity(item.resourceType);
            if (amount >= item.targetAmount) {
                return;
            }


            // 开始传输
            for (let roomName of availableRoomName) {
                if (roomName == item.targetRoomName) {
                    continue;
                }
                let sourceController = controllerMap[roomName];
                if (!sourceController) {
                    continue;
                }
                let sourceTerminal = sourceController.getRoomFacility().getTerminal();
                let sourceStorage = sourceController.getRoomFacility().getStorage();
                if (!sourceTerminal || !sourceStorage) {
                    continue;
                }
                let sourceTerminalAmount = terminal.store.getUsedCapacity(item.resourceType);
                let sourceAmount = sourceTerminalAmount + sourceStorage.store.getUsedCapacity(item.resourceType);
                if (sourceAmount <= item.sourceKeepAmount) {
                    continue;
                }
                // terminal有资源，直接send
                let sendAmount = Math.min(amount, sendMaxBatch);
                let cost = Game.market.calcTransactionCost(sendAmount, roomName, item.targetRoomName);
                if (sourceTerminalAmount > sendAmount + cost) {
                    sourceTerminal.send(item.resourceType, sendAmount, item.targetRoomName);
                    console.log(`send ${sendAmount} ${item.resourceType} from ${roomName} to ${item.targetRoomName}`);
                    continue;
                }
                // terminal没有资源，添加任务
                sourceController.getRoomFacility().submitEvent({
                    type: "needCarry",
                    subType: "input",
                    resourceType: item.resourceType,
                    objId: sourceTerminal.id,
                    amount: sendAmount + cost,
                    objType: "terminal"
                })
            }
        });
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