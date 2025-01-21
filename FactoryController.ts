import {RoomName} from "./Config";
import {RoomFacility} from "./RoomFacility";
import {PRODUCT_STEP_DICT} from "./ProductCostConfig";
import {logError} from "./Util";
import {Metric} from "./Metric";


export type FactoryMemory = {
    runningTask: FactoryTaskItem;
}

export class FactoryController {
    private memory: FactoryMemory;
    private roomFacility: RoomFacility;
    private readonly roomName: RoomName;

    constructor(memory: FactoryMemory, roomFacility: RoomFacility) {
        this.memory = memory;
        this.roomFacility = roomFacility;
        this.roomName = roomFacility.roomName;
    }

    public run() {
        let cpuUsed = Game.cpu.getUsed();
        try {
            this.doRun();
        } catch (e) {
            logError(e);
        }
        let cost = Game.cpu.getUsed() - cpuUsed;
        Metric.recordGauge(cost, "type", "group_time_cost", "tag", "factory");
    }

    public doRun() {
        // 100 tick验证一次
        if (Game.time % 100) {
            this.checkRunningIdx();
        }
        if (!this.memory.runningTask) {
            return;
        }
        let factory = this.roomFacility.getFactory();
        if (factory.cooldown) {
            return;
        }
        let task = this.memory.runningTask;
        let amount = this.getResourcesAmount(task.targetResourceType);
        if (amount >= task.targetAmount) {
            this.memory.runningTask = null;
            return;
        }
        let costInfo = PRODUCT_STEP_DICT[task.targetResourceType];
        if (!costInfo) {
            logError(`costInfo error ${task.targetResourceType}`);
            return;
        }

        // 转移输出
        let doneAmount = factory.store.getUsedCapacity(task.targetResourceType);
        if (doneAmount > 1000) {
            this.roomFacility.submitEvent({
                type: "needCarry",
                subType: "output",
                objId: factory.id,
                resourceType: task.targetResourceType,
                amount: 800,
                objType: "factory"
            });
        }

        // 验证输入
        costInfo.sourceList.forEach(source => {
            let amount = factory.store.getUsedCapacity(source.resourceType);
            // 小于最低执行数量
            if (amount < source.amount) {
                this.roomFacility.submitEvent({
                    type: "needCarry",
                    subType: "input",
                    objId: factory.id,
                    resourceType: source.resourceType,
                    amount: 800,
                    objType: "factory"
                });
            }
        })
        // 执行
        factory.produce(<CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM>task.targetResourceType);
    }

    private checkRunningIdx() {
        this.memory.runningTask = null;
        // 有配置
        let taskList = RoomTaskConfig[this.roomName];
        if (!taskList) {
            return;
        }
        // 有工厂
        let factory = this.roomFacility.getFactory();
        if (!factory) {
            return;
        }
        // 有storage
        let storage = this.roomFacility.getStorage();
        if (!storage) {
            return;
        }

        for (let i = 0; i < taskList.length; i++) {
            let task = taskList[i];
            // 验证存量
            let amount = this.getResourcesAmount(task.targetResourceType);
            if (amount >= task.targetAmount) {
                continue;
            }
            this.memory.runningTask = task;
            break;
        }
    }

    private getResourcesAmount(resourcesType: ResourceConstant): number {
        let amount = 0;
        let storage = this.roomFacility.getStorage();
        if (storage) {
            amount += storage.store.getUsedCapacity(resourcesType);
        }
        let factory = this.roomFacility.getFactory();
        if (factory) {
            amount += factory.store.getUsedCapacity(resourcesType);
        }
        let terminal = this.roomFacility.getTerminal();
        if (terminal) {
            amount += terminal.store.getUsedCapacity(resourcesType);
        }
        return amount;
    }

}


type FactoryTaskItem = {
    targetResourceType: ResourceConstant
    targetAmount: number
}

const RoomTaskConfig: {
    [roomName in RoomName]?: FactoryTaskItem[]
} = {
    [RoomName.E9N9]: [
        // o bar
        {
            targetResourceType: RESOURCE_OXIDANT,
            targetAmount: 200_000
        }
    ],
    [RoomName.E9N8]: [
        // u bar
        {
            targetResourceType: RESOURCE_UTRIUM_BAR,
            targetAmount: 200_000
        }
    ],
    [RoomName.E8N9]: [
        // k bar
        {
            targetResourceType: RESOURCE_KEANIUM_BAR,
            targetAmount: 200_000
        }
    ],
    [RoomName.E11N11]: [
        // z bar
        {
            targetResourceType: RESOURCE_ZYNTHIUM_BAR,
            targetAmount: 200_000
        }
    ],
    [RoomName.E9N6]: [
        // k bar
        {
            targetResourceType: RESOURCE_KEANIUM_BAR,
            targetAmount: 200_000
        }
    ],
    [RoomName.E31N9]: [
        // x bar
        {
            targetResourceType: RESOURCE_PURIFIER,
            targetAmount: 200_000
        }
    ],
    [RoomName.E35N7]: [
        // x bar
        {
            targetResourceType: RESOURCE_PURIFIER,
            targetAmount: 200_000
        }
    ]
}