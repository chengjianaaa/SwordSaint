cc.Class({
    extends: cc.Component,

    properties: {
        target: {
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        //
    },

    update: function (dt) {
        var canvas = this.node.parent,
            targetPos = this.target.x + this.target.width/2;

        //go back to beginning if reaches end
        if (targetPos >= this.node.width - canvas.width/2) 
            this.target.x = canvas.width/2 - this.target.width/2;

        if (targetPos > canvas.width/2 && targetPos < this.node.width - canvas.width/2)
            this.node.x = -targetPos;
    },
});
