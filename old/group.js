//@ts-check
const spawn = require("../spawn");

module.exports={
    run:function(/** @type {Creep[]} */ creeps){
        if(!creeps|| creeps.length!=2){
            return;
        }
        let c0=creeps[0];
        let c1=creeps[1];
        let f=Game.flags["Flag1"];
        if(!c0||!c1||!f){
            return;
        }
        let res= c0.moveTo(Game.flags["Flag1"], {
            visualizePathStyle: {
                stroke: '#ffaa00'
            }
        });
        if(res==OK){
            // Memory.gpos=c0.pos;
            c1.moveTo(c0.pos);
        }

        if(c0.hits<c0.hitsMax){
            c0.heal(c0);
            if(c1.heal(c0)!=OK){
                c1.rangedHeal(c0);
            }
        }else if(c1.hits<c1.hitsMax){
            c1.heal(c1);
            if(c0.heal(c1)!=OK){
                c0.rangedHeal(c1);
            }
        }


    }
}