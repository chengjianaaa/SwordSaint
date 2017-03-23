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

        pauseButton: {
            default: null,
            type: cc.Button
        },

        skillSelector: {
            default: null,
            type: cc.Node
        },

        gameOverLabel: {
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
        var randomNumber = Math.floor(Math.random() * (this.enemyPrefabs.length));
        return this.enemyPrefabs[randomNumber];
    },

    createSoldier: function () {
        var soldier = cc.instantiate(this.getRandomEnemyPrefab());

        this.node.addChild(soldier);
        soldier.setPositionX(this.player.getPositionX() + this.spawnDistance);
        soldier.setPositionY(this.player.getPositionY());
    },

    getPlayerPerson: function () {
        return this.player.getComponent('Person');
    },

    showSkillSelector: function () {
        this.getPlayerPerson().getSkillList().setSkillButtonsEnabled(false);
        this.pauseButton.getComponent(cc.Button).interactable = false;
        cc.director.pause();
        this.skillSelector.active = true;
    },

    hideSkillSelector: function () {
        this.skillSelector.active = false;
        cc.director.resume();
        this.pauseButton.getComponent(cc.Button).interactable = true;
        this.getPlayerPerson().getSkillList().setSkillButtonsEnabled(true);
    },

	fadeOutAndBackToTitle: function () {
		var screen = this.node.parent,
			fadeOutScreen = new cc.FadeOut(3.0),
			backToTitleFunc = new cc.callFunc(function () {cc.director.loadScene("TitleScreen");}, this),
			sequence = new cc.Sequence(fadeOutScreen, backToTitleFunc);

		fadeOutScreen.easing(cc.easeExponentialOut(30.0));
		screen.runAction(sequence);
	},

	gameOver: function () {
		var moveDownLabel = new cc.MoveTo(1.5, cc.p(this.gameOverLabel.x, 0)),
			fadeOutScreenFunc = new cc.callFunc(this.fadeOutAndBackToTitle, this),
			sequence = new cc.Sequence(moveDownLabel, fadeOutScreenFunc);

		moveDownLabel.easing(cc.easeExponentialOut(30.0));

		this.gameOverLabel.runAction(sequence);
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

        this.getPlayerPerson().getSkillList().setSkillButtonsEnabled(isPaused);
    },

    onUpgradeSkill: function (event, skillIndex) {
        this.getPlayerPerson().getSkillList().getSkill(skillIndex).upgrade();
        this.hideSkillSelector();
    }
});