import {BaseModule} from "./baseModule";
import {config, RoomName} from "./config";
import {Spawn} from "./spawn";
import * as _ from "lodash";

type CarryTaskType = "output" | "input" | "pickup";
type ObjectWithPos = Structure | Creep | Ruin | Resource | Tombstone;

/**
 * 存储结构
 */
export type CarryMemory = {
    [roomName in RoomName]?: {
        creepNameList: string[];
        //任务列表
        taskMap: {
            [taskId: string]: CarryTask;
        }
    }
}

type CarryTask = {
    objId: string;
    roomName: RoomName;
    carryType: CarryTaskType;
    resourceType: ResourceConstant;
    amount: number;
    reserved: number;

}

/**
 * creep存储携带信息
 */
export type CarryCreepMemory = {
    //任务列表，第一个为当前执行任务
    taskRecordList: {
        taskId: string;
        reserved: number;
    }[];
    available: {
        [type in ResourceConstant]?: number
    };
    // capacity:number;
    roomName: RoomName;

    hasBusyTask: boolean;
}

export class Carry extends BaseModule {

    protected readonly roomName: RoomName;
    protected creepNameList: string[];

    public static entities:{
        [roomName in RoomName]?:Carry
    }={};

    private readonly taskMap: {
        [taskId: string]: CarryTask;
    };

    public constructor(roomName: RoomName) {
        super(roomName);
        if (!Memory.carry) {
            Memory.carry = {};
        }
        if (!Memory.carry[this.roomName]) {
            Memory.carry[this.roomName] = {
                creepNameList: [],
                taskMap: {}
            }
        }
        let roomMemory = Memory.carry[this.roomName];
        this.creepNameList = roomMemory.creepNameList;
        this.taskMap = roomMemory.taskMap;
        Carry.entities[roomName]=this;
    }

    protected spawnCreeps(): void {
        let creepPlan = config.carry.creepPlan;
        let plan = creepPlan[this.roomName];
        if (this.creepNameList.length >= plan.amount) {
            return;
        }
        let bodyList: BodyPartConstant[] = [];
        for (let i = 0; i < plan.unitNumber; i++) {
            bodyList = bodyList.concat([CARRY, CARRY, MOVE])
        }
        let creepName = "carry-" + Game.time;
        Spawn.reserveCreep({
            bakTick: 0,
            body: bodyList,
            memory: {
                module: "carry",
                carry: {
                    taskRecordList: [],
                    available: {},
                    roomName: this.roomName,
                    hasBusyTask: false
                }
            },
            name: creepName,
            priority: 0,
            spawnNames: ["Spawn-W23S23-01"]
        })

        this.creepNameList.push(creepName);
    }

