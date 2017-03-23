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
var MAX_HP_MULTIPLIER = 6;
var SKILL_1_MULTIPLIER = 6;
var SKILL_2_BONUS_DAMAGE = 240;
var SKILL_2_ATTACKS = 1;
var SKILL_3_MULTIPLIER = 1;
var SKILL_4_DAMAGE_MULTIPLIER = 2;
var SKILL_4_DEFENSE_MULTIPLIER = 2;

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

        skill4DurationBar: {
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

        this.move();
    },

    update: function (dt) {
        //
    },

    getSkill2DurationBar: function () {
        return this.skill2DurationBar.node.getComponent('TimedProgressBar');
    },

    getSkill4DurationBar: function () {
        return this.skill4DurationBar.node.getComponent('TimedProgressBar');
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
        /*manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;*/
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

	getBackground: function () {
		return this.node.parent.getComponent('Background');
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

            this.getSkillList().resetCooldowns();

            this.getBackground().showSkillSelector();
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
            destroyPerson, //the protagonist cant be destroyed because is associated with map camera
			gameOver, //game over only if protagonst dies
            sequence;

        if (this.facingLeft) {
            this.killer.getComponent('Person').rewardKiller();
            destroyPerson = new cc.callFunc(function () { this.node.destroy(); }, this);
            sequence = new cc.Sequence(fadeOutPerson, destroyPerson);
        } else {
			gameOver = new cc.callFunc(function () { this.getBackground().gameOver(); }, this);
			sequence = new cc.Sequence(fadeOutPerson, cc.delayTime(1.50), gameOver);
        }

		this.node.runAction(sequence);
    },

    isSkill2Active: function () {
        if (!this.skill2DurationBar)
            return false;

        return this.skill2DurationBar.progress > 0;
    },

    isSkill4Active: function () {
        if (!this.skill4DurationBar)
            return false;

        return this.skill4DurationBar.progress > 0;
    },

    attack: function () {
        var randomNumber;

        if (!this.isDead() && !this.isUsingSkill() && !this.isSkill4Active()) {
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
            timeWaitAttackSpeed,
            targetUsingSkill4;

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
            receivedDamage;

        if (this.isSkill4Active()) {
            receivedDamage = dmg / (this.def * SKILL_4_DEFENSE_MULTIPLIER);
            this.skill4ReceivedDamage += dmg - receivedDamage;
        } else
            receivedDamage = dmg / this.def;

        this.node.parent.addChild(num);
        num.setPositionX(this.node.getPositionX() + (this.facingLeft ? -30 : 0));
        num.setPositionY(this.node.getPositionY());

        this.setHp(this.currentHp - receivedDamage);
        num.getComponent('DamageNumber').show(receivedDamage);

        if (this.currentHp <= 0)
            this.fall();
    },

    calcBaseDamage : function () {
        return this.atk * DAMAGE_UNIT;
    },

    counterAttack: function () {
        this.skill4ReceivedDamage = 0;
        if (!this.isDead() && !this.isUsingSkill()) {
            this.playAnimation(AnimationName.SPECIAL_D);
        }
    },

    causeDamage: function (dmg) {
        var t,
            target;

        for (t in this.targets) {
            target = this.targets[t];
            
            if (!target.isDead()) {
                if (target.isSkill4Active())
                    target.counterAttack();

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
        this.causeDamage(this.calcBaseDamage() * SKILL_1_MULTIPLIER);
    },

    causeSkill2Damage: function () {
        this.causeDamage(this.calcBaseDamage() + SKILL_2_BONUS_DAMAGE);
    },

    causeSkill3Damage: function () {
        this.causeDamage((this.maxHp - this.currentHp) * SKILL_3_MULTIPLIER);
    },

    causeSkill4Damage: function () {
        this.causeDamage(this.skill4ReceivedDamage * SKILL_4_DAMAGE_MULTIPLIER);
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
        if (this.skillBeingUsed == 1) {
            this.skill2AttackCounter = 0;
            this.getSkill2DurationBar().startBar();
        } else if (this.skillBeingUsed == 3)
            this.getSkill4DurationBar().startBar();

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
            else if (index == 3)
                this.playAnimation(AnimationName.CHARGING);

            skillUsed.cooldownStart();
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