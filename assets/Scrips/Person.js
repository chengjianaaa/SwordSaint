var AnimationName = cc.Enum({
    STOPPED: 'Stopped',
    WALKING: 'Walking',
    ATTACK_A: 'AttackA',
    ATTACK_B: 'AttackB',
    FALLING: 'Falling'
});

var collisionTag = require("CollisionTag");

cc.Class({
    extends: cc.Component,

    properties: {
        //attributes
        maxHp: 100,
        attackDamage: 10,

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

        attackAnimationNames: {
            default: [],
            visible: false
        }
    },

    onLoad: function () {
        this.currentHp = this.maxHp;
        this.fillAttackAnimationNamesList();
        this.enableCollisions();
        this.createAttackSequence();
        this.setFacingLeft(this.facingLeft);
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

    createAttackSequence: function () {
        var funcStop = new cc.callFunc(this.stop, this),
            funcAttack = new cc.callFunc(this.attack, this),
            waitAttackSpeed = new cc.delayTime(0.70),
            waitAttackEnd = new cc.delayTime(0.30);

        this.attackSequence = new cc.Sequence(funcStop, waitAttackSpeed, funcAttack, waitAttackEnd);
    },

    setFacingLeft: function (value) {
        this.facingLeft = value;

        this.stop();
        this.createMoveForwardAction();

        this.node.runAction(new cc.flipX(!value));
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

    beginAttack: function (targetPerson) {
        if (!this.isDead()) {
            this.targets.push(targetPerson);
            this.node.runAction(this.attackSequence).repeatForever();
        }
    },

    receiveDamage: function (dmg) {
        var num = cc.instantiate(this.damageNumber);

        this.node.parent.addChild(num);
        num.setPositionX(this.node.getPositionX() + (dmg >= 10 ? 0 : 45));
        num.setPositionY(this.node.getPositionY());

        this.currentHp = this.currentHp - dmg;
        num.getComponent('DamageNumber').show(dmg);

        this.lifeBar.progress = this.currentHp / this.maxHp;

        if (this.currentHp <= 0) {
            this.fall();
        }
    },

    causeDamage: function () {
        var t,
            target;

        for (t in this.targets) {
            target = this.targets[t];
            
            target.receiveDamage(this.attackDamage);
            
            if (target.isDead()) {
                this.targets.splice(this.targets.indexOf(target), 1);
            }
        }
    },

    endAttack: function () {
        if (this.targets.length === 0) {
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
        if (self.tag === collisionTag.DAMAGE_AREA && other.tag === collisionTag.BODY)
            this.beginAttack(other.node.getComponent('Person'));
    }
});