// import {BaseModule} from "./baseModule";
// import {RoomName} from "./config";
// import {Spawn} from "./spawn";
// import * as _ from "lodash";
//
//
// export type ExpandMemory = {
//     [roomName in RoomName]?: {
//         creepNameList: string[];
//     }
// }
//
//
// export type ExpandCreepMemory = {
//     roomName: RoomName;
//     workPosition?: RoomPosition;
//     tasks:string[];
// }
//
// // let creepConfig:{
// //     [roomName : string]: {
// //         bodyParts:BodyPartConstant[];
// //         workPosition:RoomPosition;
// //     }
// // } ={
// //
// // }
//
//
// export class Expand extends BaseModule {
//
//     protected readonly roomName: RoomName;
//     protected creepNameList: string[];
//
//     constructor(roomName: RoomName) {
//         super(roomName);
//         if (!Memory.expand) {
//             Memory.expand = {};
//         }
//         if (!Memory.expand[this.roomName]) {
//             Memory.expand[this.roomName] = {
//                 creepNameList: []
//             }
//         }
//         let roomMemory = Memory.expand[this.roomName];
//         this.creepNameList = roomMemory.creepNameList;
//     }
//
//     protected spawnCreeps() {
//         let sourceConfig = Memory.facility[this.roomName].sources;
//         let sourceCreepTicks: {
//             [sourceId: string]: number
//         } = {};
//         for (let creepName of this.creepNameList) {
//             let creep = Game.creeps[creepName];
//             if (!creep) {
//                 continue;
//             }
//             let targetId = creep.memory.expand.targetId;
//             let beforeTicks = sourceCreepTicks[targetId];
//             let remainTicks = creep.ticksToLive;
//             if (beforeTicks == undefined || beforeTicks < remainTicks) {
//                 sourceCreepTicks[targetId] = remainTicks;
//             }
//         }
//         for (let sourceId in sourceConfig) {
//             let config = sourceConfig[sourceId];
//             let remainTicks = sourceCreepTicks[sourceId];
//             if (remainTicks != undefined && remainTicks > 20) {
//                 continue;
//             }
//             let creepName = "expand-" + Game.time;
//             Spawn.reserveCreep({
//                 bakTick: 0,
//                 body: [WORK, WORK, WORK, WORK, WORK,
//                     CARRY,
//                     MOVE, MOVE],
//                 memory: {
//                     module: "expand",
//                     expand: {
//                         roomName: this.roomName,
//                         targetId: sourceId,
//                         towerIds: config.towerIds,
//                         workPosition: config.expandPos
//                     }
//                 },
//                 name: creepName,
//                 priority: 0,
//                 spawnNames: ["Spawn1"]
//             })
//             this.creepNameList.push(creepName);
//         }
//     }
//
//     protected recoveryCreep(creepName: string) {
//         delete Memory.creeps[creepName];
//         _.remove(this.creepNameList, function (e) {
//             return e == creepName;
//         })
//     }
//
//     run() {
//
//         for (let creepName of this.creepNameList) {
//             if (!Game.creeps[creepName]) {
//                 this.recoveryCreep(creepName);
//                 continue;
//             }
//             let creep = Game.creeps[creepName];
//             var target = Game.getObjectById<Source>(creep.memory.expand.targetId);
//             if (!target) {
//                 return;
//             }
//             let pos = creep.memory.expand.workPosition;
//             if (pos) {
//                 // let workPos = pos;
//                 let workPos = new RoomPosition(pos.x, pos.y, pos.roomName);
//                 if (creep.pos.getRangeTo(workPos)) {
//                     creep.moveTo(workPos, {
//                         visualizePathStyle: {
//                             stroke: '#ffffff'
//                         }
//                     });
//                     return;
//                 }
//                 delete creep.memory.expand["workPos"];
//             }
//             creep.expand(target);
//
//             let roomFac = Memory.facility[this.roomName];
//             if (roomFac) {
//                 let sourceConfig = roomFac.sources[creep.memory.expand.targetId];
//                 let link = Game.getObjectById<StructureLink>(sourceConfig.linkId);
//                 if (link
//                     && link.store.getFreeCapacity("energy") > 0
//                     && creep.store.getFreeCapacity("energy") == 0) {
//                     creep.transfer(link, "energy");
//                 }
//             }
//
//             //transfer tower 高优先级
//             let towerIds = creep.memory.expand.towerIds;
//             if (towerIds) {
//                 for (let id of towerIds) {
//                     let tower = Game.getObjectById<StructureTower>(id);
//                     if (tower.store.getFreeCapacity("energy") >= 50) {
//                         creep.transfer(tower, "energy");
//                     }
//                 }
//             }
//
//
//         }
//
//         this.spawnCreeps()
//     }
// }