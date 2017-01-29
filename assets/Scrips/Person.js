var AnimationName = cc.Enum({
    STOPPED: 'Stopped',
    WALKING: 'Walking',
    ATTACK_A: 'AttackA',
    FALLING: 'Falling'
});

var collisionTag = require("CollisionTag");

cc.Class({
    extends: cc.Component,

    properties: {
        //attributes
        hp: 100,
        attackDamage: 10,

        movementSpeed: 0,
        facingLeft: true,
        targets: [],
        animationState: null,

        damageNumber: {
            default: null,
            type: cc.Prefab
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
        }
    },

    onLoad: function () {
        var manager = cc.director.getCollisionManager(),
            funcStop = new cc.callFunc(this.stop, this),
            funcAttack = new cc.callFunc(this.attack, this),
            waitAttackSpeed = new cc.delayTime(0.70),
            waitAttackEnd = new cc.delayTime(0.30);

        manager.enabled = true;
        manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;

        this.attackSequence = new cc.Sequence(funcStop, waitAttackSpeed, funcAttack, waitAttackEnd);

        this.setFacingLeft(this.facingLeft);
        this.move();
    },

    update: function (dt) {
        //
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

    isFalling: function () {
        return this.animationState && this.animationState.name === AnimationName.FALLING;
    },

    stop: function () {
        if (!this.isFalling()) {
            this.animationState = this.getComponent(cc.Animation).play(AnimationName.STOPPED);

            if (this.moveForward && this.moveForward.getTarget() === this.node)
                this.node.stopAction(this.moveForward);
        }
    },

    move: function () {
        if (!this.isFalling()) {
            this.animationState = this.getComponent(cc.Animation).play(AnimationName.WALKING);

            if (this.attackSequence && this.attackSequence.getTarget() === this.node)
                this.node.stopAction(this.attackSequence);

            this.node.runAction(this.moveForward).repeatForever();
        }
    },

    fall: function () {
        this.node.stopAllActions();
        this.animationState = this.getComponent(cc.Animation).play(AnimationName.FALLING);
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
        if (!this.isFalling())
            this.animationState = this.getComponent(cc.Animation).play(AnimationName.ATTACK_A);
    },

    beginAttack: function (targetPerson) {
        if (!this.isFalling()) {
            this.targets.push(targetPerson);
            this.node.runAction(this.attackSequence).repeatForever();
        }
    },

    receiveDamage: function (dmg) {
        var num = cc.instantiate(this.damageNumber);

        this.node.parent.addChild(num);
        num.setPositionX(this.node.getPositionX() + (dmg >= 10 ? 0 : 45));
        num.setPositionY(this.node.getPositionY());

        this.hp = this.hp - dmg;
        num.getComponent('DamageNumber').show(dmg);

        if (this.hp <= 0) {
            this.fall();
        }
    },

    isDead: function () {
        return this.hp <= 0;
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