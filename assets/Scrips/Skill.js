cc.Class({
    extends: cc.Component,

    properties: {
        level: 0,

        selectorLevel: {
            default: null,
            type: cc.Label
        }
    },

    onLoad: function () {
        this.setCooldownBarEndEvent();
        this.updateButtonState();
    },

    getCooldownBar: function() {
        return this.getComponentInChildren(cc.ProgressBar).getComponent('TimedProgressBar');
    },

    setCooldownBarEndEvent: function () {
        var that = this;

        this.getCooldownBar().onBarEnd =
            function (self) {
                that.getSkillButton().interactable = true;
            };
    },

    getSkillButton: function() {
        return this.getComponentInChildren(cc.Button);
    },

    updateButtonState: function () {
        this.getSkillButton().node.active = (this.level > 0);
    },

    resetCooldown: function () {
        this.startCountCooldown();
        this.getCooldownBar().setProgress(0);
    },

    updateLevelLabel: function () {
        this.selectorLevel.string = (this.level + 1);
    },

    upgrade: function () {
        this.level += 1;
        this.updateButtonState();
        this.updateLevelLabel();
    },

    setCooldownFromBeginning: function () {
        this.getSkillButton().interactable = false;
        this.getCooldownBar().setProgress(1);
    },

    startCountCooldown: function () {
        this.getCooldownBar().updateBar();
    },

    setButtonEnabled: function (enable) {
        this.getSkillButton().enabled = enable;
    }
});