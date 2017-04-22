cc.Class({
    extends: cc.Component,

    properties: {
        level: 0,

        selectorLevel: {
            default: null,
            type: cc.Label
        },

		coooldownTime: {
            default: 0,
            visible: false
        }
    },

    onLoad: function () {
        this.setCooldownBarEndEvent();
        this.updateButtonState();
		this.coooldownTime = this.getCooldownBar().durationSeconds;
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
        this.getCooldownBar().setProgress(0);
    },

    updateLevelLabel: function () {
        this.selectorLevel.string = (this.level + 1);
    },

    upgrade: function () {
        this.level += 1;
        //this.getCooldownBar().durationSeconds = this.coooldownTime - 10 * Math.log10(this.level);
        this.updateButtonState();
        this.updateLevelLabel();
    },

    cooldownStart: function () {
        this.getSkillButton().interactable = false;
        this.getCooldownBar().startBar();
    },

    setButtonEnabled: function (enable) {
        this.getSkillButton().enabled = enable;
    }
});