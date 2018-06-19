cc.Class({
    extends: cc.Component,

    properties: {
        particles: {
            default: null,
            visible: true,
            type: cc.Node
        },

        circle: {
            default: null,
            visible: true,
            type: cc.Node
        }
    },

    onLoad: function () {
        //
    },

    getParticles: function () {
        return this.particles.getComponent(cc.ParticleSystem);
    },

    hide: function () {
        this.circle.opacity = 0;
        this.getParticles().stopSystem();
    },

    show: function () {
        this.circle.opacity = 192;
        this.getParticles().resetSystem();
    }
});