var AnimationName = cc.Enum({
    STOPPED: 'Stopped',
    WALKING: 'Walking',
    ATTACK_A: 'AttackA',
    ATTACK_B: 'AttackB',
    FALLING: 'Falling'
});

var DAMAGE_UNIT = 60;

var collisionTag = require("CollisionTag");
var attr = require("Attributes");

cc.Class({
    extends: cc.Component,

    properties: {
        //attributes
        lif: 1,
        atk: 1,
        def: 1,
        spd: 1,

        movementSpeed: 0,
        facingLeft: true,
        targets: [],

        damageNumber: {
            default: null,
            type: cc.Prefab
        },

        lifeBar: {
            default: null,
            type: cc.ProgressBar
        },

        lifeNumbers: {
            default: null,
            type: cc.Label
        },

        moveForward: {
            default: null,
            visible: false,
            type: cc.Action
        },

        attackSequence: {
            default: null,
            visible: false,
            type: cc.Action
        },

        currentHp: {
            default: 100,
            visible: false
        },

        maxHp: {
            default: 100,
            visible: false
        },

        attackAnimationNames: {
            default: [],
            visible: false
        },
		
		killCount: {
            default: 0,
            visible: false
        },
		
		killCounter: {
            default: null,
			type: cc.Label
        }
    },

    onLoad: function () {
        this.fillAttackAnimationNamesList();
        this.enableCollisions();
        this.setFacingLeft(this.facingLeft);

        if (!this.facingLeft) {
            this.lif = attr.lif;
            this.atk = attr.atk;
            this.def = attr.def;
            this.spd = attr.spd;
        }
        this.maxHp = this.lif * DAMAGE_UNIT * 10;
        this.currentHp = this.maxHp;
		this.refreshLifebar();

        this.move();
    },

    update: function (dt) {
        //
    },

    fillAttackAnimationNamesList: function () {
        var animations = this.getComponent(cc.Animation).getClips(),
            aniIndex,
            aniName;

        for (aniIndex in animations) {
            aniName = animations[aniIndex].name;
            if (animations[aniIndex].name.startsWith("Attack")) {
                this.attackAnimationNames.push(animations[aniIndex].name);
            }
        }
    },

    enableCollisions: function () {
        var manager = cc.director.getCollisionManager();

        manager.enabled = true;
        
        //show debug collision boxes
        manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;
    },

    createMoveForwardAction: function () {
        var mult = this.facingLeft ? -1 : 1;
        this.moveForward = new cc.MoveBy(1, cc.p(this.movementSpeed * mult, 0));
    },

    setFacingLeft: function (value) {
        this.facingLeft = value;

        this.stop();
        this.createMoveForwardAction();

        this.node.runAction(new cc.flipX(!value));
    },

	refreshLifebar: function() {
		this.lifeBar.progress = this.currentHp / this.maxHp;
		if (this.lifeNumbers)
			this.lifeNumbers.string = this.currentHp + "/" + this.maxHp;
	},

    isDead: function () {
        return this.currentHp <= 0;
    },

    stop: function () {
        if (!this.isDead()) {
            this.getComponent(cc.Animation).play(AnimationName.STOPPED);

            if (this.moveForward && this.moveForward.getTarget() === this.node)
                this.node.stopAction(this.moveForward);
        }
    },

    move: function () {
        if (!this.isDead()) {
            this.getComponent(cc.Animation).play(AnimationName.WALKING);

            if (this.attackSequence && this.attackSequence.getTarget() === this.node)
                this.node.stopAction(this.attackSequence);

            this.node.runAction(this.moveForward).repeatForever();
        }
    },

    fall: function () {
        this.node.stopAllActions();
        this.getComponent(cc.Animation).play(AnimationName.FALLING);
    },

    die: function () {
        var fadeOutPerson = new cc.fadeOut(0.70),
            destroyPerson,
            sequence;

        if (this.facingLeft) {
            destroyPerson = new cc.callFunc(function () { this.node.destroy(); }, this);
            sequence = new cc.Sequence(fadeOutPerson, destroyPerson);
            this.node.runAction(sequence);
        } else {
            //the protagonist cant be destroyed because is associated with map camera
            this.node.runAction(fadeOutPerson);
        }
    },

    attack: function () {
        var randomNumber;

        if (!this.isDead()) {
            randomNumber = Math.round(Math.random() * (this.attackAnimationNames.length - 1));
            this.getComponent(cc.Animation).play(this.attackAnimationNames[randomNumber]);
        }
    },

    beginAttack: function () {
        var funcStop,
            funcAttack,
            waitAttackSpeed,
            timeWaitAttackSpeed;

        if (!this.isDead()) {
            funcStop = new cc.callFunc(this.stop, this);

            funcAttack = new cc.callFunc(this.attack, this);

            timeWaitAttackSpeed = (3.60/this.spd) - 0.60;
            timeWaitAttackSpeed = timeWaitAttackSpeed > 0 ? timeWaitAttackSpeed : 0.01;
            waitAttackSpeed = new cc.delayTime(timeWaitAttackSpeed);

            this.attackSequence = new cc.Sequence(funcStop, waitAttackSpeed, funcAttack);

            this.node.runAction(this.attackSequence);
        }
    },

    receiveDamage: function (dmg) {
        var num = cc.instantiate(this.damageNumber),
            receivedDamage = dmg / this.def;

        this.node.parent.addChild(num);
        num.setPositionX(this.node.getPositionX() + (this.facingLeft ? -30 : 0));
        num.setPositionY(this.node.getPositionY());

        this.currentHp = this.currentHp - receivedDamage;
        num.getComponent('DamageNumber').show(receivedDamage);

        this.refreshLifebar();

        if (this.currentHp <= 0) {
            this.fall();
        }
    },

    calcCausedDamage : function () {
        return this.atk * DAMAGE_UNIT;
    },

    causeDamage: function () {
        var t,
            target;

        for (t in this.targets) {
            target = this.targets[t];
            
            target.receiveDamage(this.calcCausedDamage());
            
            if (target.isDead()) {
                this.refreshKillCount();
            }
        }
    },

	refreshKillCount: function () {
		this.killCount++;

		if (this.killCounter)
			this.killCounter.string = this.killCount;
	},

    endAttack: function () {
        var haveTarget = false;

        if (this.targets.length > 0) {
            if (this.targets[0].isDead()) {
                this.targets.splice(this.targets.indexOf(this.targets[0]), 1);
            } else {
                haveTarget = true;
            }
        }

        if (haveTarget) {
            this.beginAttack();
        } else {
            if (this.facingLeft) {
                this.move();
                this.stop(); //enemies stop after kill protagonist
            } else {
                this.move(); //protagonist move after kill all targets
            }
        }
    },

    // Collision callback
    onCollisionEnter: function (other, self) {
        if (self.tag === collisionTag.DAMAGE_AREA && other.tag === collisionTag.BODY) {
            this.targets.push(other.node.getComponent('Person'));
            this.beginAttack();
        }
    }
});