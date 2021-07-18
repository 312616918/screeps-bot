//import dispatch from "./dispatch";

// import { Memory, CreepMemory } from "./node_modules/@types/screeps/index.d.ts"
export {}

interface WorkPos {
    x: number,
    y: number,
    roomName: string
}


declare global {

    type reqType = "output" | "input" | "pickup";
    type RoomName = "W3N15" | "W3N19"
        | "W2N15" | "W2N16" | "W2N18"
        | "W7N16";

    interface Memory {
        facility: {
            [roomName: string]: {
                sources: {
                    [sourceId: string]: {
                        harvestPos: WorkPos,
                        containerId?: string,
                        towerIds?: string[],
                        linkId?: string,
                        controllerId?: string
                    }
                },
                mineral?: {
                    id: string,
                    resourceType: MineralConstant,
                    harvestPos: WorkPos,
                    containerId?: string
                }
                upgrade?: {
                    workPos: WorkPos,
                    containerId?: string,
                    linkId?: string,
                    towerIds?: string[]
                },
                dispatch?: {
                    workPos: WorkPos
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
        carryReqs: {
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
        dispatchReqs: {
            [roomName: string]: {
                [reqId: string]: RoomDispatchReq
            }
        }
        centerSource: {
            [sourceId: string]: CenterSource
        }
        roomConfig: {
            [roomName in RoomName]?: {
                curReact: ResourceConstant;

            }
        }
    }

    interface RoomDispatchReq {
        id: string;
        type: reqType;
        resourceType: ResourceConstant;
        amount: number;
        priority: number;
    }

    interface SpawnTemplate {
        name: string;
        body: BodyPartConstant[];
        memory: CreepMemory;
        spawnNames: string[];
        priority: number;
    }

    interface CreepMemory {
        targetId?: string;
        sourceId?: string;
        needEnergy?: number;
        workRoom?: string;
        roomName?: string;
        reqId?: string;
        reserve?: number;
        resourceType?: ResourceConstant;
        workPos?: WorkPos;
    }

    interface CenterSource {
        enable: boolean;
        isSafe: boolean;
        isInvaded: boolean;
        safePoint: WorkPos;
        harvestPos: WorkPos;
        targetId: string;
        containerPos?: WorkPos;
    }

    type RoomResAmount = {
        [roomName in RoomName]?: {
            terminal: {
                [rType in ResourceConstant]?: {
                    tMaxAmount: number;
                    tMinAmount: number;

                    sMinAmount?: number;
                }
            },
            /**
             * 房间最低资源量，低于此值，尝试从其他房间调配
             */
            minAmount?: {
                [rType in ResourceConstant]?: number;
            }

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
