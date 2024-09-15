import {RoomName} from "./Config";


type LinkConfig = {
    pos: InnerPosition;
    status: "out" | "in" | "both";
    increase: number;
    linkId?: string;
}

type CarryNodeConfig = {
    pos?: InnerPosition;
    range: number;
    resourceType: ResourceConstant;
    type: "input" | "output";
    nodePos: InnerPosition;
    nodeId?: string;
}

export type RoomCarryConfig = {
    link: LinkConfig[];
    node: CarryNodeConfig[];
    keyMap?: { [key: string]: string }
}

export const ALL_ROOM_CARRY_CONFIG: {
    [roomName in RoomName]?: RoomCarryConfig
} = {
    "W2N22": {
        link: [{
            pos: {
                x: 4,
                y: 34
            },
            status: "out",
            increase: 10
        },{
            pos: {
                x: 11,
                y: 22
            },
            status: "in",
            increase: -10
        },{
            pos: {
                x: 26,
                y: 35
            },
            status: "both",
            increase: 10
        }],
        node: [{
            range: 3,
            resourceType: RESOURCE_ENERGY,
            type: "input",
            nodePos: {
                x: 11,
                y: 22
            }
        }]
    },
    "W1N15": {
        link: [{
            pos: {
                x: 20,
                y: 9
            },
            status: "in",
            increase: -10
        },{
            pos: {
                x: 22,
                y: 38
            },
            status: "both",
            increase: 10
        }],
        node: [{
            range: 3,
            resourceType: RESOURCE_ENERGY,
            type: "input",
            nodePos: {
                x: 20,
                y: 9
            }
        }]
    }
}


