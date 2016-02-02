SECTOR_TAU.Play = function(game) {
};

SECTOR_TAU.Play.prototype = {
    create: function() {
        this.game.input.gamepad.start();
        this.pad = this.game.input.gamepad.pad1;

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.time.desiredFps = 60;

        this.game.stage.backgroundColor = '#000';

        var ww = this.world.width;
        var wh = this.world.height;
        var hww = ww / 2;
        var hwh = wh / 2;

        this.player = this.createPlayer(hww, wh - 64, 'player1');

        var numGrumpies = 8;
        var spacing = 64;
        var margin = -(numGrumpies * spacing);
        var i;
        this.grumpies = this.game.add.group();
        for (i = 0; i < numGrumpies; ++i) {
            this.grumpies.add(
                this.createGrumpy1(margin + i * spacing, 48)
            );
        }

        this.score = 0;
        this.scoreText = this.game.add.text(
            ww, 0,
            '0',
            { fill: '#fff', fontSize: 16 }
        );
        this.scoreText.anchor.set(1, 0);
        this.scoreText.shown = 0;

        this.game.time.events.loop(
            Phaser.Timer.SECOND * 0.08, this.damageAlphaToggle, this
        );
    },

    createPlayer: function(x, y, id) {
        var obj = this.game.add.sprite(x, y, 'sprites');
        obj.animations.add('left', [id + 'Left']);
        obj.animations.add('main', [id]);
        obj.animations.add('right', [id + 'Right']);
        obj.animations.play('main');
        this.initObject(obj, 3.0);
        obj.body.collideWorldBounds = true;
        obj.health = 10;
        obj.invuln = false;
        this.initShooter(obj, Phaser.Timer.SECOND * 0.4);
        obj.bullets = this.game.add.group();
        return obj;
    },

    setReloadTimer: function(obj) {
        this.game.time.events.add(obj.reloadTime, function() {
            obj.canShoot = true;
        });
    },

    createGrumpy: function(x, y, id, health) {
        var frames = [id + 'A', id + 'B'];
        var obj = this.createObject2(x, y, 3.0, frames);
        obj.moveState = -1;
        obj.health = health;
        obj.invuln = false;
        obj.events.onKilled.add(function() {
            this.score += 9;
        }, this);
        return obj;
    },

    createGrumpy1: function(x, y) {
        return this.createGrumpy(x, y, 'enemy1', 2, this.grumpy1Movement);
    },

    grumpy1Movement: function(obj, w, h) {
        var border = 20;
        var speed = 150;
        if (obj.moveState === 0) {
            if (obj.right + border >= w) {
                if (obj.bottom >= h / 2) {
                    obj.moveState = 4;
                    obj.body.velocity.set(0, -speed);
                    return;
                }
                obj.moveState = 1;
                obj.moveTarget = obj.y + obj.height;
                obj.body.velocity.set(0, speed);
            }
            return;
        }
        if (obj.moveState === 1) {
            if (obj.y >= obj.moveTarget) {
                obj.moveState = 2;
                obj.body.velocity.set(-speed, 0);
            }
            return;
        }
        if (obj.moveState === 2) {
            if (obj.left <= border) {
                if (obj.bottom >= h / 2) {
                    obj.moveState = 5;
                    obj.body.velocity.set(0, -speed);
                    return;
                }
                obj.moveState = 3;
                obj.moveTarget = obj.y + obj.height;
                obj.body.velocity.set(0, speed);
            }
            return;
        }
        if (obj.moveState === 3) {
            if (obj.y >= obj.moveTarget) {
                obj.moveState = 0;
                obj.body.velocity.set(speed, 0);
            }
            return;
        }
        if (obj.moveState === 4) {
            if (obj.top <= border) {
                obj.moveState = 2;
                obj.body.velocity.set(-speed, 0);
            }
            return;
        }
        if (obj.moveState === 5) {
            if (obj.top <= border) {
                obj.moveState = 0;
                obj.body.velocity.set(speed, 0);
            }
            return;
        }
        if (obj.moveState === -1) {
            obj.moveState = 0;
            obj.body.velocity.set(speed, 0);
            return;
        }
    },

    createBullet: function(x, y, dx, dy, id) {
        var obj = this.game.add.sprite(x, y, 'sprites', 'bullet' + id);
        this.initObject(obj, 3.0);
        obj.body.velocity.set(dx, dy);
        obj.checkWorldBounds = true;
        obj.outOfBoundsKill = true;
        return obj;
    },

    createObject1: function(x, y, scale, name) {
        var obj = this.game.add.sprite(x, y, 'sprites', name);
        this.initObject(obj, scale);
        return obj;
    },

    createObject2: function(x, y, scale, frames) {
        var obj = this.game.add.sprite(x, y, 'sprites');
        obj.animations.add('main', frames, 5, true);
        obj.animations.play('main');
        this.initObject(obj, scale);
        return obj;
    },

    initObject: function(obj, scale) {
        obj.smoothed = false;
        obj.scale.set(scale, scale);
        obj.anchor.set(0.5, 0.5);
        this.game.physics.enable(obj, Phaser.Physics.ARCADE);
    },

    initShooter: function(obj, reloadTime) {
        obj.reloadTime = reloadTime;
        obj.canShoot = false;
        this.setReloadTimer(obj);
    },

    update: function() {
        this.updatePlayer();
        this.game.physics.arcade.overlap(
            this.player.bullets, this.grumpies,
            function(bullet, grumpy) {
                bullet.kill();
                this.damageWrapper(grumpy, 1, Phaser.Timer.SECOND);
            },
            null,
            this
        );

        this.game.physics.arcade.overlap(
            this.player, this.grumpies,
            function(player, grumpy) {
                this.damageWrapper(player, 0.5, Phaser.Timer.SECOND);
            },
            null,
            this
        );

        var w = this.world.width;
        var h = this.world.height;
        this.grumpies.forEachAlive(function(grumpy) {
            this.grumpy1Movement(grumpy, w, h);
        }, this);

        if (this.scoreText.shown < this.score) {
            this.scoreText.shown += 1;
            this.scoreText.text = '' + this.scoreText.shown;
        }
    },

    updatePlayer: function() {
        var coef = 3000;
        var coefY = 2 / 3;
        var maxDX = 300;
        var maxDY = maxDX * coefY;
        var drag = 15;

        var stickX = this.pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X);
        var ax = coef * stickX;
        var ay =
            coef * coefY * this.pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y);
        var dragx = this.calculateDrag(this.player.body.velocity.x, drag);
        var dragy = this.calculateDrag(this.player.body.velocity.y, drag);
        this.player.body.acceleration.set(ax, ay);
        this.player.body.velocity.add(dragx, dragy);
        this.player.body.velocity.clampX(-maxDX, maxDX);
        this.player.body.velocity.clampY(-maxDY, maxDY);

        if (stickX < -0.5) {
            this.player.animations.play('left');
        }
        else if (stickX < 0.5) {
            this.player.animations.play('main');
        }
        else {
            this.player.animations.play('right');
        }

        if (this.player.canShoot) {
            if (this.pad.isDown(Phaser.Gamepad.XBOX360_A)) {
                this.playerShoot();
            }
        }
    },

    playerShoot: function() {
        var bulletX = this.player.x;
        var bulletY = this.player.top - 1;
        var bulletDY = -800;
        var ret = this.player.bullets.getFirstDead(false, bulletX, bulletY);
        if (ret === null) {
            this.player.bullets.add(
                this.createBullet(bulletX, bulletY, 0, bulletDY, 'Green')
            );
        }
        else {
            ret.body.velocity.set(0, bulletDY);
        }
        this.player.canShoot = false;
        this.setReloadTimer(this.player);
    },

    damageWrapper: function(obj, amt, invulnTime) {
        if (!obj.invuln) {
            obj.damage(amt);
            obj.invuln = true;
            this.game.time.events.add(invulnTime, function() {
                obj.invuln = false;
            }, this);
        }
    },

    // Calculates the drag for the given velocity component for the player
    calculateDrag: function(vc, drag) {
        var dragc = 0;
        if (vc > 0) {
            dragc = -(Math.min(vc, drag));
        }
        else if (vc < 0) {
            dragc = Math.min(-vc, drag);
        }
        return dragc;
    },

    damageAlphaToggle: function() {
        this.damageAlphaToggleOne(this.player);
        this.grumpies.forEachAlive(this.damageAlphaToggleOne, this);
    },

    damageAlphaToggleOne: function(obj) {
        if (obj.invuln && obj.alpha === 1) {
            obj.alpha = 0.3;
        }
        else {
            obj.alpha = 1;
        }
    }

    /*
    render: function() {
        this.game.debug.text(
            '' + this.tracking.moveState,
            3, 12,
            '#fff'
        );
    }
    // */
};
