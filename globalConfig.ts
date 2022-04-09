/**
 * 全局配置
 */


export enum RoomName {
    W7N18 = "W7N18",
    W8N21 = "W8N21",
    W4N22 = "W4N22",
    W8N24 = "W8N24",
    W7N24 = "W7N24",

    // W23S23 = "W23S23"
    // W3N15="W3N15",
    W3N19 = "W3N19",
    // W2N15="W2N15",
    // W2N16="W2N16",
    W2N18 = "W2N18"
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
                parts?: PartConfig;
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
            amount: 3,
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
                work: 16,
                carry: 1,
                move: 4
            },
            creepConfigs: [{
                pos: new RoomPosition(35, 13, RoomName.W7N18)
            }]
        },
        build: {
            amount: 1,
            defaultParts: {
                work: 6,
                carry: 4,
                move: 3
            }
        }
    },
    W3N19: {
        carry: {
            amount: 2,
            defaultParts: {
                carry: 4,
                move: 2
            }
        },
        harvest: {
            defaultParts: {
                work: 5,
                carry: 1,
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
                work: 5,
                carry: 2,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(26, 28, RoomName.W3N19)
            }
                , {
                    pos: new RoomPosition(27, 28, RoomName.W3N19)
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
    W8N21: {
        carry: {
            amount: 3,
            defaultParts: {
                carry: 4,
                move: 2
            }
        },
        harvest: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(40, 20, RoomName.W8N21)
            }, {
                pos: new RoomPosition(20, 15, RoomName.W8N21)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 3
            },
            creepConfigs: [{
                pos: new RoomPosition(31, 13, RoomName.W8N21)
            }]
        },
        build: {
            amount: 1,
            defaultParts: {
                work: 6,
                carry: 2,
                move: 3
            }
        }
    },
    W4N22: {
        carry: {
            amount: 2,
            defaultParts: {
                carry: 4,
                move: 2
            }
        },
        harvest: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 3
            },
            creepConfigs: [{
                pos: new RoomPosition(46, 38, RoomName.W4N22)
            }, {
                pos: new RoomPosition(24, 44, RoomName.W4N22)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(38, 41, RoomName.W4N22)
            }, {
                pos: new RoomPosition(39, 40, RoomName.W4N22)
            }, {
                pos: new RoomPosition(39, 39, RoomName.W4N22)
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
    },
    W8N24: {
        carry: {
            amount: 3,
            defaultParts: {
                carry: 4,
                move: 2
            }
        },
        harvest: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(21, 21, RoomName.W8N24)
            }, {
                pos: new RoomPosition(15, 23, RoomName.W8N24)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 2,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(11, 16, RoomName.W8N24)
            }, {
                pos: new RoomPosition(12, 17, RoomName.W8N24)
            }, {
                pos: new RoomPosition(12, 15, RoomName.W8N24)
            }]
        },
        build: {
            amount: 1,
            defaultParts: {
                work: 5,
                carry: 2,
                move: 1
            }
        }
    },
    W7N24: {
        carry: {
            amount: 4,
            defaultParts: {
                carry: 4,
                move: 2
            }
        },
        harvest: {
            defaultParts: {
                work: 5,
                carry: 1,
                move: 5
            },
            creepConfigs: [{
                pos: new RoomPosition(16, 6, RoomName.W7N24),
                parts: {
                    work: 5,
                    carry: 1,
                    move: 1
                }
            }, {
                pos: new RoomPosition(44, 45, RoomName.W7N24)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 10,
                carry: 1,
                move: 5
            },
            creepConfigs: [{
                pos: new RoomPosition(39, 24, RoomName.W7N24)
            }]
        },
        build: {
            amount: 1,
            defaultParts: {
                work: 5,
                carry: 4,
                move: 2
            }
        }
    },
    W2N18: {
        carry: {
            amount: 2,
            defaultParts: {
                carry: 2,
                move: 1
            }
        },
        harvest: {
            defaultParts: {
                work: 2,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(16, 14, RoomName.W2N18)
            }, {
                pos: new RoomPosition(19, 17, RoomName.W2N18)
            }]
        },
        upgrade: {
            defaultParts: {
                work: 2,
                carry: 1,
                move: 1
            },
            creepConfigs: [{
                pos: new RoomPosition(14, 12, RoomName.W2N18)
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


export function getBodyParts(config: PartConfig, maxNum = -1): BodyPartConstant[] {
    let bodys: BodyPartConstant[] = [];
    for (let part in config) {
        let partAmount = config[part];
        if (maxNum >= 0 && partAmount > maxNum) {
            partAmount = maxNum;
        }
        bodys = bodys.concat(new Array(partAmount).fill(part))
    }
    return bodys;
}