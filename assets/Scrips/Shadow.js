var Visibility = cc.Enum({
    INVISIBLE: 0,
    SHOWING: 1,
    VISIBLE: 2,
    HIDING: 3
});

var SHADOW_OPACTY = 64;

cc.Class({
    extends: cc.Component,

    properties: {
        shadows: {
            default: [],
            visible: true,
            type: [cc.Node]
        },

        visibility: {
            default: 0,
            visible: false,
        }
    },

    onLoad: function () {
        this.createActions();
    },

    createHideAction: function () {
        var moveBy,
            fadeOut,
            spawn,
            func1,
            func2;

        moveBy = new cc.MoveBy(1.27, cc.p(30 * (i==0?-1:1), 0));
        fadeOut = new cc.FadeOut(0.25);
        spawn = new cc.spawn(moveBy, fadeOut);

        func1 = new cc.callFunc(function () { this.visibility = Visibility.HIDING; }, this);
        func2 = new cc.callFunc(function () { this.visibility = Visibility.INVISIBLE; }, this);

        return new cc.Sequence(func1, spawn, func2);
    },

    createShowAction: function () {
        var moveTo,
            moveBy,
            fadeTo,
            spawn,
            func1,
            func2;

        moveTo = new cc.MoveTo(0, cc.p(this.x, 0));

        moveBy = new cc.MoveBy(1.27, cc.p(30 * (i==0?1:-1), 0));
        fadeTo = new cc.FadeTo(1.27, SHADOW_OPACTY);
        spawn = cc.spawn(moveBy, fadeTo);

        func1 = new cc.callFunc(function () { this.visibility = Visibility.SHOWING; }, this);
        func2 = new cc.callFunc(function () { this.visibility = Visibility.VISIBLE; }, this);

        return new cc.Sequence(func1, moveTo, spawn, func2);
    },

    createActions: function () {
        var spawn;

        for (i in this.shadows) {
            this.shadows[i].hideAction = this.createHideAction();
            this.shadows[i].showAction = this.createShowAction();
        }
    },

    hide: function () {
        for (i in this.shadows) {
            if (this.visibility == Visibility.SHOWING)
                break;

            this.shadows[i].runAction(this.shadows[i].hideAction);
        }
    },

    show: function () {
        for (i in this.shadows) {
            this.shadows[i].stopAllActions();
            this.shadows[i].runAction(this.shadows[i].showAction);
        }
    },

    playAnimation: function (animationName) {
        for (i in this.shadows) 
            this.shadows[i].getComponent(cc.Animation).play(animationName);
    }
});