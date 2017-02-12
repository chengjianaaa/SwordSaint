var AnimationName = cc.Enum({
    STOPPED: 'Stopped',
    WALKING: 'Walking',
    ATTACK_A: 'AttackA',
    ATTACK_B: 'AttackB',
    FALLING: 'Falling',
    SPECIAL_A: 'SpecialA',
    SPECIAL_B: 'SpecialB',
    CHARGING: 'Charging'
});

var COOLDOWN_BAR_UPDATE_TIME = 0.1;
var SKILLS_COOLDOWN_SECONDS = [20.0, 20.0];
var SKILL_2_DURATION_SECONDS = 10.0;

var DAMAGE_UNIT = 60;
var SKILL_1_DAMAGE_MULTIPLIER = 6;
var SKILL_2_BONUS_DAMAGE = 120;
var SKILL_2_ATTACKS = 1;

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

        killCounter: {
            default: null,
            type: cc.Label
        },

        skillCooldownBars: {
            default: [],
            type: [cc.ProgressBar]
        },

        skill2DurationBar: {
            default: null,
            type: cc.ProgressBar
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

        usingSkill: {
            default: false,
            visible: false
        },

        skill2AttackCounter: {
            default: 0,
            visible: false,
        },
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
        var currentHpToShow;

        this.lifeBar.progress = this.currentHp / this.maxHp;
        if (this.lifeNumbers) {
            currentHpToShow = this.currentHp < 0 ? 0 : this.currentHp;
            this.lifeNumbers.string = currentHpToShow + "/" + this.maxHp;
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

    move: function () {
        if (!this.isDead() && !this.usingSkill) {
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

    isSkill2Active: function () {
        if (!this.skill2DurationBar)
            return false;

        return this.skill2DurationBar.progress > 0;
    },

    attack: function () {
        var randomNumber;

        if (!this.isDead() && !this.usingSkill) {
            if (!this.isSkill2Active() || this.skill2AttackCounter < SKILL_2_ATTACKS - 1) {
                if (this.isSkill2Active())
                    this.skill2AttackCounter++; 

                randomNumber = Math.round(Math.random() * (this.attackAnimationNames.length - 1));
                this.playAnimation(this.attackAnimationNames[randomNumber]);
            }
            else {
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

        if (!this.isDead() && !this.usingSkill) {
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
                    this.refreshKillCount();
                }
            }
        }
    },

    causeNormalDamage: function () {
        this.causeDamage(this.calcBaseDamage());
    },

    causeSkill1Damage: function () {
        this.causeDamage(this.calcBaseDamage() * SKILL_1_DAMAGE_MULTIPLIER);
    },

    causeSkill2Damage: function () {
        this.causeDamage(this.calcBaseDamage() + SKILL_2_BONUS_DAMAGE);
    },

    refreshKillCount: function () {
        this.killCount++;

        if (this.killCounter)
            this.killCounter.string = this.killCount;
    },

    endAttack: function () {
        var haveTarget = false;

        this.usingSkill = false;

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
    
    updateSkill2DurationCooldownBar: function (target) {
        if (this.skill2DurationBar.progress > 0) {
            this.skill2DurationCooldown();
            this.skill2DurationBar.progress -= COOLDOWN_BAR_UPDATE_TIME / SKILL_2_DURATION_SECONDS;
        }
    },

    skill2DurationCooldown: function () {
        var wait = new cc.delayTime(COOLDOWN_BAR_UPDATE_TIME),
            updateBar = new cc.callFunc(this.updateSkill2DurationCooldownBar, this),
            seq = new cc.Sequence(wait, updateBar);

            this.skill2DurationBar.node.runAction(seq);
    },

    endCharge: function () {
        this.skill2AttackCounter = 0;
        this.skill2DurationBar.progress = 1;
        this.skill2DurationCooldown();
        this.endAttack();
    },

    getSkillButton: function (index) {
        return this.skillCooldownBars[index].getComponentInChildren(cc.Button);
    },

    updateSkillCooldownBar: function (target, index) {
        if (this.skillCooldownBars[index].progress > 0) {
            this.skillCooldown(index);
            this.skillCooldownBars[index].progress -= COOLDOWN_BAR_UPDATE_TIME / SKILLS_COOLDOWN_SECONDS[index];
        } else {
            this.getSkillButton(index).interactable = true;
        }
    },

    skillCooldown: function (index) {
        var wait = new cc.delayTime(COOLDOWN_BAR_UPDATE_TIME),
            updateBar = new cc.callFunc(this.updateSkillCooldownBar, this, index),
            seq = new cc.Sequence(wait, updateBar);

            this.skillCooldownBars[index].node.runAction(seq);
    },

    skill: function (event, index) {
        if (!this.isDead() && !this.usingSkill && this.skillCooldownBars[index].progress <= 0) {
            this.usingSkill = true;
            this.node.stopAllActions();

            if (index == 0)
                this.playAnimation(AnimationName.SPECIAL_B);
            else if (index == 1)
                this.playAnimation(AnimationName.CHARGING);

            this.getSkillButton(index).interactable = false;
            this.skillCooldownBars[index].progress = 1;
            this.skillCooldown(index);
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