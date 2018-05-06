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

    updateSkillsState: function (sp) {
        var i;

        for (i in this.skills) {
            this.getSkill(i).updateSkillState(sp);
        }
    },

    setSkillButtonsPaused: function (paused) {
        var i;

        for (i in this.skills) {
            this.getSkill(i).setSkillButtonPaused(paused);
        }
    }
});