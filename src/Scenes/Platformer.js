class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 300;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 20;
        this.SCALE = 1.75;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        var winImage = this.add.sprite(1900, 100, "winner");
        winImage.setVisible(false);
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Finished: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.win = this.map.createFromObjects("Objects", {
            name: "win",
            key: "tilemap_sheet",
        });

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
        });

        this.death = this.map.createFromObjects("Objects", {
            name: "death",
            key: "tilemap_sheet",
            frame: 157
        })

        this.water = this.map.createFromObjects("Objects", {
            name: "water",
            key: "tilemap_sheet",
        });

        this.anims.create({
            key: 'coinAnimation',
            frames: [
                { key: 'tilemap_sheet', frame: 151 },
                { key: 'tilemap_sheet', frame: 152 }
            ],
            frameRate: 5,
            repeat: -1 // Infinitely
        });

        this.anims.create({
            key: 'winAnimation',
            frames: [
                { key: 'tilemap_sheet', frame: 111 },
                { key: 'tilemap_sheet', frame: 112 }
            ],
            frameRate: 9,
            repeat: -1 // Infinitely
        });

        this.anims.create({
            key: 'waterAnimation',
            frames: [
                { key: 'tilemap_sheet', frame: 33 },
                { key: 'tilemap_sheet', frame: 53 }
            ],
            frameRate: 3,
            repeat: -1 // Infinitely
        });

        this.anims.create({
            key: 'messageAnimation',
            frames: [
                { key: 'win1' },
                { key: 'win2' }
            ],
            frameRate: 5,
            repeat: -1 // Infinitely
        });
        
        // Apply the animation to all coins
        this.coins.forEach(coin => {
            coin.anims.play('coinAnimation');
        });

        this.water.forEach(water => {
            water.anims.play('waterAnimation');
        });

        this.win.forEach(win => {
            win.anims.play('winAnimation');
        });

        // Finished: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.death, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.win, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.deathGroup = this.add.group(this.death);
        this.winGroup = this.add.group(this.win);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(75, 125, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Finished: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });
        
        this.physics.add.overlap(my.sprite.player, this.deathGroup, (player, object) => {
            this.scene.restart();
        });

        this.physics.add.overlap(my.sprite.player, this.winGroup, (player, object) => {
            winImage.setVisible(true);
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_01.png', 'circle_02.png', 'circle_03.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.005, end: 0.015},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            maxAliveParticles: 8,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
            gravityY: -400,
        });

        my.vfx.walking.stop();

        // Jump particles
        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['scorch_01.png', 'scorch_02.png', 'scorch_03.png'],
            random: true,
            scale: {start: 0.1, end: 0.1},
            maxAliveParticles: 8,
            alpha: {start: 1, end: 0.1}, 
            gravityY: -400,
        });

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        my.vfx.jump.stop();

        // Finished: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 5, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.jumpSound = this.sound.add("jumpSound");
    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // Finished: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // Finished: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // Finished: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        else {
            my.vfx.jump.stop();
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.anims.play('jump');
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jump.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.jump.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            this.jumpSound.play();
        }

    }
}