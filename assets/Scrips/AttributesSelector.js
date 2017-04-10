var attr = require("Attributes");

cc.Class({
    extends: cc.Component,

    properties: {
        points: 4,

        lifLabel: {
            default: null,
            type: cc.Label
        },

        atkLabel: {
            default: null,
            type: cc.Label
        },

        staLabel: {
            default: null,
            type: cc.Label
        },

        spdLabel: {
            default: null,
            type: cc.Label
        },

        remainingPointsLabel: {
            default: null,
            type: cc.Label
        }
    },

    // use this for initialization
    onLoad: function () {
        this.setLif(attr.lif);
        this.setAtk(attr.atk);
        this.setSta(attr.sta);
        this.setSpd(attr.spd);
    },

    setLif: function (val) {
        attr.lif = val;
        this.lifLabel.string = val;
    },

    setAtk: function (val) {
        attr.atk = val;
        this.atkLabel.string = val;
    },

    setSta: function (val) {
        attr.sta = val;
        this.staLabel.string = val;
    },

    setSpd: function (val) {
        attr.spd = val;
        this.spdLabel.string = val;
    },

    setPoints: function (val) {
        this.points = val;
        this.remainingPointsLabel.string = val;
    },

    incrementLif: function () {
        if (this.points > 0) {
            this.setLif(attr.lif + 1);
            this.setPoints(this.points - 1);
        }
    },

    incrementAtk: function () {
        if (this.points > 0) {
            this.setAtk(attr.atk + 1);
            this.setPoints(this.points - 1);
        }
    },

    incrementSta: function () {
        if (this.points > 0) {
            this.setSta(attr.sta + 1);
            this.setPoints(this.points - 1);
        }
    },

    incrementSpd: function () {
        if (this.points > 0) {
            this.setSpd(attr.spd + 1);
            this.setPoints(this.points - 1);
        }
    },

    decrementLif: function () {
        if (attr.lif > 1) {
            this.setLif(attr.lif - 1);
            this.setPoints(this.points + 1);
        }
    },

    decrementAtk: function () {
        if (attr.atk > 1) {
            this.setAtk(attr.atk - 1);
            this.setPoints(this.points + 1);
        }
    },

    decrementSta: function () {
        if (attr.sta > 1) {
            this.setSta(attr.sta - 1);
            this.setPoints(this.points + 1);
        }
    },

    decrementSpd: function () {
        if (attr.spd > 1) {
            this.setSpd(attr.spd - 1);
            this.setPoints(this.points + 1);
        }
    },

    startGame: function () {
        cc.director.loadScene("Battle");
    }
});
