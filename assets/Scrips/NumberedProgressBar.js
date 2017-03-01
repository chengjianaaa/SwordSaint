cc.Class({
    extends: cc.Component,

    properties: {
        maxValue: 1
    },

    setProgress: function (value) {
        value = value > 0 ? value : 0;
        this.node.getComponent(cc.ProgressBar).progress = value / this.maxValue;
        this.getComponentInChildren(cc.Label).string = Math.round(value) + "/" + this.maxValue;
    }
});