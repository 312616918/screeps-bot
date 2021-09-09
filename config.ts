/**
 * 全局配置
 */

type config = {
    carry: {
        creepPlan: {
            [roomName in RoomName]?: {
                amount: number;
                unitNumber: number;
            };
        }
    },
    harvest: {
        // creepPlan: {
        //     [targetId: string]: {
        //         parts:BodyPartConstant[];
        //         workPosition?:RoomPosition;
        //     };
        // }
    }
}

export enum RoomName {
    W23S23 = "W23S23"
    // W3N15="W3N15",
    // W3N19="W3N19",
    // W2N15="W2N15",
    // W2N16="W2N16",
    // W2N18="W2N18",
    // W7N16="W7N16"
}

export const config: config = {
    carry: {
        creepPlan: {
            W23S23: {
                amount: 12,
                unitNumber: 1
            }
        }
    },
    harvest:{

    }
}
