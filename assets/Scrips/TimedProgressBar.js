var COOLDOWN_BAR_UPDATE_TIME = 0.1;

cc.Class({
    extends: cc.Component,

    properties: {
        durationSeconds: 1
    },

    setProgress: function (value) {
        this.node.getComponent(cc.ProgressBar).progress = value;
    },

    getProgress: function () {
        return this.node.getComponent(cc.ProgressBar).progress;
    },

    onBarEnd: function (self) {
        //Event: override it
    },

    updateBar: function () {
        var wait,
            updateBarFunc,
            seq ;

        if (this.getProgress() > 0) {
            this.setProgress(this.getProgress() - COOLDOWN_BAR_UPDATE_TIME / this.durationSeconds);
            
            wait = new cc.delayTime(COOLDOWN_BAR_UPDATE_TIME);
            updateBarFunc = new cc.callFunc(this.updateBar, this);
            seq = new cc.Sequence(wait, updateBarFunc);

            this.node.runAction(seq);
        } else {
            this.setProgress(0);
            this.onBarEnd(this);
        }
    },

    startBar: function (duration) {
        if (duration)
            this.durationSeconds = duration;

        this.setProgress(1);
        this.updateBar();
    }
});