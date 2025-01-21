export type ResourceAmount = {
    resourceType: ResourceConstant;
    amount: number;
}

export type ProductStep = {
    target: ResourceAmount;
    sourceList: ResourceAmount[];
}

const PRODUCT_STEP_LIST: ProductStep[] = [
    {
        //5级-奥秘
        target: {
            resourceType: RESOURCE_ESSENCE,
            amount: 1,
        },
        sourceList: [
            {
                resourceType: RESOURCE_EMANATION,
                amount: 1,
            }, {
                resourceType: RESOURCE_SPIRIT,
                amount: 3,
            }, {
                resourceType: RESOURCE_CRYSTAL,
                amount: 110,
            }, {
                resourceType: RESOURCE_GHODIUM_MELT,
                amount: 150,
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 64,
            }
        ]
    },
    //4级-奥秘
    {
        target: {
            resourceType: RESOURCE_EMANATION,
            amount: 1,
        },
        sourceList: [
            {
                resourceType: RESOURCE_SPIRIT,
                amount: 2,
            }, {
                resourceType: RESOURCE_EXTRACT,
                amount: 2,
            }, {
                resourceType: RESOURCE_CONCENTRATE,
                amount: 3,
            }, {
                resourceType: RESOURCE_KEANIUM_BAR,
                amount: 112,
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 32,
            }
        ]
    },
    //3级-奥秘
    {
        target: {
            resourceType: RESOURCE_SPIRIT,
            amount: 1,
        },
        sourceList: [
            {
                resourceType: RESOURCE_EXTRACT,
                amount: 2,
            }, {
                resourceType: RESOURCE_CONCENTRATE,
                amount: 6,
            }, {
                resourceType: RESOURCE_REDUCTANT,
                amount: 90,
            }, {
                resourceType: RESOURCE_PURIFIER,
                amount: 20,
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 16,
            }
        ]
    },
    //2级-奥秘
    {
        target: {
            resourceType: RESOURCE_EXTRACT,
            amount: 2,
        },
        sourceList: [
            {
                resourceType: RESOURCE_CONCENTRATE,
                amount: 10,
            }, {
                resourceType: RESOURCE_CONDENSATE,
                amount: 30,
            }, {
                resourceType: RESOURCE_OXIDANT,
                amount: 60,
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 16,
            }
        ]
    },
    //1级-奥秘
    {
        target: {
            resourceType: RESOURCE_CONCENTRATE,
            amount: 3,
        },
        sourceList: [
            {
                resourceType: RESOURCE_CONDENSATE,
                amount: 30,
            }, {
                resourceType: RESOURCE_KEANIUM_BAR,
                amount: 15,
            }, {
                resourceType: RESOURCE_REDUCTANT,
                amount: 54,
            },
            {
                resourceType: RESOURCE_ENERGY,
                amount: 12,
            }
        ]
    },
    //常规高等商品
    {
        target: {
            resourceType: RESOURCE_COMPOSITE,
            amount: 20,
        },
        sourceList: [
            {
                resourceType: RESOURCE_UTRIUM_BAR,
                amount: 20,
            }, {
                resourceType: RESOURCE_ZYNTHIUM_BAR,
                amount: 20,
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 20,
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_CRYSTAL,
            amount: 6,
        },
        sourceList: [
            {
                resourceType: RESOURCE_LEMERGIUM_BAR,
                amount: 6,
            }, {
                resourceType: RESOURCE_KEANIUM_BAR,
                amount: 6,
            }, {
                resourceType: RESOURCE_PURIFIER,
                amount: 6,
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 45
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_GHODIUM,
            amount: 12,
        },
        sourceList: [
            {
                resourceType: RESOURCE_OXIDANT,
                amount: 12,
            }, {
                resourceType: RESOURCE_REDUCTANT,
                amount: 12,
            }, {
                resourceType: RESOURCE_GHODIUM_MELT,
                amount: 12
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 90
            }
        ]
    },

    // 压缩商品
    {
        target: {
            resourceType: RESOURCE_UTRIUM_BAR,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_UTRIUM,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    },
    {
        target: {
            resourceType: RESOURCE_LEMERGIUM_BAR,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_LEMERGIUM,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_ZYNTHIUM_BAR,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_ZYNTHIUM,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_KEANIUM_BAR,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_KEANIUM,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_GHODIUM_MELT,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_GHODIUM,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_OXIDANT,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_OXYGEN,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_REDUCTANT,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_HYDROGEN,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    }, {
        target: {
            resourceType: RESOURCE_PURIFIER,
            amount: 100,
        },
        sourceList: [
            {
                resourceType: RESOURCE_CATALYST,
                amount: 500
            }, {
                resourceType: RESOURCE_ENERGY,
                amount: 200
            }
        ]
    },
    {
        target: {
            resourceType: RESOURCE_BATTERY,
            amount: 50,
        },
        sourceList: [
            {
                resourceType: RESOURCE_ENERGY,
                amount: 600
            }
        ]
    }
]

export const PRODUCT_STEP_DICT: {
    [key in ResourceConstant]?: ProductStep;
} = {};
PRODUCT_STEP_LIST.forEach(step => {
    PRODUCT_STEP_DICT[step.target.resourceType] = step;
})