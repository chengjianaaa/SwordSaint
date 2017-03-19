var AnimationName = cc.Enum({
    STOPPED: 'Stopped',
    WALKING: 'Walking',
    ATTACK_A: 'AttackA',
    ATTACK_B: 'AttackB',
    FALLING: 'Falling',
    SPECIAL_A: 'SpecialA',
    SPECIAL_B: 'SpecialB',
    SPECIAL_C: 'SpecialC',
    CHARGING: 'Charging',
    SPECIAL_D: 'SpecialD'
});

var DAMAGE_UNIT = 60;
var MAX_HP_MULTIPLIER = 5;
var SKILL_COOLDOWN = 15.0;
var SKILL_1_MULTIPLIER = 2;
var SKILL_2_MULTIPLIER = 1;
var SKILL_2_ATTACKS = 1;
var SKILL_3_MULTIPLIER = 0.4;
var SKILL_4_DAMAGE_MULTIPLIER = 2;


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

        level: 0,
        currentXp: 0,

        movementSpeed: 0,
        facingLeft: true,
        targets: [],
        skillBeingUsed: -1,
        skill4ReceivedDamage: 0,

        skillList: {
            default: null,
            type: cc.Node
        },

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

        killCounter: {
            default: null,
            type: cc.Label
        },

        skill2DurationBar: {
            default: null,
            type: cc.ProgressBar
        },

        xpBar: {
            default: null,
            type: cc.ProgressBar
        },

        levelLabel: {
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

        skill2AttackCounter: {
            default: 0,
            visible: false,
        },

        killer: {
            default: null,
            visible: false,
            type: cc.Node
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

        this.setMaxHp();
        this.setHp(this.maxHp);

        this.levelUp();

		this.setSkill2DurationBarEndEvent();
        this.move();
    },

    update: function (dt) {
        //
    },

	getSkill2DurationBar: function () {
		return this.skill2DurationBar.node.getComponent('TimedProgressBar');
	},

	setSkill2DurationBarEndEvent: function () {
		var that = this;

		if (this.skill2DurationBar) {
			this.getSkill2DurationBar().onBarEnd =
				function (self) {
					that.skillCastEnd(1);
				};
		}
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
    },

    setMaxHp: function () {
        this.maxHp = this.lif * DAMAGE_UNIT * MAX_HP_MULTIPLIER;
        this.getNumberedProgressBar(this.lifeBar).maxValue = this.maxHp;
    },

    setHp: function (value) {
        var trueValue = value;

        if (value < 0)
            trueValue = 0;

        if (value > this.maxHp)
            trueValue = this.maxHp;

        this.currentHp = trueValue;
        this.getNumberedProgressBar(this.lifeBar).setProgress(trueValue);
    },

    getNumberedProgressBar: function (progressBar) {
        return progressBar.node.getComponent('NumberedProgressBar');
    },

    calcXpToNextLevel: function (lvl) {
        if (lvl <= 1)
            return 1;

        return lvl + this.calcXpToNextLevel(lvl - 1);
    },

    getSkillList: function (index) {
        return this.skillList.getComponent('SkillList');
    },

    levelUp: function () {
        var i;

        if (this.xpBar) {
            this.setHp(this.maxHp);
            this.level++;
            this.levelLabel.string = this.level;

            this.getNumberedProgressBar(this.xpBar).maxValue = this.calcXpToNextLevel(this.level);
            this.getNumberedProgressBar(this.xpBar).setProgress(0);
            this.currentXp = 0;

			this.getSkill2DurationBar().setProgress(0);
            this.getSkillList().resetCooldowns();

            this.node.parent.getComponent('Background').showSkillSelector();
        }
    },

    isDead: function () {
        return this.currentHp <= 0;
    },

    playAnimation: function (name) {
        this.getComponent(cc.Animation).play(name);
    },

    stop: function () {
        if (!this.isDead()) {
            this.playAnimation(AnimationName.STOPPED);

            if (this.moveForward && this.moveForward.getTarget() === this.node)
                this.node.stopAction(this.moveForward);
        }
    },

	isUsingSkill: function () {
		return this.skillBeingUsed >= 0;
	},

    move: function () {
        if (!this.isDead() && !this.isUsingSkill()) {
            this.playAnimation(AnimationName.WALKING);

            if (this.attackSequence && this.attackSequence.getTarget() === this.node)
                this.node.stopAction(this.attackSequence);

            this.node.runAction(this.moveForward).repeatForever();
        }
    },

    fall: function () {
        this.node.stopAllActions();
        this.playAnimation(AnimationName.FALLING);
    },

    refreshKillCount: function () {
        this.killCount++;

        if (this.killCounter)
            this.killCounter.string = this.killCount;
    },

    incrementXp: function () {
        if (this.xpBar) {
            this.currentXp++;
            this.getNumberedProgressBar(this.xpBar).setProgress(this.currentXp);
            if (this.xpBar.progress >= 1)
                this.levelUp();
        }
    },

    rewardKiller: function () {
        this.refreshKillCount();
        this.incrementXp();
    },

    die: function () {
        var fadeOutPerson = new cc.fadeOut(0.70),
            destroyPerson,
            sequence;

        if (this.facingLeft) {
            this.killer.getComponent('Person').rewardKiller();
            destroyPerson = new cc.callFunc(function () { this.node.destroy(); }, this);
            sequence = new cc.Sequence(fadeOutPerson, destroyPerson);
            this.node.runAction(sequence);
        } else {
            //the protagonist cant be destroyed because is associated with map camera
            this.node.runAction(fadeOutPerson);
        }
    },

    isSkill2Active: function () {
        if (!this.skill2DurationBar)
            return false;

        return this.skill2DurationBar.progress > 0;
    },

    attack: function () {
        var randomNumber;

        if (!this.isDead() && !this.isUsingSkill()) {
            if (!this.isSkill2Active() || this.skill2AttackCounter < SKILL_2_ATTACKS - 1) {
                if (this.isSkill2Active())
                    this.skill2AttackCounter++; 

                randomNumber = Math.round(Math.random() * (this.attackAnimationNames.length - 1));
                this.playAnimation(this.attackAnimationNames[randomNumber]);
            } else {
                if (this.isSkill2Active())
                    this.skill2AttackCounter = 0;

                this.playAnimation(AnimationName.SPECIAL_A);
            }
        }
    },

    beginAttack: function () {
        var funcStop,
            funcAttack,
            waitAttackSpeed,
            timeWaitAttackSpeed;

        if (!this.isDead() && !this.isUsingSkill()) {
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
			defense = this.def,
            receivedDamage;

		if (this.skillBeingUsed == 3)
			defense = defense * 2;

		receivedDamage = dmg / defense;
		this.skill4ReceivedDamage += dmg - receivedDamage;

        this.node.parent.addChild(num);
        num.setPositionX(this.node.getPositionX() + (this.facingLeft ? -30 : 0));
        num.setPositionY(this.node.getPositionY());

        this.setHp(this.currentHp - receivedDamage);
        num.getComponent('DamageNumber').show(receivedDamage);

        if (this.currentHp <= 0) {
            this.fall();
        }
    },

    calcBaseDamage : function () {
        return this.atk * DAMAGE_UNIT;
    },

    causeDamage: function (dmg) {
        var t,
            target;

        for (t in this.targets) {
            target = this.targets[t];
            
            if (!target.isDead()) {
                target.receiveDamage(dmg);

                if (target.isDead()) {
                    target.killer = this;
                }
            }
        }
    },

    causeNormalDamage: function () {
        this.causeDamage(this.calcBaseDamage());
    },

    causeSkill1Damage: function () {
        var multiplier = SKILL_1_MULTIPLIER * (this.getSkillList().getSkill(0).level + 1); //4, 6, 8, 10...
        this.causeDamage(this.calcBaseDamage() * multiplier);
    },

    causeSkill2Damage: function () {
        var bonusDamage = SKILL_2_MULTIPLIER * DAMAGE_UNIT * this.getSkillList().getSkill(1).level; //60, 120, 180, 240...
        this.causeDamage(this.calcBaseDamage() + bonusDamage);
    },

    causeSkill3Damage: function () {
        var multiplier = 1 + SKILL_3_MULTIPLIER * (this.getSkillList().getSkill(2).level - 1);  //1, 1.4, 1.8, 2.2...
        this.causeDamage((this.maxHp - this.currentHp) * multiplier);
    },

    causeSkill4Damage: function () {
        var multiplier = SKILL_4_DAMAGE_MULTIPLIER * (this.getSkillList().getSkill(3).level + 1); //4, 6, 8, 10...
        this.causeDamage(this.skill4ReceivedDamage * multiplier);
    },

    endAttack: function () {
        var haveTarget = false;

        this.skillBeingUsed = -1;

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

    endCharge: function () {
        this.skill2AttackCounter = 0;
        this.getSkill2DurationBar().startBar();

        this.endAttack();
    },

    skill: function (event, index) {
        var skillUsed = this.getSkillList().getSkill(index);

        if (!this.isDead() && !this.isUsingSkill() && skillUsed.getCooldownBar().getProgress() <= 0) {
            this.skillBeingUsed = index;
            this.node.stopAllActions();

            if (index == 0)
                this.playAnimation(AnimationName.SPECIAL_B);
            else if (index == 1)
                this.playAnimation(AnimationName.CHARGING);
            else if (index == 2)
                this.playAnimation(AnimationName.SPECIAL_C);
			else if (index == 3) {
				this.skill4ReceivedDamage = 0;
                this.playAnimation(AnimationName.SPECIAL_D);
			}

            skillUsed.setCooldownFromBeginning();
        }
    },

	skillCastEnd: function (skillIndex) {
		this.getSkillList().getSkill(skillIndex).startCountCooldown();

		if (skillIndex != 1)
			this.endAttack();
	},

    // Collision callback
    onCollisionEnter: function (other, self) {
        if (self.tag === collisionTag.DAMAGE_AREA && other.tag === collisionTag.BODY) {
            this.targets.push(other.node.getComponent('Person'));
            this.beginAttack();
        }
    }
});