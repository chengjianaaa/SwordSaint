var CollisionTag = cc.Enum({
    BODY: 0,
    DAMAGE_AREA: 1
});

cc.Class({
    extends: cc.Component,

    properties: {
        movementSpeed: 0,
        facingLeft: true,
        targets: [],

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
            waitAttackEnd = new cc.delayTime(0.30),
            funcAttackAgainOrMove = new cc.callFunc(this.attackAgainOrMove, this);

        manager.enabled = true;
        manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;

        this.attackSequence = new cc.Sequence(funcStop, waitAttackSpeed, funcAttack, waitAttackEnd, funcAttackAgainOrMove);

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

    stop: function () {
        this.getComponent(cc.Animation).play('Stopped');

        if (this.moveForward && this.moveForward.getTarget() === this.node)
            this.node.stopAction(this.moveForward);
    },

    move: function () {
        this.getComponent(cc.Animation).play('Walking');

        if (this.attackSequence && this.attackSequence.getTarget() === this.node)
            this.node.stopAction(this.attackSequence);

        this.createMoveForwardAction();
        this.node.runAction(this.moveForward).repeatForever();
    },

    attack: function () {
        this.getComponent(cc.Animation).play('AttackA');
    },

    beginAttack: function () {
        this.node.runAction(this.attackSequence);
    },

    attackAgainOrMove: function () {
        if (this.targets.length > 0)
            this.beginAttack();
        else
            this.move();
    },

    causeDamage: function () {
        var t,
            target;

        for (t in this.targets) {
            target = this.targets[t];

            target.destroy();
            this.targets.splice(this.targets.indexOf(target), 1);
        }
    },

    // Collision callback
    onCollisionEnter: function (other, self) {
        if (self.tag === CollisionTag.DAMAGE_AREA && other.tag === CollisionTag.BODY) {
            this.targets.push(other.node);
            this.beginAttack();
        }
    },

    onCollisionExit: function (other, self) {
        var pos;

        if (self.tag === CollisionTag.DAMAGE_AREA && other.tag === CollisionTag.BODY) {
            pos = this.targets.indexOf(other.node);

            if (pos >= 0)
                this.targets.splice(pos, 1);
        }
    }
});
