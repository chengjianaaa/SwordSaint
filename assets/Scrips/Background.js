var collisionTag = require("CollisionTag");

cc.Class({
    extends: cc.Component,

    properties: {
        spawnDistance: 0,

        player: {
            default: null,
            type: cc.Node
        },

        enemyPrefabs: {
            default: [],
            type: [cc.Prefab]
        },

        skillButtons: {
            default: [],
            type: [cc.Button]
        },

        pauseButton: {
            default: null,
            type: cc.Button
        },

        skillSelector: {
            default: null,
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

        //if reaches end, go back to beginning 
        if (playerPos >= this.node.width - canvas.width/2) {
            this.player.x = canvas.width/2 - this.player.width/2;
        }

        if (playerPos > canvas.width/2 && playerPos < this.node.width - canvas.width/2)
            this.node.x = -playerPos;
    },

    getRandomEnemyPrefab: function () {
        var randomNumber = Math.round(Math.random() * (this.enemyPrefabs.length - 1));
        return this.enemyPrefabs[randomNumber];
    },

    createSoldier: function () {
        var soldier = cc.instantiate(this.getRandomEnemyPrefab());

        this.node.addChild(soldier);
        soldier.setPositionX(this.player.getPositionX() + this.spawnDistance);
        soldier.setPositionY(this.player.getPositionY());
    },

    setSkillButtonsEnabled: function (enable) {
        for (var i in this.skillButtons) {
            this.skillButtons[i].enabled = enable;
        }
    },

    showSkillSelector: function () {
        this.setSkillButtonsEnabled(false);
        this.pauseButton.getComponent(cc.Button).interactable = false;
        cc.director.pause();
        this.skillSelector.active = true;
    },

    hideSkillSelector: function () {
        this.skillSelector.active = false;
        cc.director.resume();
        this.pauseButton.getComponent(cc.Button).interactable = true;
        this.setSkillButtonsEnabled(true);
    },

    onCollisionEnter: function (other, self) {
        if (other.tag === collisionTag.BODY) {
            if (self.tag === collisionTag.SPAWN_AREA) {
                this.createSoldier();
            }
        }
    },

    onPauseGame: function (other, self) {
        var isPaused = cc.director.isPaused();

        if (isPaused) {
            cc.director.resume();
        }
        else {
            cc.director.pause();
        }

        this.setSkillButtonsEnabled(isPaused);
    },

    onUpgradeSkill: function (event, skillIndex) {
        this.player.getComponent('Person').upgradeSkill(skillIndex);
        this.hideSkillSelector();
    }
});