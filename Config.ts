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
    W1N8 = "W1N8",
    W1N1 = "W1N1",
    W8N9 = "W8N9",
    E2N12 = "E2N12",
    E1N13 = "E1N13",
    E4N13 = "E4N13",
    E3N14 = "E3N14",
    E2N11 = "E2N11",
    E3N11 = "E3N11",
    E5N13 = "E5N13",
    E2N14 = "E2N14",
    E5N19 = "E5N19",
    E6N18 = "E6N18",
    E9N9 = "E9N9",
    E11N11 = "E11N11",
    E9N8 = "E9N8",
    E8N9 = "E8N9",
    E5N8 = "E5N8",
    E3N8 = "E3N8",
    E9N6 = "E9N6",
    E15N13 = "E15N13",
    E21N9 = "E21N9",
    E31N9 = "E31N9",
    E34N8= "E34N8",
    E35N7 = "E35N7",
}

export const availableRoomName: RoomName[] = [
    // RoomName.W2N18,
    // RoomName.W3N18,
    // RoomName.W2N19,
    // RoomName.W1N19,
    // RoomName.W2N22,
    // RoomName.W2N23,
    // RoomName.W4N23,
    // RoomName.W6N21,
    // RoomName.W1N15,
    // RoomName.W8N21,
    // RoomName.W9N17,
    // RoomName.W11N18,
    // RoomName.W1N8,
    // RoomName.W1N1,
    // RoomName.W3N16,
    // RoomName.W7N15,
    // RoomName.E2N12,
    // RoomName.E1N13,
    // RoomName.E4N13,
    // RoomName.E3N14,
    // RoomName.E2N11,
    // RoomName.E3N11,
    // RoomName.E5N13,
    // RoomName.E2N14,
    // RoomName.E5N19,
    // RoomName.E6N18,
    RoomName.E9N9,
    RoomName.E11N11,
    RoomName.E9N8,
    RoomName.E8N9,
    RoomName.E5N8,
    RoomName.E3N8,
    RoomName.E9N6,
    RoomName.E15N13,
    RoomName.E21N9,
    RoomName.E31N9,
    RoomName.E34N8,
    RoomName.E35N7,
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

export const REPAIR_CONFIG = {
    targetHit: 20_000_000,
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
            partNum: 8,
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
    },
    [RoomName.W1N8]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 18,
                y: 13,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 13,
                y: 24,
            }]
        }
    },
    [RoomName.W1N1]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 29,
                y: 28,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 40,
                y: 25,
            }]
        }
    },
    [RoomName.W8N9]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 29,
                y: 28,
            },{
                x: 46,
                y: 15,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 23,
                y: 36,
            }]
        }
    },
    [RoomName.E2N12]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 34,
                y: 29,
            },{
                x: 41,
                y: 17,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 36,
                y: 25,
            }]
        }
    },
    [RoomName.E1N13]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 45,
                y: 9,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 18,
                y: 12,
            }]
        }
    },
    [RoomName.E4N13]: {
        carry: {
            partNum: 2,
            carryNum: 8,
        },
        harvest: {
            workPosList: [{
                x: 23,
                y: 43,
            },{
                x: 37,
                y: 43,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 13,
                y: 18,
            }]
        }
    },
    [RoomName.E3N14]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 27,
                y: 27,
            },{
                x: 46,
                y: 30,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 13,
                y: 18,
            }]
        }
    },
    [RoomName.E2N11]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 8,
                y: 37,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 36,
                y: 19,
            }]
        }
    },
    [RoomName.E3N11]: {
        carry: {
            partNum: 4,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 44,
                y: 10,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 20,
                y: 15,
            }]
        }
    },
    [RoomName.E5N13]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 35,
                y: 36,
            },{
                x: 35,
                y: 44,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 38,
                y: 29,
            }]
        }
    },
    [RoomName.E2N14]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 14,
                y: 31,
            },{
                x: 24,
                y: 40,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 28,
                y: 18,
            }]
        }
    },
    [RoomName.E5N19]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 40,
                y: 13,
            },{
                x: 40,
                y: 17,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 22,
                y: 38,
            }]
        }
    },
    [RoomName.E6N18]: {
        carry: {
            partNum: 2,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 7,
                y: 20,
            },{
                x: 4,
                y: 38,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 38,
                y: 17,
            }]
        }
    },
    [RoomName.E9N9]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 26,
                y: 29,
            },{
                x: 46,
                y: 17,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 9,
                y: 11,
            }]
        }
    },
    [RoomName.E11N11]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 29,
                y: 23,
            },{
                x: 44,
                y: 43,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 27,
                y: 24
            }]
        }
    },
    [RoomName.E9N8]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 27,
                y: 32,
            },{
                x: 4,
                y: 37,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 25,
                y: 41
            }]
        }
    },
    [RoomName.E8N9]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 7,
                y: 12,
            },{
                x: 19,
                y: 42,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 38,
                y: 33
            }]
        }
    },
    [RoomName.E5N8]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 42,
                y: 14,
            },{
                x: 19,
                y: 12,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 33,
                y: 28
            }]
        }
    },
    [RoomName.E3N8]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 19,
                y: 41,
            },{
                x: 17,
                y: 43,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 31,
                y: 42
            }]
        }
    },
    [RoomName.E9N6]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 14,
                y: 26,
            },{
                x: 14,
                y: 31,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 39,
                y: 38
            }]
        }
    },
    [RoomName.E15N13]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 16,
                y: 17,
            },{
                x: 14,
                y: 23,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 31,
                y: 11
            }]
        }
    },
    [RoomName.E21N9]: {
        carry: {
            partNum: 2,
            carryNum: 6,
        },
        harvest: {
            workPosList: [{
                x: 34,
                y: 44,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 30,
                y: 16
            }]
        }
    },
    [RoomName.E31N9]: {
        carry: {
            partNum: 1,
            carryNum: 2,
        },
        harvest: {
            workPosList: [{
                x: 39,
                y: 18,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 37,
                y: 21
            }]
        }
    },
    [RoomName.E34N8]: {
        carry: {
            partNum: 1,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 32,
                y: 39,
            },{
                x: 7,
                y: 8,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 30,
                y: 41
            }]
        }
    },
    [RoomName.E35N7]: {
        carry: {
            partNum: 1,
            carryNum: 4,
        },
        harvest: {
            workPosList: [{
                x: 12,
                y: 41,
            },{
                x: 26,
                y: 7,
            }]
        },
        upgrade: {
            workNum: 1,
            workPosList: [{
                x: 17,
                y: 29
            }]
        }
    },
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


