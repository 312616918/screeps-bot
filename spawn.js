//@ts-check

module.exports = {




    spawnsPlan: {},


    /**
     * 
     * @param {SpawnTemplate} template 
     */
    reserveCreep: function (template) {
        if (Game.creeps[template.name]) {
            return;
        }
        let spwan = Game.spawns[template.spawnNames[0]];
        if (!spwan|| !spwan.isActive()) {
            console.log("[warning]:spawn " + template.spawnNames[0] + " is not active!")
            let fac = Memory.facility;
            let rName = null;
            for (let roomName in fac) {
                let roomFac = fac[roomName];
                for (let i in roomFac.spawnNames) {
                    if (template.spawnNames[0] == roomFac.spawnNames[i]) {
                        rName = roomName;
                    }
                }
            }
            if(rName!=null){
                for(let i in fac[rName].spawnNames){
                    if (Game.spawns[fac[rName].spawnNames[i]].isActive()) {
                        template.spawnNames[0] = fac[rName].spawnNames[i];
                    }
                }
            }

        }






        console.log("[SpawnCreep]:" + template.name + "-reserve");
        for (let i in template.spawnNames) {
            try {
                let sName = template.spawnNames[i];
                if (Game.spawns[sName].spawning) {
                    continue;
                }
                if (this.spawnsPlan[sName] == undefined || template.priority < this.spawnsPlan[sName].priority) {
                    this.spawnsPlan[sName] = template;
                }
            } catch (error) {
                console.log(error);
                console.log(template.spawnNames[i]+"error")
            }

        }
    },

    /**
     * 
     * @param {SpawnTemplate} template 
     * @param {number} bakTick
     */
    reserveCreepBak: function (template, bakTick) {
        var name = null;


        var origin = Game.creeps[template.name];
        var bak = Game.creeps[template.name + "-bak"];

        if (!origin && bak && bak.ticksToLive < bakTick) {
            name = template.name;
        }
        if (!bak && origin && origin.ticksToLive < bakTick) {
            name = template.name + "-bak";
        }
        if (!origin && !bak) {
            name = template.name;
        }

        if (name) {
            template.name = name;
            this.reserveCreep(template);
        }
    },


    spwanCreep: function () {
        for (let name in Game.spawns) {
            let spawn = Game.spawns[name];
            if (!spawn.spawning) {
                continue;
            }
            spawn.room.visual.text(
                '🛠️' + spawn.spawning.name,
                spawn.pos.x + 1,
                spawn.pos.y, {
                    align: 'left',
                    opacity: 0.8
                });
        }
        // console.log(JSON.stringify(this.spawnsPlan))
        for (let name in this.spawnsPlan) {
            let res = Game.spawns[name].spawnCreep(this.spawnsPlan[name].body, this.spawnsPlan[name].name, {
                memory: this.spawnsPlan[name].memory
            });
            console.log("[SpawnCreep]:" + this.spawnsPlan[name].name + "-" + res);

        }

        /**
         * @type Object.<string,SpawnTemplate>
         */
        this.spawnsPlan = {};
    }
}