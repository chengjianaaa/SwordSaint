var collisionTag = require("CollisionTag");

cc.Class({
    extends: cc.Component,

    properties: {
        spawnDistance: 0,

        player: {
            default: null,
            type: cc.Node
        },

        soldierPrefab: {
            default: null,
            type: cc.Prefab
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

        //if reaches end, go back to beginning 
        if (playerPos >= this.node.width - canvas.width/2) {
            this.player.x = canvas.width/2 - this.player.width/2;
        }

        if (playerPos > canvas.width/2 && playerPos < this.node.width - canvas.width/2)
            this.node.x = -playerPos;
    },

    createSoldier: function () {
        var soldier = cc.instantiate(this.soldierPrefab);

        this.node.addChild(soldier);
        soldier.setPositionX(this.player.getPositionX() + this.spawnDistance);
        soldier.setPositionY(this.player.getPositionY());
    },

    onCollisionEnter: function (other, self) {
        if (other.tag === collisionTag.BODY) {
            if (self.tag === collisionTag.SPAWN_AREA) {
                this.createSoldier();
            }
        }
    }
});