type ChaimConfig = {
    spawnRoom: RoomName;
    milestoneList: string[];
}


export const ALL_CHAIM_CONFIG: {
    [roomName in RoomName]?: ChaimConfig
} = {
    // [RoomName.W1N8]: {
    //     spawnRoom: RoomName.W1N15,
    //     milestoneList: ["W0N15", "W0N8"]
    // },
    [RoomName.W1N1]: {
        spawnRoom: RoomName.E2N11,
        milestoneList: ["E2N10", "E0N10"]
    },
    // [RoomName.W3N16]: {//
    //     spawnRoom: RoomName.W1N15,
    //     milestoneList: ["W1N14", "W2N14", "W3N14_42_17", "W3N14_1_24", "W3N13", "W4N13", "W5N13", "W6N13",
    //         "W6N14_35_47", "W6N14_26_31", "W6N15", "W6N15_40_6", "W5N15_47_12", "W4N15_4_7", "W4N15_6_7", "W4N16_48_30"]
    // },
    // [RoomName.W7N15]: {
    //     spawnRoom: RoomName.W3N18,
    //     milestoneList: ["W3N18_38_45", "W3N17", "W3N16", "W4N16_48_30", "W4N15_18_6", "W4N15_4_7",
    //         "W5N15_47_12", "W5N15_1_7",
    //         "W6N15_47_6", "W6N15_15_7", "W6N15_11_4"]
    // },
    // [RoomName.W3N18]: {
    //     spawnRoom: RoomName.W2N18,
    //     milestoneList: []
    // },
    // [RoomName.W6N21]: {
    //     spawnRoom: RoomName.W2N19,
    //     milestoneList: ["W2N20", "W6N20"]
    // },
    [RoomName.W8N21]: {
        spawnRoom: RoomName.W2N22,
        milestoneList: ["W2N20", "W8N20"]
    },
    // [RoomName.W11N18]: {
    //     spawnRoom: RoomName.W2N19,
    //     milestoneList: ["W2N20", "W10N20", "W10N18"]
    // },
    [RoomName.W9N17]: {
        spawnRoom: RoomName.W8N21,
        milestoneList: ["W8N20", "W10N20", "W10N17_46_40"]
    },
    [RoomName.W1N15]: {
        spawnRoom: RoomName.W1N8,
        milestoneList: ["W0N8", "W0N15"]
    },
    [RoomName.W2N18]: {
        spawnRoom: RoomName.W1N8,
        milestoneList: ["W0N8", "W0N19", "W1N19","W2N19"]
    },
    [RoomName.W2N22]: {
        spawnRoom: RoomName.E1N13,
        milestoneList: ["E0N13", "W0N20", "W2N20", "W2N21"]
    },
    [RoomName.E1N13]: {
        spawnRoom: RoomName.E2N12,
        milestoneList: []
    },
    [RoomName.E4N13]: {
        spawnRoom: RoomName.E2N12,
        milestoneList: ["E2N13", "E3N13"]
    },
    [RoomName.E3N14]: {
        spawnRoom: RoomName.E2N12,
        milestoneList: ["E2N13", "E3N13"]
    },
    [RoomName.E2N11]: {
        spawnRoom: RoomName.E2N12,
        milestoneList: []
    },
    [RoomName.E3N11]: {
        spawnRoom: RoomName.E2N12,
        milestoneList: []
    },
    [RoomName.E5N13]: {
        spawnRoom: RoomName.E4N13,
        milestoneList: ["E4N13_47_38"]
    },
    [RoomName.E2N14]: {
        spawnRoom: RoomName.E3N14,
        milestoneList: ["E2N14_44_45","E2N14_12_45"]
    },
    [RoomName.E2N12]: {
        spawnRoom: RoomName.E5N13,
        milestoneList: ["E4N13","E3N13","E2N13"]
    },
    [RoomName.E5N19]: {
        spawnRoom: RoomName.E5N13,
        milestoneList: ["E5N14_20_38","E5N14_25_21","E5N15","E5N16_36_21","E5N16_21_2"]
    },
    [RoomName.E6N18]: {
        spawnRoom: RoomName.E5N13,
        milestoneList: ["E5N14_20_38","E5N14_25_21","E5N15","E5N16_36_21","E5N16_21_2"]
    },
    [RoomName.E11N11]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: ["E11N10_38_1"]
    },
    [RoomName.E9N8]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: []
    },
    [RoomName.E8N9]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: []
    },
    [RoomName.E5N8]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: ["E8N9", "E8N8", "E6N8_15_47", "E6N7", "E5N7"]
    },
    [RoomName.E3N8]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: ["E8N9", "E8N8", "E6N8_15_47", "E6N7", "E5N7"]
    },
    [RoomName.E9N6]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: ["E10N9", "E10N6"]
    },
    [RoomName.E15N13]: {
        spawnRoom: RoomName.E9N9,
        milestoneList: ["E11N10", "E14N10", "E14N12", "E14N13"]
    },
    [RoomName.E21N9]: {
        spawnRoom: RoomName.E11N11,
        milestoneList: ["E11N10", "E21N10"]
    },
    [RoomName.E31N9]: {
        spawnRoom: RoomName.E21N9,
        milestoneList: ["E21N10", "E31N10"]
    },
    [RoomName.E34N8]: {
        spawnRoom: RoomName.E31N9,
        milestoneList: ["E30N9_32_48", "E30N5_48_7", "E31N5_5_1", "E31N6_5_48", "E32N6_2_13", "E34N6_1_34", "E34N6_30_4", "E34N7"]
    },
    [RoomName.E35N7]: {
        spawnRoom: RoomName.E31N9,
        milestoneList: ["E30N9_32_48", "E30N5_48_7", "E31N5_5_1", "E31N6_5_48", "E32N6_2_13", "E34N6_1_34", "E34N6_30_4", "E34N7_48_17"]
    },
}

export type RemoteCarryConfigItem = {
    sourceId:string;
    targetId:string;
}

export const REMOTE_CARRY_CONFIG: {
    [roomName in RoomName]?: RemoteCarryConfigItem[];
} = {
    [RoomName.E9N9] : [{
        sourceId: "66507838659b91050b2f157b",
        targetId: "67129f01ef49630e78cf4520"
    }]
}

type RemotePathConfigItem = {
    sourceRoomName: RoomName;
    targetRoomName: RoomName;
    milestoneList: string[];
}

const REMOTE_PATH_CONFIG_LIST: RemotePathConfigItem[] = [
    {
        sourceRoomName: RoomName.E9N9,
        targetRoomName: RoomName.E11N11,
        milestoneList: ["E11N10_38_1"]
    }
]

export const REMOTE_PATH_CONFIG_DICT:{
    [key:string] : RemotePathConfigItem
} = {}
REMOTE_PATH_CONFIG_LIST.forEach((item) => {
    let key = item.sourceRoomName + "_" + item.targetRoomName;
    REMOTE_PATH_CONFIG_DICT[key] = item
});