    public run(): void {
        for (let creepName of this.creepNameList) {
            if (!Game.creeps[creepName]) {
                this.recoveryCreep(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            if (!creep) {
                console.log("undefined carry creep:{}", creepName);
                this.recoveryCreep(creepName);
                continue;
            }
            let creepMemory = creep.memory.carry;

            if (!creepMemory.hasBusyTask) {
                this.arrange(creep);
            }
            if (creepMemory.taskRecordList.length == 0) {
                continue;
            }

            let curTaskRecord = creepMemory.taskRecordList[0];
            let curTask = this.taskMap[curTaskRecord.taskId];
            if (!curTask) {
                this.finishTask(creepName, 0, 0);
                continue;
            }
            let target = Game.getObjectById<ObjectWithPos>(curTask.objId);
            if(!target){
                this.finishTask(creepName,0,0);
                continue;
            }
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });
            if (curTask.carryType == "output") {
                let res = creep.withdraw(<Structure | Ruin | Tombstone>target, curTask.resourceType, curTaskRecord.reserved);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved)
                }
                continue;
            }
            if (curTask.carryType == "input") {
                let maxTranAmount=Math.min(creep.store.getUsedCapacity(curTask.resourceType),
                    20)
                let res = creep.transfer(<AnyCreep | Structure>target, curTask.resourceType);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved)
                }
                continue;
            }
            if (curTask.carryType == "pickup") {
                let res = creep.pickup(<Resource>target);
                if (res != ERR_NOT_IN_RANGE) {
                    this.finishTask(creepName, 0, curTaskRecord.reserved)
                }
                continue;
            }
        }
        this.spawnCreeps()
        for(let taskId in this.taskMap){
            let task=this.taskMap[taskId];
            if(!Game.getObjectById(task.objId)){
                delete this.taskMap[taskId];
            }
        }
    }

    protected arrange(creep: Creep): void {
        for (let taskId in this.taskMap) {
            let task = this.taskMap[taskId];
            if(task.reserved>=task.amount){
                continue;
            }
            let creepMemory = creep.memory.carry;
            if (creepMemory.roomName != task.roomName) {
                continue;
            }
            if (creepMemory.hasBusyTask) {
                continue;
            }
            if (task.carryType == "pickup" || task.carryType == "output") {
                if (creep.store.getUsedCapacity() != 0) {
                    continue;
                }
            }
            this.takeTask(creep, taskId, creep.store.getCapacity());
        }
    }

    protected recoveryCreep(creepName: string): void {
        if (Memory.creeps[creepName]) {
            let carryCreepMemory = Memory.creeps[creepName].carry;
            for (let i = 0, len = carryCreepMemory.taskRecordList.length; i < len; i++) {
                this.finishTask(creepName, i, 0);
            }
            delete Memory.creeps[creepName];
        }

        _.remove(this.creepNameList, function (e) {
            return e == creepName;
        })
    }

    public addCarryReq(obj: ObjectWithPos,
                       carryType: CarryTaskType,
                       resourceType: ResourceConstant,
                       amount: number): void {
        if (!obj || !carryType || !resourceType || amount <= 0) {
            return;
        }
        console.log("add carryReq"+carryType);
        let roomName = <RoomName>obj.pos.roomName;
        let taskId = obj.id + "#" + carryType + "#" + resourceType;
        if (!this.taskMap[taskId]) {
            this.taskMap[taskId] = {
                objId: obj.id,
                roomName: roomName,
                amount: amount,
                reserved: 0,
                resourceType: resourceType,
                carryType: carryType
            }
        }
    }

    protected isBusyTask(taskId: string): boolean {
        let task = this.taskMap[taskId];
        let fac = Memory.facility[task.roomName];
        return task.objId != fac.storageId;
    }

    protected takeTask(creep: Creep, taskId: string, amount: number): void {
        let task = this.taskMap[taskId];
        creep.memory.carry.taskRecordList.push({
            taskId: taskId,
            reserved: amount
        });
        if (!creep.memory.carry.available[task.resourceType]) {
            creep.memory.carry.available[task.resourceType] = 0;
        }
        switch (task.carryType) {
            case "output":
            case "pickup":
                creep.memory.carry.available[task.resourceType] += amount;
                break;
            case "input":
                creep.memory.carry.available[task.resourceType] -= amount;
                break;
        }
        task.reserved += amount;
        creep.say(task.carryType + "!");
        if (this.isBusyTask(taskId)) {
            creep.memory.carry.hasBusyTask = true;
        }
    }

    protected finishTask(creepName: string, index: number, finishAmount: number): void {
        let carryCreepMemory = Memory.creeps[creepName].carry;
        let taskId = carryCreepMemory.taskRecordList[index].taskId;
        let task = this.taskMap[taskId];
        if(task){
            let reserved = carryCreepMemory.taskRecordList[index].reserved;
            task.reserved -= reserved;

            switch (task.carryType) {
                case "output":
                case "pickup":
                    carryCreepMemory.available[task.resourceType] -= reserved;
                    break;
                case "input":
                    carryCreepMemory.available[task.resourceType] += reserved;
                    break;
            }
        }

        carryCreepMemory.taskRecordList.splice(index, 1);
        carryCreepMemory.hasBusyTask = false;
        for (let value of carryCreepMemory.taskRecordList) {
            if (this.isBusyTask(value.taskId)) {
                carryCreepMemory.hasBusyTask = true;
                break;
            }
        }

        if (finishAmount) {
            task.amount -= finishAmount;
            if (task.amount <= 0) {
                delete this.taskMap[taskId];
            }
        }
    }
}
