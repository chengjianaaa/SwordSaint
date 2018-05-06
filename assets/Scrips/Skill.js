var value = cc.Enum({
    SKILL_COST: 10
});

module.exports = value;

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
        this.updateButtonState();
    },

    getSkillButton: function() {
        return this.getComponent(cc.Button);
    },

    updateButtonState: function () {
        this.getSkillButton().node.active = (this.level > 0);
    },

    updateLevelLabel: function () {
        this.selectorLevel.string = (this.level + 1);
    },

    upgrade: function () {
        this.level += 1;
        this.updateButtonState();
        this.updateLevelLabel();
    },

    updateSkillState: function (sp) {
        this.getSkillButton().interactable = sp >= value.SKILL_COST;
    },

    setSkillButtonPaused: function (paused) {
        this.getSkillButton().enabled = !paused;
    }
});