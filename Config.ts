export enum RoomName {
    W2N18 = "W2N18",
    W3N18 = "W3N18",
    W2N19 = "W2N19",
    W1N19 = "W1N19",
    W4N21 = "W4N21",
    W2N22 = "W2N22",
    W3N16 = "W3N16",
    W7N16 = "W7N16",
    W7N15 = "W7N15",
    W7N14 = "W7N14",
    W9N12 = "W9N12",
    W9N13 = "W9N13",
    W8N13 = "W8N13",
    W9N15 = "W9N15",
    W9N17 = "W9N17",
    W8N21 = "W8N21",
    W2N23 = "W2N23",
    W4N23 = "W4N23",
    W6N21 = "W6N21",
    W1N15 = "W1N15",
    W11N18 = "W11N18",
}

export const availableRoomName: RoomName[] = [
    RoomName.W2N18,
    RoomName.W3N18,
    RoomName.W2N19,
    RoomName.W1N19,
    RoomName.W2N22,
    RoomName.W2N23,
    RoomName.W4N23,
    RoomName.W6N21,
    RoomName.W1N15,
    RoomName.W8N21,
    RoomName.W9N17,
    RoomName.W11N18,
]

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
        workNum: number;
        carryNum?: number;
        moveNum?: number;
        autoNum?: number;
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
            carryNum: 2,
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
            workNum: 16,
            carryNum: 4,
            moveNum: 4,
            autoNum: -1,
            workPosList: [{
                x: 14,
                y: 12,
            }]
        }
    },
    [RoomName.W3N18]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 13,
                y: 43,
            }]
        },
        upgrade: {
            workNum: 3,
            carryNum: 2,
            moveNum: 2,
            autoNum: 3,
            workPosList: [{
                x: 33,
                y: 27,
            }]
        }
    },
    [RoomName.W2N19]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 31,
                y: 27,
            }]
        },
        upgrade: {
            workNum: 2,
            workPosList: [{
                x: 8,
                y: 42,
            }]
        }
    },
    [RoomName.W1N19]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 38,
                y: 6,
            }]
        },
        upgrade: {
            workNum: 2,
            workPosList: [{
                x: 37,
                y: 24
            }]
        }
    },
    [RoomName.W4N21]: {
        carry: {
            partNum: 2,
            carryNum: 2,
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
            workNum: 2,
            workPosList: [{
                x: 9,
                y: 12,
            }]
        }
    },
    [RoomName.W2N22]: {
        carry: {
            partNum: 2,
            carryNum: 2,
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
            workNum: 2,
            workPosList: [{
                x: 10,
                y: 21,
            }]
        }
    },
    [RoomName.W3N16]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 24,
                y: 8,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 40,
                y: 40,
            }]
        }
    },

    [RoomName.W7N16]: {
        carry: {
            partNum: 2,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 45,
                y: 11,
            }, {
                x: 31,
                y: 2,
            }]
        },
        upgrade: {
            workNum: 3,
            workPosList: [{
                x: 40,
                y: 26,
            }]
        }
    },
    [RoomName.W7N15]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 24,
                y: 32,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 17,
                y: 36,
            }]
        }
    },
    [RoomName.W7N14]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 44,
                y: 31,
            }, {
                x: 38,
                y: 19,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 42,
                y: 36,
            }]
        }
    },

    [RoomName.W9N12]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 41,
                y: 23,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 32,
                y: 39,
            }]
        }
    },
    [RoomName.W9N13]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 14,
                y: 6,
            }, {
                x: 28,
                y: 8,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 17,
                y: 6,
            }]
        }
    },
    [RoomName.W8N13]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 14,
                y: 7,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 15,
                y: 16,
            }]
        }
    },
    [RoomName.W9N15]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 9,
                y: 35,
            }, {
                x: 24,
                y: 20,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 9,
                y: 36,
            }]
        }
    },
    [RoomName.W9N17]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 13,
                y: 39,
            }, {
                x: 11,
                y: 29,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 10,
                y: 37,
            }]
        }
    },
    [RoomName.W8N21]: {
        carry: {
            partNum: 8,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 20,
                y: 15,
            }, {
                x: 40,
                y: 20
            }]
        },
        upgrade: {
            workNum: 4,
            carryNum: 2,
            moveNum: 1,
            autoNum: 4,
            workPosList: [{
                x: 30,
                y: 13,
            }]
        }
    },
    [RoomName.W2N23]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 20,
                y: 9,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 41,
                y: 17,
            }]
        }
    },
    [RoomName.W4N23]: {
        carry: {
            partNum: 4,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 10,
                y: 14,
            }, {
                x: 36,
                y: 43,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 13,
                y: 32,
            }]
        }
    },
    [RoomName.W6N21]: {
        carry: {
            partNum: 4,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 21,
                y: 23,
            }, {
                x: 43,
                y: 13,
            }]
        },
        upgrade: {
            workNum: 3,
            carryNum: 2,
            moveNum: 1,
            autoNum: 4,
            workPosList: [{
                x: 22,
                y: 20,
            }]
        }
    },
    [RoomName.W1N15]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 23,
                y: 37,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 21,
                y: 8,
            }]
        }
    },
    [RoomName.W11N18]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 20,
                y: 35,
            }, {
                x: 6,
                y: 20,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 13,
                y: 36,
            }]
        }
    }
}


export type TerminalConfig = {
    maxStorageEnergy: number;
    type: "input" | "output";
}
export const terminalConfigMap: {
    [roomName in RoomName]?: TerminalConfig;
} = {
    [RoomName.W2N18]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W3N18]: {
        maxStorageEnergy: 200000,
        type: "input"
    },
    [RoomName.W2N19]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W1N19]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W4N21]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W2N22]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W3N16]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W7N16]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W7N15]: {
        maxStorageEnergy: 200000,
        type: "output"
    },
    [RoomName.W7N14]: {
        maxStorageEnergy: 200000,
        type: "output"
    }
}


export type DevConfig = {
    minLevel: number;
    minEnergy: number;
    upgrade: {
        workNum: number;
        carryNum: number;
        moveNum: number;
        autoNum: number;
    },
    carry: {
        carryNum: number;
        moveNum: number;
        autoNum: number;
    },
    build: {
        workNum: number;
        carryNum: number;
        moveNum: number;
    }
}

export const DevLevelConfig: DevConfig [] = [
    {
        // 0-300
        minLevel: 1,
        minEnergy: 0,
        upgrade: {
            workNum: 2,
            carryNum: 1,
            moveNum: 1,
            autoNum: 0,
        },
        carry: {
            carryNum: 2,
            moveNum: 2,
            autoNum: 2,
        },
        build: {
            workNum: 1,
            carryNum: 2,
            moveNum: 1,
        }
    },
    // 300-550
    {
        minLevel: 2,
        minEnergy: 550,
        upgrade: {
            workNum: 4,
            carryNum: 2,
            moveNum: 1,
            autoNum: 4,
        },
        carry: {
            carryNum: 4,
            moveNum: 2,
            autoNum: 4,
        },
        build: {
            workNum: 2,
            carryNum: 4,
            moveNum: 2,
        }
    },
    // 550-800
    {
        minLevel: 3,
        minEnergy: 800,
        upgrade: {
            workNum: 4,
            carryNum: 2,
            moveNum: 1,
            autoNum: 4,
        },
        carry: {
            carryNum: 4,
            moveNum: 2,
            autoNum: 4,
        },
        build: {
            workNum: 2,
            carryNum: 8,
            moveNum: 2,
        }
    }
]