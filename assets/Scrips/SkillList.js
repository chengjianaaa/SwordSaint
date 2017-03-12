cc.Class({
    extends: cc.Component,

    properties: {
        skills: {
            default: [],
            type: cc.Node
        }
    },

    onLoad: function () {
        //
    },

    getSkill: function (index) {
        return this.skills[index].getComponent('Skill');
    },

    resetCooldowns: function (index) {
        var i;

        for (i in this.skills) {
            this.getSkill(i).resetCooldown();
        }
    },

    setSkillButtonsEnabled: function (enable) {
        var i;

        for (i in this.skills) {
            this.getSkill(i).setButtonEnabled(enable);
        }
    }
});