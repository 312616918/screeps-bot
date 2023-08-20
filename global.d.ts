import {GroupCreepMemory} from "./BaseGroup";
import {RoomMemory} from "./RoomController";
import {CarryCreepMemory} from "./CarryGroup";
import {MoveCreepMemory} from "./move";
import {HarvestCreepMemory} from "./HarvestGroup";
import {UpgradeCreepMemory} from "./UpgradeGroup";
import {RoomName} from "./Config";
import {BuildCreepMemory} from "./BuilderGroup";
import {ExpandGroupCreepMemory} from "./BaseExpandGroup";
import {ExpandMemory} from "./ExpandController";
import {ClaimCreepMemory} from "./ClaimGroup";
import {CarryCreepMemoryV2} from "./CarryGroupV2";

export {}


declare global {
    type CarryTaskType = "output" | "input" | "pickup";
    type ObjectWithPos = Structure | Creep | Ruin | Resource | Tombstone;
    // type CarryTaskType = "output" | "input" | "pickup";
    // enum RoomName{
    //     W2N18="W2N18",
    //     // W3N15="W3N15",
    //     // W3N19="W3N19",
    //     // W2N15="W2N15",
    //     // W2N16="W2N16",
    //     // W7N16="W7N16"
    // }
    // type RoomName = "W3N15" | "W3N19"
    //     | "W2N15" | "W2N16" | "W7N16";

    interface Memory {
        // //基础设施
        // facility: FacilityMemory;
        // //运输模块存储
        // carry: CarryMemory;
        // //采集模块
        // harvest: HarvestMemory;
        // //升级模块
        // upgrade: UpgradeMemory;
        // //建造模块
        // build: BuildMemory;
        // //移动控制模块
        // move: MoveMemory;
        // //扩张模块
        // // expand: ExpandMemory;

        roomData: {
            [roomName in RoomName]?: RoomMemory;
        },
        status: {
            bucketTime: number;
        },
        expand: ExpandMemory;
    }

    //creep内存分配
    interface CreepMemory {
        module: string;
        group?: GroupCreepMemory;
        //运输creep
        carry?: CarryCreepMemory;
        carry_v2?: CarryCreepMemoryV2;
        //开采creep
        harvest?: HarvestCreepMemory;
        //建造creep
        build?: BuildCreepMemory;
        //升级creep
        upgrade?: UpgradeCreepMemory;
        //移动属性
        move?: MoveCreepMemory;
        //扩张creep
        expand?: ExpandGroupCreepMemory;
        //占领
        claim?: ClaimCreepMemory;
    }

    // type LabConfig = {
    //     [roomName in RoomName]?: {
    //         [index: number]: {
    //             resourcesType: ResourceConstant;
    //             input?: boolean;
    //             output?: boolean;
    //             energy?: boolean;
    //             runIndexs?: number[];
    //         }
    //     }
    // }
    //
    // type ReactConstant = {
    //     [products in ResourceConstant]?: ResourceConstant[];
    // }
    //
    // type ReactConfig = {
    //     [roomName in RoomName]?: {
    //         spupply: ResourceConstant[];
    //     }
    // }
    //
    // type SupplyConfig = {
    //     [roomName in RoomName]?: {
    //         supply: {
    //             [supply in ResourceConstant]?: number;
    //         },
    //         demand: {
    //             [supply in ResourceConstant]?: number;
    //         }
    //     }
    // }
    //
    //
    // type SimpleCreepPlan = {
    //     [roomName in RoomName]?: {
    //         body: BodyPartConstant[];
    //         amount: number;
    //     }
    // }


}
