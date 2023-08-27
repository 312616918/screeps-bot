export enum RoomName {
    W2N18 = "W2N18",
    W3N18 = "W3N18",
    W2N19 = "W2N19",
    W1N19 = "W1N19",
    W4N21 = "W4N21",
    W2N22 = "W2N22",
}

export const directionBiasMap = {
    [TOP]: {
        x: 0,
        y: -1
    },
    [TOP_RIGHT]: {
        x: 1,
        y: -1
    },
    [RIGHT]: {
        x: 1,
        y: 0
    },
    [BOTTOM_RIGHT]: {
        x: 1,
        y: 1
    },
    [BOTTOM]: {
        x: 0,
        y: 1
    },
    [BOTTOM_LEFT]: {
        x: -1,
        y: 1
    },
    [LEFT]: {
        x: -1,
        y: 0
    },
    [TOP_LEFT]: {
        x: -1,
        y: -1
    }
}


type RoomConfig = {
    carry: {
        partNum: number;
        carryNum: number;
    },
    harvest: {
        workPosList: InnerPosition[];
    },
    upgrade: {
        partNum: number;
        carryNum?: number;
        moveNum?: number;
        workPosList: InnerPosition[];
    }
}

type InnerPosition = {
    x: number;
    y: number;
}

export const roomConfigMap: {
    [roomName in RoomName]: RoomConfig;
} = {
    [RoomName.W2N18]: {
        carry: {
            partNum: 2,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 16,
                y: 14,
            }, {
                x: 19,
                y: 17,
            }]
        },
        upgrade: {
            partNum: 16,
            carryNum: 6,
            moveNum: 4,
            workPosList: [{
                x: 14,
                y: 12,
            }, {
                x: 13,
                y: 12,
            }, {
                x: 11,
                y: 12,
            }]
        }
    },
    [RoomName.W3N18]: {
        carry: {
            partNum: 2,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 13,
                y: 43,
            }]
        },
        upgrade: {
            partNum: 8,
            workPosList: [{
                x: 33,
                y: 27,
            }]
        }
    },
    [RoomName.W2N19]: {
        carry: {
            partNum: 1,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 31,
                y: 27,
            }]
        },
        upgrade: {
            partNum: 2,
            workPosList: [{
                x: 8,
                y: 42,
            }, {
                x: 6,
                y: 42,
            }, {
                x: 7,
                y: 42,
            }]
        }
    },
    [RoomName.W1N19]: {
        carry: {
            partNum: 1,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 38,
                y: 6,
            }]
        },
        upgrade: {
            partNum: 2,
            workPosList: [{
                x: 38,
                y: 24
            }, {
                x: 36,
                y: 24
            }, {
                x: 37,
                y: 24
            }]
        }
    },
    [RoomName.W4N21]: {
        carry: {
            partNum: 1,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 37,
                y: 35,
            }, {
                x: 4,
                y: 28,
            }]
        },
        upgrade: {
            partNum: 2,
            workPosList: [{
                x: 9,
                y: 12,
            }, {
                x: 7,
                y: 13,
            }, {
                x: 8,
                y: 13,
            }]
        }
    },
    [RoomName.W2N22]: {
        carry: {
            partNum: 1,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 27,
                y: 34,
            }, {
                x: 5,
                y: 35,
            }]
        },
        upgrade: {
            partNum: 8,
            workPosList: [{
                x: 10,
                y: 21,
            }]
        }
    }
}


export type TerminalConfig = {
    maxStorageEnergy: number;
    type: "input" | "output";
}
export const terminalConfigMap: {
    [roomName in RoomName]: TerminalConfig;
}={
    [RoomName.W2N18]:{
        maxStorageEnergy: -1,
        type: "input"
    },
    [RoomName.W3N18]:{
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W2N19]:{
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W1N19]:{
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W4N21]:{
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W2N22]:{
        maxStorageEnergy: 200000,
        type: "output"
    }
}