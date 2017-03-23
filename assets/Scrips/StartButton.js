var attr = require("Attributes");

cc.Class({
    extends: cc.Component,

    properties: {
        //
    },

    // use this for initialization
    onLoad: function () {

    },

    startGame: function () {
		attr.lif = 1;
		attr.atk = 1;
		attr.def = 1;
		attr.spd = 1;
        cc.director.loadScene("Attributes");
    }
});