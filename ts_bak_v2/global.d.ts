// //import dispatch from "./dispatch";
//
// // import { Memory, CreepMemory } from "./node_modules/@types/screeps/index.d.ts"
// import {RoomName} from "./globalConfig";
// import {CarryCreepMemory} from "./carry";
// import {CarryCreepMemoryV2} from "./carry_v2";
// import {HarvestCreepMemory} from "./harvest";
// import {UpgradeCreepMemory} from "./upgrade";
// import {BuildCreepMemory} from "./build";
// // import {MoveCreepMemory} from "./move";
// import {RoomData} from "./RoomModule";
// import {MoveCreepMemory} from "./move";
// // import {ExpandCreepMemory, ExpandMemory} from "./expand";
//
// export {}
//
//
// declare global {
//
//     // type CarryTaskType = "output" | "input" | "pickup";
//     // enum RoomName{
//     //     W3N15="W3N15",
//     //     W3N19="W3N19",
//     //     W2N15="W2N15",
//     //     W2N16="W2N16",
//     //     W7N16="W7N16"
//     // }
//     // type RoomName = "W3N15" | "W3N19"
//     //     | "W2N15" | "W2N16" | "W7N16";
//
//     interface Memory {
//         // //基础设施
//         // facility: FacilityMemory;
//         // //运输模块存储
//         // carry: CarryMemory;
//         // //采集模块
//         // harvest: HarvestMemory;
//         // //升级模块
//         // upgrade: UpgradeMemory;
//         // //建造模块
//         // build: BuildMemory;
//         // //移动控制模块
//         // move: MoveMemory;
//         // //扩张模块
//         // // expand: ExpandMemory;
//
//         roomData: {
//             [roomName in RoomName]?: RoomData;
//         },
//         status: {
//             bucketTime: number;
//         }
//     }
//
//     //繁殖接口
//     interface SpawnTemplate {
//         name: string;
//         body: BodyPartConstant[];
//         memory: CreepMemory;
//         spawnNames: string[];
//         priority: number;
//         bakTick: number;
//     }
//
//     //creep内存分配
//     interface CreepMemory {
//         module: string;
//
//         //运输creep
//         carry?: CarryCreepMemory;
//         //运输creep
//         carryV2?: CarryCreepMemoryV2;
//         //开采creep
//         harvest?: HarvestCreepMemory;
//         //建造creep
//         build?: BuildCreepMemory;
//         //升级creep
//         upgrade?: UpgradeCreepMemory;
//         //移动属性
//         move?: MoveCreepMemory;
//         //扩张creep
//         // expand?: ExpandCreepMemory;
//     }
//
//     type LabConfig = {
//         [roomName in RoomName]?: {
//             [index: number]: {
//                 resourcesType: ResourceConstant;
//                 input?: boolean;
//                 output?: boolean;
//                 energy?: boolean;
//                 runIndexs?: number[];
//             }
//         }
//     }
//
//     type ReactConstant = {
//         [products in ResourceConstant]?: ResourceConstant[];
//     }
//
//     type ReactConfig = {
//         [roomName in RoomName]?: {
//             spupply: ResourceConstant[];
//         }
//     }
//
//     type SupplyConfig = {
//         [roomName in RoomName]?: {
//             supply: {
//                 [supply in ResourceConstant]?: number;
//             },
//             demand: {
//                 [supply in ResourceConstant]?: number;
//             }
//         }
//     }
//
//
//     type SimpleCreepPlan = {
//         [roomName in RoomName]?: {
//             body: BodyPartConstant[];
//             amount: number;
//         }
//     }
//
//     interface ModuleMemory {
//         roomName: RoomName;
//         workPosition?: RoomPosition;
//     }
//
//
// }