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

/*
skill sasameyuki  -> 0:33 = 0,55
attack animation  -> 0:36 = 0,60

3hits skill = 1,65
attack wait + attack animation = 1,9 + 0,6 = 2,5
*/

var DAMAGE_UNIT = 1;
var ATTACK_SPEED_WAIT = 1.90;
var HP_MULTIPLIER = 12;
var SKILL_1_INIT_DAMAGE = 6;
var SKILL_1_DAMAGE_PER_LEVEL = 1;
var SKILL_2_INIT_DAMAGE = 1;
var SKILL_2_DAMAGE_PER_LEVEL = 1;
var SKILL_3_INIT_DURATION = 7.50;
var SKILL_3_DURATION_PER_LEVEL = 2.50;

var collisionTag = require("CollisionTag");
var attr = require("Attributes");
var skill = require("Skill");

cc.Class({
    extends: cc.Component,

    properties: {
        //attributes
        lif: 1,
        atk: 1,
        sta: 1,

        level: 0,
        currentXp: 0,

        movementSpeed: 0,
        facingLeft: true,
        targets: [],
        skillBeingUsed: -1,

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

        specialBar: {
            default: null,
            type: cc.ProgressBar
        },

        killCounter: {
            default: null,
            type: cc.Label
        },

        skill2DurationBar: {
            default: null,
            type: cc.ProgressBar
        },

        skill3DurationBar: {
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

        currentSp: {
            default: 100,
            visible: false
        },

        maxSp: {
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

        killer: {
            default: null,
            visible: false,
            type: cc.Node
        },

        shadow: {
            default: null,
            visible: true,
            type: cc.Node
        }
    },

    onLoad: function () {
        this.fillAttackAnimationNamesList();
        this.enableCollisions();
        this.setFacingLeft(this.facingLeft);

        this.createHideShadowEvent();

        if (!this.facingLeft) {
            this.lif = attr.lif;
            this.atk = attr.atk;
            this.sta = attr.sta;
        }

        this.setMaxHp();
        this.setHp(this.maxHp);

        this.setMaxSp();
        this.setSp(this.maxSp);

        this.levelUp();

        this.move();
    },

    update: function (dt) {
        //
    },

    getSkill2DurationBar: function () {
        return this.skill2DurationBar.node.getComponent('TimedProgressBar');
    },

    getSkill3DurationBar: function () {
        return this.skill3DurationBar.node.getComponent('TimedProgressBar');
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

    getShadow: function () {
        return this.shadow.getComponent('Shadow');
    },

    createHideShadowEvent: function () {
        var bar;

        if (this.skill3DurationBar) {
            bar = this.getSkill3DurationBar();
            bar.shdw = this.getShadow();

            bar.onBarEnd = function () {
                this.shdw.hide();
            }

        }
    },

    getLifeBar: function () {
        return this.getNumberedProgressBar(this.lifeBar);
    },

    setMaxHp: function () {
        this.maxHp = this.lif * DAMAGE_UNIT * HP_MULTIPLIER;
        this.getLifeBar().maxValue = this.maxHp;
    },

    setHp: function (value) {
        var trueValue = value;

        if (value < 0)
            trueValue = 0;

        if (value > this.maxHp)
            trueValue = this.maxHp;

        this.currentHp = trueValue;
        this.getLifeBar().setProgress(trueValue);
    },

    getSpecialBar: function () {
        return this.getNumberedProgressBar(this.specialBar);
    },

    setMaxSp: function () {
        this.maxSp = this.sta * skill.SKILL_COST;

        if (this.specialBar) // remove this 'if' when all persons have their skill bar
            this.getSpecialBar().maxValue = this.maxSp;
    },

    getSkillList: function () {
        return this.skillList.getComponent('SkillList');
    },

    setSp: function (value) {
        var trueValue = value;

        if (value < 0)
            trueValue = 0;

        if (value > this.maxSp)
            trueValue = this.maxSp;

        this.currentSp = trueValue;

        if (this.skillList)
            this.getSkillList().updateSkillsState(this.currentSp);

        if (this.specialBar) // remove this 'if' when all persons have their skill bar
            this.getSpecialBar().setProgress(trueValue);
    },

    getNumberedProgressBar: function (progressBar) {
        return progressBar.node.getComponent('NumberedProgressBar');
    },

    calcXpToNextLevel: function (lvl) {
        /*if (lvl <= 1)
            return 1;

        return lvl + this.calcXpToNextLevel(lvl - 1);*/
        return lvl;
    },

    getBackground: function () {
        return this.node.parent.getComponent('Background');
    },

    calcSkill1Damage: function(level) {
        return SKILL_1_INIT_DAMAGE + level * SKILL_1_DAMAGE_PER_LEVEL;
    },

    calcSkill2BonusDamage: function(level) {
        return SKILL_2_INIT_DAMAGE + level * SKILL_2_DAMAGE_PER_LEVEL;
    },

    calcSkill3Duration: function(level) {
        return SKILL_3_INIT_DURATION + level * SKILL_3_DURATION_PER_LEVEL;
    },

    getSkillDescriptionValue: function (i) {
        if (i == 0)
            return this.calcSkill1Damage(this.getSkillLevel(0) + 1);
        if (i == 1)
            return this.calcSkill2BonusDamage(this.getSkillLevel(1) + 1);
        if (i == 2)
            return this.calcSkill3Duration(this.getSkillLevel(2) + 1);

        return "NOT A NUMBER!";
    },

    levelUp: function () {
        var i;

        if (this.xpBar) {
            this.setHp(this.maxHp);
            this.setSp(this.maxSp);
            this.level++;
            this.levelLabel.string = this.level;

            this.getNumberedProgressBar(this.xpBar).maxValue = this.calcXpToNextLevel(this.level);
            this.getNumberedProgressBar(this.xpBar).setProgress(0);
            this.currentXp = 0;

            for (i in this.getSkillList().skills) {
                this.getSkillList().getSkill(i).changeDescriptionLabel(this.getSkillDescriptionValue(i));
            }

            this.getBackground().showSkillSelector();
        }
    },

    isDead: function () {
        return this.currentHp <= 0;
    },

    playAnimation: function (name) {
        var i;

        this.getComponent(cc.Animation).play(name);
        if (this.shadow)
            this.getShadow().playAnimation(name);
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

            this.node.runAction(this.moveForward.repeatForever());
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
        this.setSp(this.maxSp);
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

    isSkill3Active: function () {
        if (!this.skill3DurationBar)
            return false;

        return this.skill3DurationBar.progress > 0;
    },

    attack: function () {
        var randomNumber;

        if (!this.isDead() && !this.isUsingSkill()) {
            if (!this.isSkill2Active()) {
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
            targetUsingSkill4;

        if (!this.isDead() && !this.isUsingSkill()) {
            funcStop = new cc.callFunc(this.stop, this);

            funcAttack = new cc.callFunc(this.attack, this);
            waitAttackSpeed = new cc.delayTime(ATTACK_SPEED_WAIT);

            this.attackSequence = new cc.Sequence(funcStop, waitAttackSpeed, funcAttack);

            this.node.runAction(this.attackSequence);
        }
    },

    receiveDamage: function (dmg) {
        var num = cc.instantiate(this.damageNumber);
        var numValue = dmg;

        this.node.parent.addChild(num);
        num.setPositionX(this.node.getPositionX() + (this.facingLeft ? -30 : 0));
        num.setPositionY(this.node.getPositionY());

        if (this.skill3DurationBar && this.getSkill3DurationBar().getProgress() > 0)
            numValue = "MISS";
        else
            this.setHp(this.currentHp - dmg);

        num.getComponent('DamageNumber').show(numValue);

        if (this.currentHp <= 0)
            this.fall();
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

    getSkillLevel: function (skill) {
            return this.getSkillList().getSkill(skill).level;
    },

    causeSkill1Damage: function () {
        this.causeDamage(this.calcSkill1Damage(this.getSkillLevel(0)));
    },

    causeSkill2Damage: function () {
        this.causeDamage(this.calcBaseDamage() + this.calcSkill2BonusDamage(this.getSkillLevel(1)));
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
            this.getSkill2DurationBar().startBar();
        } else if (this.skillBeingUsed == 2) {
            this.getSkill3DurationBar().startBar(this.calcSkill3Duration(this.getSkillLevel(2)));
        }

        this.endAttack();
    },

    skill: function (event, index) {
        if (!this.isDead() && !this.isUsingSkill()) {
            this.skillBeingUsed = index;
            this.node.stopAllActions();

            if (index == 0)
                this.playAnimation(AnimationName.SPECIAL_B);
            else if (index == 1)
                this.playAnimation(AnimationName.CHARGING);
            else if (index == 2) {
                this.playAnimation(AnimationName.CHARGING);

                if (this.shadow)
                    this.getShadow().show();
            }

            this.setSp(this.currentSp - skill.SKILL_COST);
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