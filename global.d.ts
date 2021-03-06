//import dispatch from "./dispatch";

// import { Memory, CreepMemory } from "./node_modules/@types/screeps/index.d.ts"
import {RoomName} from "./config";
import {CarryCreepMemory, CarryMemory} from "./carry";
import {FacilityMemory} from "./facility";
import {HarvestMemory} from "./harvest";
import {UpgradeMemory} from "./upgrade";

export {}


declare global {

    // type CarryTaskType = "output" | "input" | "pickup";
    // enum RoomName{
    //     W3N15="W3N15",
    //     W3N19="W3N19",
    //     W2N15="W2N15",
    //     W2N16="W2N16",
    //     W7N16="W7N16"
    // }
    // type RoomName = "W3N15" | "W3N19"
    //     | "W2N15" | "W2N16" | "W7N16";

    interface Memory {
        //基础设施
        facility: FacilityMemory;
        //运输模块存储
        carry: CarryMemory;
        //采集模块
        harvest: HarvestMemory;
        //升级模块
        upgrade: UpgradeMemory;
    }

    //繁殖接口
    interface SpawnTemplate {
        name: string;
        body: BodyPartConstant[];
        memory: CreepMemory;
        spawnNames: string[];
        priority: number;
        bakTick: number;
    }

    //creep内存分配
    interface CreepMemory {
        module: string;

        //运输creep
        carry?: CarryCreepMemory;
        //开采creep
        harvest?: {
            targetId: string;
            workPos?: RoomPosition;//属性缺失表示就位
        }
        //建造creep
        build?: {
            targetId: string;
            energyReq: number;
            energyRes: number;
        }
    }

    type LabConfig = {
        [roomName in RoomName]?: {
            [index: number]: {
                resourcesType: ResourceConstant;
                input?: boolean;
                output?: boolean;
                energy?: boolean;
                runIndexs?: number[];
            }
        }
    }

    type ReactConstant = {
        [products in ResourceConstant]?: ResourceConstant[];
    }

    type ReactConfig = {
        [roomName in RoomName]?: {
            spupply: ResourceConstant[];
        }
    }

    type SupplyConfig = {
        [roomName in RoomName]?: {
            supply: {
                [supply in ResourceConstant]?: number;
            },
            demand: {
                [supply in ResourceConstant]?: number;
            }
        }
    }


    type SimpleCreepPlan = {
        [roomName in RoomName]?: {
            body: BodyPartConstant[];
            amount: number;
        }
    }


}
