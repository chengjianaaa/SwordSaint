cc.Class({
    extends: cc.Component,

    properties: {
        spawnPoint: new cc.Vec2(1584, 192),
        spawnDistance: 0,

        player: {
            default: null,
            type: cc.Node
        },

        soldierPrefab: {
            default: null,
            type: cc.Prefab
        },

        soldier: {
            default: null,
            visible: false,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        //
    },

    update: function (dt) {
        var canvas = this.node.parent,
            playerPos;

        playerPos = this.player.x + this.player.width/2;

        //if reaches end...
        if (playerPos >= this.node.width - canvas.width/2) {
            this.player.x = canvas.width/2 - this.player.width/2; //go back to beginning 
			this.soldier = null; //can make a new soldier
		}

        if (playerPos > canvas.width/2 && playerPos < this.node.width - canvas.width/2)
            this.node.x = -playerPos;

        if (!(this.soldier) && (this.player.x + this.spawnDistance) >= this.spawnPoint.x) {
			//create soldier if player comes close to spawnPoint
            this.soldier = cc.instantiate(this.soldierPrefab);
            this.node.addChild(this.soldier);
            this.soldier.setPosition(this.spawnPoint);
        }
    },
});
