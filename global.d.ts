//import dispatch from "./dispatch";

// import { Memory, CreepMemory } from "./node_modules/@types/screeps/index.d.ts"
export {}


declare global {

    type reqType = "output" | "input" | "pickup";
    type RoomName = "W3N15" | "W3N19"
        | "W2N15" | "W2N16" | "W7N16";

    interface Memory {
        facility: {
            [roomName: string]: {
                sources: {
                    [sourceId: string]: {
                        harvestPos: RoomPosition,
                        containerId?: string,
                        towerIds?: string[],
                        linkId?: string,
                        controllerId?: string
                    }
                },
                mineral?: {
                    id: string,
                    resourceType: MineralConstant,
                    harvestPos: RoomPosition,
                    containerId?: string
                }
                upgrade?: {
                    RoomPosition: RoomPosition,
                    containerId?: string,
                    linkId?: string,
                    towerIds?: string[]
                },
                terminalId?: string,
                storageId?: string,
                centerLinkId?: string,
                towerIds?: string[],
                spawnNames?: string[],
                labIds?: string[],
                lab?: {
                    centerIds: string[];
                    subIds: string[];
                    current?: ResourceConstant;
                }
            }
        }
        carry: {
            task:{
                [roomName: string]: {
                    [reqId: string]: {
                        id: string;
                        type: reqType;
                        resourceType: ResourceConstant;
                        amount: number;
                        reserve: number;
                    }
                }
            }
        }
    }

    interface SpawnTemplate {
        name: string;
        body: BodyPartConstant[];
        memory: CreepMemory;
        spawnNames: string[];
        priority: number;
    }

    interface CreepMemory {
        carry:{
            tasks:{
            
            }[];
        }
        harvest:{
            targetId:string;
            workPos:RoomPosition;//属性缺失表示就位
        }
        bulid:{
            targetId:string;
            energyReq:number;
            energyRes:number;
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
