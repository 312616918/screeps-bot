import {availableRoomName, DISPATCH_CONFIG_LIST, RoomName} from "./Config";
import {RoomController} from "./RoomController";
import {ExpandController} from "./ExpandController";
import {Metric} from "./Metric";
import {Observer} from "./Observer";
import _ = require("lodash");


export class CenterController {
    public run() {
        let roomControllerList = this.getRoomControllerList();
        Observer.initEachTick();
        for (let i = 0; i < roomControllerList.length; i++) {
            let roomController = roomControllerList[i];
            try {
                let bucket = Game.cpu.bucket;
                if (bucket < 5000 && i > 2 && !this.mustKeepRunning(roomController)) {
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
        if (Game.time % 10 != 0) {
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
            let targetTerminal = targetController.getRoomFacility().getTerminal();
            let targetStorage = targetController.getRoomFacility().getStorage();
            if (!targetTerminal || !targetStorage) {
                return;
            }
            console.log(`dispatch1 ${item.resourceType} to ${item.targetRoomName}`);
            // 转移多余资源
            let limitAmount = item.targetTerminalAmount;
            if (item.resourceType == RESOURCE_ENERGY) {
                limitAmount = Math.min(20000, item.targetTerminalAmount) + 10000;
            }
            let targetTerminalAmount = targetTerminal.store.getUsedCapacity(item.resourceType);
            let outAmount = targetTerminalAmount - limitAmount;
            let storageLimit = 100_100;
            if (item.resourceType == RESOURCE_ENERGY
                && item.targetRoomName == RoomName.E9N9) {
                storageLimit = 100;
            }
            if (item.resourceType == RESOURCE_POWER
                && item.targetRoomName == RoomName.E9N6) {
                storageLimit = 100;
            }
            if (outAmount > 0 && targetStorage.store.getFreeCapacity() > storageLimit) {
                targetController.getRoomFacility().submitEvent({
                    type: "needCarry",
                    subType: "output",
                    resourceType: item.resourceType,
                    objId: targetTerminal.id,
                    amount: outAmount,
                    objType: "terminal"
                })
                return;
            }
            console.log(`dispatch2 ${item.resourceType} to ${item.targetRoomName}`);
            //临时，目标power已满
            let isPowerFull = item.resourceType == RESOURCE_ENERGY
                && item.targetRoomName == RoomName.E9N9
                && targetController.getRoomFacility().getStorage()
                && targetController.getRoomFacility().getStorage().store.getFreeCapacity() < 100000
                && targetController.getRoomFacility().getStorage().store.getUsedCapacity(RESOURCE_POWER) > 400_000;

            // 空间不足
            if (!isPowerFull) {
                if (targetTerminal.store.getFreeCapacity() <= 100000
                    || (item.targetRoomName != RoomName.E9N6 && targetStorage.store.getFreeCapacity() <= 100000)) {
                    return;
                }
            } else {
                if (targetTerminal.store.getFreeCapacity() <= 10_000) {
                    return;
                }
            }
            console.log(`dispatch3 ${item.resourceType} to ${item.targetRoomName}`);
            // 总量完成
            let amount = targetTerminalAmount + targetStorage.store.getUsedCapacity(item.resourceType);
            if (amount >= item.targetAmount) {
                return;
            }

            console.log(`dispatch4 ${item.resourceType} to ${item.targetRoomName}`);
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
                let sourceTerminalAmount = sourceTerminal.store.getUsedCapacity(item.resourceType);
                let sourceAmount = sourceTerminalAmount + sourceStorage.store.getUsedCapacity(item.resourceType);
                if (sourceAmount <= item.sourceKeepAmount) {
                    continue;
                }
                // terminal有资源，直接send
                let sendAmount = Math.min(sourceTerminalAmount, sendMaxBatch);
                let cost = Game.market.calcTransactionCost(sendAmount, roomName, item.targetRoomName);
                console.log(`${sourceTerminalAmount} ${sendAmount} ${cost}`);
                if (sourceTerminalAmount > sendAmount + cost) {
                    sourceTerminal.send(item.resourceType, sendAmount, item.targetRoomName);
                    console.log(`send ${sendAmount} ${item.resourceType} from ${roomName} to ${item.targetRoomName}`);
                    continue;
                }
                console.log(`dispatch5 ${item.resourceType} to ${item.targetRoomName}`);
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