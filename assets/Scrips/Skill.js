cc.Class({
    extends: cc.Component,

    properties: {
        level: 0,
		cost: 0,

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
        this.getSkillButton().interactable = sp >= this.cost;
    },

	setSkillButtonPaused: function (paused) {
		this.getSkillButton().enabled = !paused;
	}
});