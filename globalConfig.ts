/**
 * 全局配置
 */


export enum RoomName {
    W7N18 = "W7N18",

    // W23S23 = "W23S23"
    // W3N15="W3N15",
    W3N19 = "W3N19"
    // W2N15="W2N15",
    // W2N16="W2N16",
    // W2N18="W2N18",
    // W7N16="W7N16"
}

type PartConfig = {
    [part in BodyPartConstant]?: number;
}

type Config = {
    [roomName in RoomName]: {
        carry: {
            amount: number;
            defaultParts: PartConfig;
        }
        harvest: {
            defaultParts: PartConfig;
            creepConfigs: {
                pos: RoomPosition;
            }[]
        }
        upgrade: {
            defaultParts: PartConfig;
            creepConfigs: {
                pos: RoomPosition;
            }[]
        }
        build?: {
            amount: number;
            defaultParts: PartConfig;
        }
    }
}


export const globalConfig: Config = {
    W7N18: {
        carry: {
            amount: 8,
            defaultParts: {
                carry: 4,
                move: 2
            }
        },
        harvest: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 2
            },
            creepConfigs: [{
                pos: new RoomPosition(27, 18, RoomName.W7N18)
            }, {
                pos: new RoomPosition(9, 16, RoomName.W7N18)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 4,
                carry: 2,
                move: 2
            },
            creepConfigs: [{
                pos: new RoomPosition(35, 13, RoomName.W7N18)
            }
                , {
                    pos: new RoomPosition(36, 13, RoomName.W7N18)
                }, {
                    pos: new RoomPosition(37, 13, RoomName.W7N18)
                }
            ]
        },
        build: {
            amount: 1,
            defaultParts: {
                work: 1,
                carry: 1,
                move: 1
            }
        }
    },
    W3N19: {
        carry: {
            amount: 2,
            defaultParts: {
                carry: 1,
                move: 1
            }
        },
        harvest: {
            defaultParts: {
                work: 2,
                carry: 0,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(28, 27, RoomName.W3N19)
            }, {
                pos: new RoomPosition(30, 32, RoomName.W3N19)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 1,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(26, 28, RoomName.W3N19)
            },{
                pos: new RoomPosition(27, 28, RoomName.W3N19)
            }]
        },
        build: {
            amount: 1,
            defaultParts: {
                work: 1,
                carry: 1,
                move: 1
            }
        }
    }
}
