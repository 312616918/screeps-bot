// var finfra = require("./infra");


var attack = {

    spawnCreeps: function () {

        var creepPlan = [{
                name: "Attacker-01",
                body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH,

                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,

                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,

                    HEAL,HEAL
                ],
                memory: {
                    workPos: {
                        x: 45,
                        y: 9,
                        roomName: "W4N15"
                    }
                },
                bakTick:300
            },
            {
                name: "Attacker-02",
                body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH,

                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,

                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
                    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,

                    HEAL,HEAL
                ],
                memory: {
                    workPos: {
                        x: 39,
                        y: 46,
                        roomName: "W4N15"
                    }
                },
                bakTick:300
            }
        ]
        for (let i in creepPlan) {

            var name=null;

            var origin=Game.creeps[creepPlan[i].name];
            var bak=Game.creeps[creepPlan[i].name+"-bak"];

            if(!origin&&bak&&bak.ticksToLive<creepPlan[i].bakTick){
                name=creepPlan[i].name;
            }
            if(!bak&&origin&&origin.ticksToLive<creepPlan[i].bakTick){
                name=creepPlan[i].name+"-bak";
            }
            if(!origin&&!bak){
                name=creepPlan[i].name;
            }

            if(!name){
                continue;
            }
            let spawns=Game.spawns['Spawn2'];
            if(spawns.spawning){
                spawns=Game.spawns['Spawn1'];
            }
            if (spawns.spawnCreep(creepPlan[i].body, name, {
                    memory: creepPlan[i].memory
                }) != OK) {
                console.log("[SpawnCreep]:" + name + "-wait");
            } else {
                console.log("[SpawnCreep]:" + name + "-OK");
            };
            break;
        }

    },

    run: function (creep) {

        let tarPos = new RoomPosition(creep.memory.workPos.x, creep.memory.workPos.y, creep.memory.workPos.roomName);

        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{
            filter:(c)=>{return c.body.length>10&&creep.pos.getRangeTo(c) < 10}
        });
        if (target && creep.pos.roomName == creep.memory.workPos.roomName) {
            if (creep.pos.getRangeTo(target) > 1) {
                creep.moveTo(target, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }
            // console.log("RangeAttack:"+creep.rangedAttack(target));
            console.log("Attack:" + creep.attack(target));
        }else{
            creep.moveTo(tarPos, {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });
        }

        let wounded=creep.pos.findClosestByRange(FIND_MY_CREEPS,{
            filter:(c)=>{return creep.pos.getRangeTo(c)&&creep.pos.getRangeTo(c)<4&&c.hits<c.hitsMax}
        });
        if(wounded){
            if (creep.heal(wounded) == ERR_NOT_IN_RANGE) {
                creep.rangedHeal(wounded);
            }
        }else{
            creep.heal(creep);
        }

    }
}

module.exports = attack;