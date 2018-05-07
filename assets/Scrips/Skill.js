var value = cc.Enum({
    SKILL_COST: 10
});

module.exports = value;

cc.Class({
    extends: cc.Component,

    properties: {
        level: 0,
        descriptionLabelWithWildcard: {
            default: '',
            visible: false
        },

        selectorLevel: {
            default: null,
            type: cc.Label
        },

        descriptionLabel: {
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

    changeDescriptionLabel: function (newValue) {
		if (this.descriptionLabelWithWildcard == '')
			this.descriptionLabelWithWildcard = this.descriptionLabel.string;

        this.descriptionLabel.string = this.descriptionLabelWithWildcard.replace('?', newValue);
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