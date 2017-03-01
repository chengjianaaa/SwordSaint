cc.Class({
    extends: cc.Component,

    properties: {
        //
    },

    // use this for initialization
    onLoad: function () {
        this.node.opacity = 0;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
        //
    // },

    show: function (value) {
        var moveUp = new cc.MoveBy(0.75, cc.p(0, 136)).easing(cc.easeOut(3.0)),
            disappear = new cc.fadeOut(0.75).easing(cc.easeIn(3.0)),
            sp = new cc.Spawn(moveUp, disappear);

        this.node.getComponent(cc.Label).string = Math.round(Math.abs(value));
        this.node.opacity = 255;

        if (value < 0)
            this.node.color = new cc.Color(0, 255, 0);

        this.node.runAction(sp);
    }
});