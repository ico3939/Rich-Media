// A* Pathfinding for HTML5 Canvas Tutorial
// by Christer (McFunkypants) Kaitila
// http://www.mcfunkypants.com
// http://twitter.com/McFunkypants

/*Music and Sounds: Castlevania 1 composed by Kinuyo Yamashita; Konami 

Sprites: 

Dungeon floor: https://media.indiumgames.com/medialibrary/2014/07/MakingMap10.png 

Skull Ball: https://retrogamezone.co.uk/images/sprites/nes/Zelda2TheAdventureOfLinkSheet3.gif 

Arrow: https://s3.envato.com/files/171719892/weaponpackprev/2000x2000/arrow1b.png 

Adventurer: https://chimezombie.deviantart.com/art/Sprite-adventurer-male-563961466 

Torch: https://opengameart.org/sites/default/files/torchNew_1.png 

Spikes: https://opengameart.org/sites/default/files/stuff.png */

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
    //properties
    sound:undefined, //required-loaded by main.js
    soundEffects: undefined,
    myKeys: undefined, // required - loaded by main.js
    Emitter: undefined, // required - loaded by main.js
    pulsar: undefined,
    
    // the game's canvas element
    canvas: undefined,
    // the canvas 2d context
    ctx: undefined,
    
    GAME_STATE: Object.freeze({
        TITLE: 0,
        INTRO: 1,
        PLAY: 2,
        END: 3
    }),


    // size in the world in sprite tiles
    GAME_WORLD: Object.freeze({
        WORLD_WIDTH: 17,
        WORLD_HEIGHT: 17,
        POINTS_PER_TILE: 100
    }),
    

    // size of a tile in pixels
    TILE: Object.seal({
        TILE_WIDTH: 48,
        TILE_HEIGHT: 35,
        TYPE: 0, // -1 = path space, 0 = blank space, 1 = wall
    }),
    
    // the player rectangle
    PLAYER: Object.seal({
        x: undefined,
        y: undefined,
        width: 5,
        height: 5,
        isShielded: false,
        shieldUsedInLevel: false,
        shieldsRemaining: 3,
        livesRemaining: 3,
        currentFrame: 1,
        frameOffset: 0,
        pulsar: undefined
    }),
    
    // circle object
    CIRCLE: Object.seal({
        CIRCLE_RADIUS: 4,
        MAX_SPEED: 70, // pixels per second
        MIN_SPEED: 30,
        NUM_CIRCLES_START: 0,
        MAX_NUM_CIRCLES: 3
    }),
    
    // the hitbox for the arrow
    ARROW: Object.seal({
        initialX: undefined,
        initialY: undefined,
        x: undefined,
        y: undefined,
        width: 5,
        height:5,
        speed: 100, // pixels per second
        direction: null,
        isActive: false
    }),
    
    DIRECTIONS: Object.freeze({
        FACE_UP: 1,
        FACE_DOWN: 2,
        FACE_LEFT: 3,
        FACE_RIGHT: 4,
        FACE_UP_LEFT: 5,
        FACE_UP_RIGHT: 6,
        FACE_DOWN_LEFT: 7,
        FACE_DOWN_RIGHT: 8
    }),
    
    // an object for the shield the player can activate
    SHIELD: Object.seal({
        radius: 10,
        x: undefined,
        y: undefined
    }),
    
    circles: [],
    numCircles: this.NUM_CIRCLES_START,
    
    // the world grid: a 2d array of tiles
    world: [[]],
    wallProbability: 0.75,
    
    SPRITES: Object.freeze({
        BRICK_BACK_SPRITE: 0,
        BRICK_FRONT_SPRITE: 1,
        ADVENTURER_SPRITE: 2,
        TORCH_SPRITE: 3,
        SKULL_BALL_SPRITE: 4,
        ARROW_UP_SPRITE: 5,
        ARROW_DOWN_SPRITE: 6,
        ARROW_LEFT_SPRITE: 7,
        ARROW_RIGHT_SPRITE: 8,
        SPIKE_UP_SPRITE: 9,
        SPIKE_DOWN_SPRITE: 10,
        SPIKE_LEFT_SPRITE: 11,
        SPIKE_RIGHT_SPRITE: 12
    }),
    
    // image variables
    sprites: [
        document.getElementById("brick-back"),
        document.getElementById("brick-front"),
        document.getElementById("adventurer"),
        document.getElementById("torch"),
        document.getElementById("skull-ball"),
        document.getElementById("arrow-up"),
        document.getElementById("arrow-down"),
        document.getElementById("arrow-left"),
        document.getElementById("arrow-right"),
        document.getElementById("spike-up"),
        document.getElementById("spike-down"),
        document.getElementById("spike-left"),
        document.getElementById("spike-right")
    ],
    

    // start and end of path
    pathStart: undefined,
    pathEnd: undefined,
    currentPath: [],
    longestHall: [],
    
    // arrow behavior
    framesBetweenFire: 100,
    framesSinceFire: 0,
    
    // game variables
    totalScore: 0,
    roundScore: 0,
    maxRoundScore: 0,
    pointsPerFrame: 3,
    turnNum: 1,
    currentRange: 3, // determines how far away the next end point will be
    maxRange: 15,
    tillRangeIncrease: 2,
    levelsSinceUsingShield: 0,
    gameState: undefined,
    mouse: {
        x: 0,
        y: 0
    },
    prevMouse: undefined,
    cyclesUntilFrameAdvance: 15,
    currentCycle: 0,
    torchSpriteFrameIndex: 0,
    angleBetweenMousePoints: undefined, 
    paused: false,
    
    

    // the html page is ready
    init: function(){
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = this.GAME_WORLD.WORLD_WIDTH * this.TILE.TILE_WIDTH;
        this.canvas.height = this.TILE.TILE_HEIGHT + (this.GAME_WORLD.WORLD_HEIGHT * this.TILE.TILE_HEIGHT);
        this.canvas.onmousemove = this.doMousemove.bind(this);
        this.ctx = this.canvas.getContext("2d");
        simplePreload(this.sprites);
        
        //initialize pulsar
        var pulsar = new this.Emitter();
        pulsar.fill = "orange";
        pulsar.minXspeed = pulsar.minYspeed = 0;
        pulsar.maxXspeed = pulsar.maxYspeed = -0.5;
        pulsar.lifetime = 200;
        pulsar.expansionRate = 0.001;
        pulsar.numParticles = 10;
        pulsar.xRange = 5;
        pulsar.yRange = 10;
        pulsar.useCircles = false;
        pulsar.useSquares = true;
        pulsar.createParticles({x:-300,y:-300});
        this.PLAYER.pulsar = pulsar;
        
        this.soundEffects = this.sound.getEffects();
        this.gameState = this.GAME_STATE.TITLE;
        this.createWorld();
        this.update();
        
    },
    
        
    // resets the game after it ends
    reset: function(){
        this.roundScore = 0;
        this.totalScore = 0;
        this.turnNum = 1;
        this.currentRange = 3;
        this.PLAYER.shieldsRemaining = 3;
        this.levelsSinceUsingShield = 0;
        this.PLAYER.livesRemaining = 3;
        this.ARROW.isActive = false;
        this.ARROW.x = undefined;
        this.ARROW.y = undefined;
        this.ARROW.speed = 100;
        this.circles = [];
        this.gameState = this.GAME_STATE.TITLE;
        this.createWorld();
    },
    
    
    // fill the world with walls
    createWorld: function(){
        //console.log('Creating world...');
        var currentX = 0;
        var currentY = 0;

        // create emptiness
        for (var x=0; x < this.GAME_WORLD.WORLD_WIDTH; x++)
        {
            this.world[x] = [];
            
            currentY = 0;
            for (var y=0; y < this.GAME_WORLD.WORLD_HEIGHT; y++)
            {
                this.world[x][y] = {
                    tileX: currentX,
                    tileY: currentY,
                    tileWidth: this.TILE.TILE_WIDTH,
                    tileHeight: this.TILE.TILE_HEIGHT,
                    tileType: 0,
                    adjacentTiles: []
                };
                currentY += this.TILE.TILE_HEIGHT;
            }
            currentX += this.TILE.TILE_WIDTH;
        }
        
        // scatter some walls
        for (var x=0; x < this.GAME_WORLD.WORLD_WIDTH; x++)
        {
            for (var y=0; y < this.GAME_WORLD.WORLD_HEIGHT; y++)
            {
                
                if (Math.random() > this.wallProbability) {
                    if(x != Math.floor(this.GAME_WORLD.WORLD_WIDTH/2) || y != Math.floor(this.GAME_WORLD.WORLD_HEIGHT/2)) {
                        this.world[x][y].tileType = 1;
                    }
                }
            }
        }

        // calculate initial possible path
        this.currentPath = [];
        while (this.currentPath.length == 0)
        {
            //console.log(this.world[Math.floor(this.GAME_WORLD.WORLD_WIDTH/2)][Math.floor(this.GAME_WORLD.WORLD_HEIGHT/2)]);
            this.pathStart = this.world[Math.floor(this.GAME_WORLD.WORLD_WIDTH/2)][Math.floor(this.GAME_WORLD.WORLD_HEIGHT/2)]; // start in the center
            this.pathEnd = this.pathStart;
            if (this.pathStart.tileType == 0){
                this.currentPath = findPath(this.world,this.pathStart,this.pathEnd);
                //console.log(this.currentPath);
            }
        }

    },
    
    

    // the main game loop
    update: function(){
        
        this.animationID = requestAnimationFrame(this.update.bind(this));
        
        // if paused, break out of loop
        if(this.paused){
            this.drawPauseScreen(this.ctx);
            return;
        }
        
        // HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
        
        // check player and circle collisions
        if(this.gameState == this.GAME_STATE.PLAY){
            // move circles
            this.checkCircleCollision(dt);
            this.checkPlayerCollision();
        }
        
        // shield coordinates follow the player
        if(this.PLAYER.isShielded){
            this.SHIELD.x = this.PLAYER.x + (this.PLAYER.width/2);
            this.SHIELD.y = this.PLAYER.y + (this.PLAYER.height/2);
        }
        
        // fires an arrow
        if(this.ARROW.isActive == false && this.gameState == this.GAME_STATE.PLAY && this.ARROW.x != undefined && this.ARROW.y != undefined){
            this.framesSinceFire++;
            if(this.framesSinceFire > this.framesBetweenFire){
                this.sound.playEffect(this.soundEffects.ARROW_FIRE);
                this.ARROW.isActive = true;
                this.framesSinceFire = 0;
            }
        }
        
        // check arrow collisions
        if(this.ARROW.isActive && this.ARROW.x != undefined && this.ARROW.y != undefined){
            this.checkArrowCollisions(dt);
        }
        
        // count down points
        if(this.roundScore > 0){
            this.roundScore -= this.pointsPerFrame;
        }
        
        if(this.roundScore < 0){
                this.roundScore = 0;
        }
            
        
        // turn up the sound volume
        if(this.myKeys != undefined &&this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_UP] && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_SHIFT]){
            this.sound.raiseVolume();
        }
        
        // turn down the sound volume
        if(this.myKeys != undefined && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_DOWN] && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_SHIFT]){
            this.sound.lowerVolume();
        }
        
        
        // draw the game's canvas
        if(this.ctx != undefined){
            this.drawGame();
        }
    },
    
    
    
    drawGame: function(){

        // clear the screen
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw the background tiles
        this.drawBackground();

        // draw the path
        this.drawPath();
        
        // draw the path's surrounding a spiked tiles
        this.drawAdjacentTiles();
                
        // draw the player's shield if it's active
        this.drawShield();
        
        // draw the player
        this.drawPlayer();
        
        // draw the circles
        this.drawCircles(this.ctx, this.sprites[this.SPRITES.SKULL_BALL_SPRITE]);
        
        // draw any arrows
        this.drawArrows();
        
        // draw the game's HUD
        this.drawHUD(this.ctx);
    },
    
    
    
    // draws the necessary HUD elements depending on the game state
    drawHUD: function(ctx){
        
        // draw the hud while the game is in play
        if(this.gameState == this.GAME_STATE.PLAY){
            ctx.save(); 
            // draw score
            // fillText(string, x, y, css, color)
            this.fillText(this.ctx, "Round Score: " + this.roundScore , 20, this.canvas.height - 15, "12pt oswald", "white");
            this.fillText(this.ctx, "Lives Remaining: " + this.PLAYER.livesRemaining, 200, this.canvas.height - 15, "12pt oswald", "white");
            this.fillText(this.ctx, "Shields Remaining: " + this.PLAYER.shieldsRemaining, 420, this.canvas.height - 15, "12pt oswald", "white");
            this.fillText(this.ctx, "Total Score: " + this.totalScore, this.canvas.width - 160, this.canvas.height - 15, "12pt oswald", "white");
            ctx.restore();
        }
        
        // display title screen
        else if(this.gameState == this.GAME_STATE.TITLE){
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0, 0.6)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.save();
            ctx.shadowColor = "black";
            ctx.shadowOffsetX = 7;
            ctx.shadowOffsetY = 7;
            this.fillText(this.ctx, "Dungeon Delver's Deathtrap", this.canvas.width/2, this.canvas.height/2 - 75, "55pt unifrakturcook", "gold");
            this.fillText(this.ctx, "Press Enter", this.canvas.width/2, this.canvas.height/2 + 45, "20pt nosifer", "red");
            ctx.restore();
            ctx.restore();
        }
        
        // displays the intro screen with the instructions
        else if(this.gameState == this.GAME_STATE.INTRO){
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0, 0.6)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.save();
            ctx.shadowColor = "black";
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            this.fillText(this.ctx, "HOW TO PLAY: ", 40, 60, "30pt nosifer", "red");
            ctx.restore();
            this.fillText(this.ctx, "-- Use your mouse to keep the explorer within the path, avoiding obstacles", 40, 100, "15pt oswald", "white");
            this.fillText(this.ctx, "-- Touch a projectile (like the bouncing skull heads or arrows), you lose a life", 40, 140, "15pt oswald", "white");
            this.fillText(this.ctx, "-- If you touch the outer edges of the path or run out of lives, it's game over", 40, 180, "15pt oswald", "white");
            this.fillText(this.ctx, "-- Use your shield once per level to defend against projectiles", 40, 220, "15pt oswald", "white");
            this.fillText(this.ctx, "-- Go 5 rounds without using your shield, you gain another one", 40, 260, "15pt oswald", "white");
            ctx.save();
            ctx.shadowColor = "black";
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            this.fillText(this.ctx, "CONTROLS: ", 40, 340, "30pt nosifer", "red");
            ctx.restore();
            this.fillText(this.ctx, "-- Mouse (Move Player)", 40, 380, "15pt oswald", "white");
            this.fillText(this.ctx, "--'S' (Activate Shield)", 40, 420, "15pt oswald", "white");
            this.fillText(this.ctx, "-- SHIFT+UP/DOWN (Raise/Lower Volume)", 40, 460, "15pt oswald", "white");
            this.fillText(this.ctx, "--'P'(Pause)", 40, 500, "15pt oswald", "white");
            ctx.save();
            ctx.shadowColor = "black";
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            this.fillText(this.ctx, "Press Enter and hover over the middle to begin", 40, 550, "15pt nosifer", "red");
            ctx.restore();
            ctx.restore();
        }
        
        // display game over screen
        else if(this.gameState == this.GAME_STATE.END){
            ctx.save();
            ctx.fillStyle = 'rgb(0,0,0)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(this.ctx, "GAME OVER", this.canvas.width/2, this.canvas.height/2 - 50, "40pt nosifer", "red");
            this.fillText(this.ctx, "Total Score: " + this.totalScore, this.canvas.width/2, this.canvas.height/2, "25pt nosifer", "red");
            this.fillText(this.ctx, "Press Enter to Play Again", this.canvas.width/2, this.canvas.height/2 + 50, "20pt nosifer", "red");
            ctx.restore();
        }
    },
    
        
    
    // draws the pause screen
    drawPauseScreen: function(ctx){
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0, 0.2)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.fillText(this.ctx, "PAUSED", this.canvas.width/2, this.canvas.height/2, "40pt nosifer", "red");
        ctx.restore();
    },
    
    
    // draw the background tile textures
    drawBackground: function(){
        for (var x=0; x < this.GAME_WORLD.WORLD_WIDTH; x++)
        {
            for (var y=0; y < this.GAME_WORLD.WORLD_HEIGHT; y++)
            {

                  this.ctx.save(); 
                  this.ctx.drawImage(
                      this.sprites[this.SPRITES.BRICK_FRONT_SPRITE],
                      this.world[x][y].tileX,
                      this.world[x][y].tileY, 
                      this.world[x][y].tileWidth,
                      this.world[x][y].tileHeight);
                  this.ctx.restore();
            }
        }
    },
    
    
    // draw the current path
    drawPath: function(){
        for (var rp=0; rp<this.currentPath.length; rp++)
        {
            this.ctx.save();
            
            // draw the path sprites
            this.ctx.drawImage(
                this.sprites[this.SPRITES.BRICK_BACK_SPRITE],
                this.currentPath[rp].tileX,
                this.currentPath[rp].tileY,
                this.currentPath[rp].tileWidth, 
                this.currentPath[rp].tileHeight);
            
            // end of path
            if(rp == this.currentPath.length - 1){
                if(this.turnNum == 1){ // end
                    this.ctx.fillStyle = "rgba(0,255,0, 0.5)";
                }
                else {
                    this.ctx.fillStyle = "rgba(85,26,139, 0.5)";
                }
                    
            
                // draw the shading over the last tile
                this.ctx.fillRect(
                    this.currentPath[rp].tileX,
                    this.currentPath[rp].tileY,
                    this.currentPath[rp].tileWidth, 
                    this.currentPath[rp].tileHeight);
            }
            this.ctx.restore();
        }
    },
    
    
    // draw and animate the player character
    drawPlayer: function(){
        
        if(this.gameState == this.GAME_STATE.PLAY){
            this.canvas.style.cursor = "none"; // hide the mouse cursor
        }
        else{
            this.canvas.style.cursor = "auto";
        }
        // 337.5-22.5:up; 22.5-67.5:up-right; 67.5-112.5:right; 112.5-157.5:down-right; 157.5-202.5:down; 202.5-247.5:down-left; 247.5-292.5:left; 292.5-337.5:up-left
        
        //0-2:down; 3-5:Down-left; 6-8:left; 9-11:down-right; 12-14right; 15-17:up-left; 18-20:up; 21-23:up-right
        
        // each frame 42.8 pixels wide
        
        
        var frame = this.PLAYER.currentFrame + this.PLAYER.frameOffset;
        
                
        // draw torch sprite
        this.ctx.save();
        this.ctx.drawImage(
            this.sprites[this.SPRITES.TORCH_SPRITE],
            this.torchSpriteFrameIndex * 18/3,
            0,
            6,
            10,
            this.PLAYER.x + 6,
            this.PLAYER.y,
            6,
            10);
        
        
        this.torchSpriteFrameIndex++;
        if(this.torchSpriteFrameIndex >= 3){
            this.torchSpriteFrameIndex = 0;
        }
        
        this.PLAYER.pulsar.updateAndDraw(this.ctx,{x:this.PLAYER.x + 9,y:this.PLAYER.y})
        this.ctx.restore();
        
        // draw player sprite
        this.ctx.save();
        this.ctx.drawImage(
            this.sprites[this.SPRITES.ADVENTURER_SPRITE],
            (frame) * 1028 / 24,
            0,
            42.8,
            58,
            this.PLAYER.x - 4,
            this.PLAYER.y - 6,
            14,
            18);
        this.ctx.restore();

    },
    
    
    // draw the player's shield if it's active
    drawShield: function(){
        
        if(this.PLAYER.isShielded){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.SHIELD.x, this.SHIELD.y, this.SHIELD.radius, 0, Math.PI*2, false);
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(72, 244, 66, 0.5)';
            this.ctx.fill();
            this.ctx.restore();
        }
    },
    
    
    // draw any and all arrows on screen
    drawArrows: function(){
        
        if(this.ARROW.isActive){
            this.ctx.save();
            switch(this.ARROW.direction){
                    
                // point the arrow up
                case this.DIRECTIONS.FACE_UP:
                    this.ctx.drawImage(
                        this.sprites[this.SPRITES.ARROW_UP_SPRITE],
                        this.ARROW.x,
                        this.ARROW.y,
                        this.ARROW.width + 3,
                        20);
                    break;
                    
                // point the arrow down
                case this.DIRECTIONS.FACE_DOWN:
                    this.ctx.drawImage(
                        this.sprites[this.SPRITES.ARROW_DOWN_SPRITE],
                        this.ARROW.x,
                        this.ARROW.y - 17,
                        this.ARROW.width + 3,
                        20);
                    break;
                    
                // point the arrow left
                case this.DIRECTIONS.FACE_LEFT:
                    this.ctx.drawImage(
                        this.sprites[this.SPRITES.ARROW_LEFT_SPRITE],
                        this.ARROW.x,
                        this.ARROW.y,
                        20,
                        this.ARROW.height + 3);
                    break;
                    
                // point the arrow right
                case this.DIRECTIONS.FACE_RIGHT:
                    this.ctx.drawImage(
                        this.sprites[this.SPRITES.ARROW_RIGHT_SPRITE],
                        this.ARROW.x - 17,
                        this.ARROW.y,
                        20,
                        this.ARROW.height + 3);
                    break;
                    
                default: break;
            }
            this.ctx.restore();
        }
    },
    
    
    //function for drawing text to the canvas
    fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
    
    
    
    // loads in a new path once the player reaches the end
    createPath: function(){
        
        // change the tile type of all of the tiles in the old path back to zero
        for(var i = 0; i < this.currentPath.length - 1; i++){
            this.currentPath[i].tileType = 0;
        }
        
        var canProceed = false; // used to check if the destination is a wall
        
        //search for a valid random cell
        do {
            var randCell = [];
            var tempRandCell = [];
            do{
                
                tempRandCell = this.findRandomCell(tempRandCell);
                
            }while(tempRandCell[0] >= this.GAME_WORLD.WORLD_WIDTH || 
                   tempRandCell[1] >= this.GAME_WORLD.WORLD_HEIGHT || 
                   Math.abs((this.pathEnd.tileX/this.TILE.TILE_WIDTH) - tempRandCell[0]) >= (this.currentRange) || Math.abs((this.pathEnd.tileY/this.TILE.TILE_HEIGHT) - tempRandCell[1]) >= (this.currentRange));
            randCell = tempRandCell;
            


            if(this.world[randCell[0]][randCell[1]].tileType == 0){

                var tempStart = this.pathEnd;
                var tempEnd = this.world[randCell[0]][randCell[1]];
                var tempPath = findPath(this.world,tempStart,tempEnd);
                if(tempPath.length != 0) {
                    canProceed = true;
                    // calculate path
                    this.pathStart = tempStart;
                    this.pathEnd = tempEnd;
                    this.currentPath = tempPath;
                    if(this.turnNum == 1){
                        this.gameState = this.GAME_STATE.PLAY;
                    }
                    this.tillRangeIncrease--;
                    if(this.tillRangeIncrease == 0 && this.currentRange < this.maxRange){
                        this.currentRange++;
                        this.tillRangeIncrease = 3;
                    }
                    
                    // turn the type of the tiles in the new path
                    for(var i = 0; i < this.currentPath.length; i++){
                        this.currentPath[i].tileType = -1;
                        this.currentPath[i].adjacentTiles = [];
                    }
                    
                    this.createAdjacentTiles();
                    
                    this.longestHall = this.findLongestHall();
                    
                    this.ARROW.isActive = false;
                    this.ARROW.x = undefined;
                    this.ARROW.y = undefined;
                    if(this.turnNum >= 10 && this.longestHall.length >= 4){
                        this.createArrow();
                        this.ARROW.isActive = true;
                    }
                
                    this.populateCircleArray();
                    
                    this.turnNum++;
                }

            }
        }while(canProceed == false || this.currentPath.length == 0);
        
        // create the maximum amount of points for the round, the more tiles in the path there are, the more possible points to be awarded
        this.maxRoundScore = (this.currentPath.length * this.GAME_WORLD.POINTS_PER_TILE);
        this.roundScore = this.maxRoundScore;
    },
    
    
    
    // finds a random cell within the possible coordinates
    findRandomCell: function(tempRandCell){
        // create a new path to a random location within the range
        
            tempRandCell =
            [   Math.floor(getRandom(Math.abs((this.pathEnd.tileX/this.TILE.TILE_WIDTH) - (this.currentRange)), (this.pathEnd.tileX/this.TILE.TILE_WIDTH) + (this.currentRange))),
                Math.floor(getRandom(Math.abs((this.pathEnd.tileY/this.TILE.TILE_HEIGHT) - (this.currentRange)), (this.pathEnd.tileY/this.TILE.TILE_HEIGHT) + (this.currentRange)))
            ];
        
        return tempRandCell;
    },
    
    
    
    // populates each tile's array of adjacent non-path tiles
    createAdjacentTiles: function(){
         // have each tile on the path keep track of adjacent non-path tiles
        for(var i = 0; i < this.currentPath.length; i++){
            var index = 0;
            // left adjacent tile
            if(this.currentPath[i].tileX != 0){

                if(this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH) - 1][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT)].tileType != -1){

                    this.currentPath[i].adjacentTiles[index] = this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH) - 1][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT)];
                    index++;
                }

            }
            // right adjacent tile
            if((this.currentPath[i].tileX/this.TILE.TILE_WIDTH) < this.GAME_WORLD.WORLD_WIDTH - 1){

                if(this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH) + 1][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT)].tileType != -1){

                    this.currentPath[i].adjacentTiles[index] = this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH) + 1][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT)];
                    index++;
                }
            }

            // up adjacent tile
            if(this.currentPath[i].tileY != 0) {

                if(this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH)][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT) - 1].tileType != -1){

                    this.currentPath[i].adjacentTiles[index] = this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH)][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT) - 1];
                    index++;
                }
            }

            // down adjacent tile
            if((this.currentPath[i].tileY/this.TILE.TILE_HEIGHT) < this.GAME_WORLD.WORLD_HEIGHT - 1){

                if(this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH)][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT) + 1].tileType != -1){
                    
                    this.currentPath[i].adjacentTiles[index] = this.world[(this.currentPath[i].tileX/this.TILE.TILE_WIDTH)][(this.currentPath[i].tileY/this.TILE.TILE_HEIGHT) + 1];
                    index++;
                }
            }
        }
        
    },
    
    
    // draws the spike texture on each adjacent tile
    drawAdjacentTiles: function(){
        
        for (var i=0; i < this.currentPath.length; i++){
            var currentTile = this.currentPath[i];
            for (var j=0; j < currentTile.adjacentTiles.length; j++){
                var adjacentTile = currentTile.adjacentTiles[j];
                
                // check for the left or right
                if(adjacentTile.tileY == currentTile.tileY){
                    
                    // is on left
                    if(adjacentTile.tileX < currentTile.tileX){
                        
                        this.ctx.save();
                        this.ctx.drawImage(
                            this.sprites[this.SPRITES.SPIKE_LEFT_SPRITE],
                            currentTile.tileX - (this.TILE.TILE_HEIGHT/2),
                            currentTile.tileY,
                            this.TILE.TILE_HEIGHT/2,
                            this.TILE.TILE_HEIGHT);
                        this.ctx.restore();
                    }
                    
                    //is on right
                    else {
                        
                        this.ctx.save();
                        this.ctx.drawImage(
                            this.sprites[this.SPRITES.SPIKE_RIGHT_SPRITE],
                            adjacentTile.tileX,
                            currentTile.tileY,
                            this.TILE.TILE_HEIGHT/2,
                            this.TILE.TILE_HEIGHT);
                        this.ctx.restore();
                    }
                }
                
                // check for up or down
                else{
                    
                    // is up
                    if(adjacentTile.tileY < currentTile.tileY){
                        
                        this.ctx.save();
                        this.ctx.drawImage(
                            this.sprites[this.SPRITES.SPIKE_UP_SPRITE],
                            currentTile.tileX,
                            currentTile.tileY - (this.TILE.TILE_HEIGHT/2),
                            this.TILE.TILE_WIDTH,
                            this.TILE.TILE_HEIGHT/2);
                        this.ctx.restore();
                    }
                    
                    // is down
                    else{
                        
                        this.ctx.save();
                        this.ctx.drawImage(
                            this.sprites[this.SPRITES.SPIKE_DOWN_SPRITE],
                            currentTile.tileX,
                            adjacentTile.tileY,
                            this.TILE.TILE_WIDTH,
                            this.TILE.TILE_HEIGHT/2);
                        this.ctx.restore();
                    }
                    
                }
            }
        }
    },
    
    
    // loop through the current path to find its longest stretch; used to set up arrows
    findLongestHall: function(){
        
        var halls = [[]];
        var hallLengths = [];
        var currentHallLength = 1;
        var hallNumber = 0;
        var tileNumber = 0;
        var previousTile = this.currentPath[0];
        halls[hallNumber] = [];
        halls[hallNumber][tileNumber] = previousTile;
        tileNumber++;
        var currentTile;
        var isHorizontal = null;
        var previousState = isHorizontal;
        
        for(var i = 1; i < this.currentPath.length; i++){
            currentTile = this.currentPath[i];
            // check to see if the next tile is on the same axis as the one before it
            if(currentTile.tileY == previousTile.tileY){
                isHorizontal = true;
            }
            else{
                isHorizontal = false;
            }
            
            if(i == 1){
                previousState = isHorizontal;
            }
            
            // continue along the same hall
            if(previousState == isHorizontal){
                
                halls[hallNumber][tileNumber] = currentTile;
                previousTile = currentTile;
                tileNumber++;
                currentHallLength++;
            }
            
            // turn the corner to a new hall
            else{
                hallLengths[hallNumber] = currentHallLength;
                
                tileNumber = 0;
                currentHallLength = 2;
                hallNumber++;
                halls[hallNumber] = [];
                halls[hallNumber][tileNumber] = previousTile;
                tileNumber++;
                previousTile = currentTile;
                halls[hallNumber][tileNumber] = previousTile;
                tileNumber++;
                
            }
            previousState = isHorizontal;
        }
        
        hallLengths[hallNumber] = currentHallLength;
        
        var longestHallIndex;
        var currentLength = 0;
        var longestHallLength = 0;
        for(var i = 0; i < hallLengths.length; i++){
            currentLength = hallLengths[i];
            
            if(currentLength > longestHallLength){
                longestHallLength = currentLength;
                longestHallIndex = i;
            }
        }
        
        return halls[longestHallIndex];
    },
    
    
    
    // loads in necessary circle obstacles every time a level loads.
    populateCircleArray: function(){
        // create a new set of circles
        this.circles = [];
        var circleNum;
        if(this.turnNum <= 5){
            circleNum = this.CIRCLE.NUM_CIRCLES_START;
        }
        else if(this.currentPath.length >=12 && this.turnNum > 15){
            circleNum = this.CIRCLE.MAX_NUM_CIRCLES;
        }
        else if((this.currentPath.length >=8) && this.turnNum > 10){
            circleNum = 2;
        }
        else if((this.currentPath.length >=4) && this.turnNum > 5) {
            circleNum = 1;
        }
        else {
            circleNum = this.CIRCLE.NUM_CIRCLES_START;
        }
        this.circles = this.makeCircles(circleNum);
    },
    
    
    
    // handle mouse collision with canvas objects
    checkPlayerCollision: function(){
                
        // check for collision with the tiles in the path
        var currentPathTileRect;
        var onPath = false;
        
        for(var i=0; i<this.currentPath.length; i++){
            currentPathTileRect = {
                x: this.currentPath[i].tileX,
                y: this.currentPath[i].tileY,
                width: this.currentPath[i].tileWidth,
                height: this.currentPath[i].tileHeight};
            
            if(AABB(currentPathTileRect, this.PLAYER) && onPath == false){
                //console.log("colliding with path");
                onPath = true;
                
                //if the mouse hovers over the end of the path
                if(i == this.currentPath.length - 1){
                    if(this.gameState == this.GAME_STATE.INTRO){
                        this.gameState = this.GAME_STATE.PLAY;
                    }
                    this.totalScore += this.roundScore;
                    if(this.PLAYER.isShielded){
                        this.PLAYER.isShielded = false;
                    }
                    
                    // if the player goes 5 or more consecutive levels without using the shield, he will gain an extra one.
                    if(this.PLAYER.shieldUsedInLevel == false){
                        this.levelsSinceUsingShield++;
                        if(this.levelsSinceUsingShield >= 5){
                            this.PLAYER.shieldsRemaining++;
                            this.sound.playEffect(this.soundEffects.SHIELD_GET);
                            this.levelsSinceUsingShield = 0;
                        }
                    }
                    else{
                        this.levelsSinceUsingShield = 0;
                    }
                    this.sound.playEffect(this.soundEffects.PATH_CLEAR);
                    this.PLAYER.shieldUsedInLevel = false;
                    this.framesSinceFire = 0;
                    this.createPath();
                }
            }
        }
        
        // it's a game over if the player goes outside the path
        if((!onPath || 
            this.PLAYER.x + (this.PLAYER.width/2) <= 0 || 
            this.PLAYER.x + (this.PLAYER.width/2) >= this.canvas.width || 
            this.PLAYER.y + (this.PLAYER.height/2)<=0 || 
            this.PLAYER.y + (this.PLAYER.height/2) >= this.canvas.height) && 
            this.gameState == this.GAME_STATE.PLAY && this.turnNum > 1){
            this.gameState = this.GAME_STATE.END;
            this.sound.playEffect(this.soundEffects.LIFE_LOST);
            this.sound.stopBGAudio();
        }
        
        // check collisions with each circle
        for(var i = 0; i<this.circles.length; i++){
            var circle = this.circles[i];
            if(this.PLAYER.isShielded){
                // the projectile hits the sield
                if(circlesIntersect(this.SHIELD, circle)){
                    this.destroyProjectile(circle);
                    this.PLAYER.isShielded = false;
                }
            }
            // the player is hit by a circle
            else if(rectCircleColliding(circle, this.PLAYER) && circle.isActive){
                console.log("player collided with circle");
                this.PLAYER.livesRemaining--;
                this.destroyProjectile(circle);
                this.sound.playEffect(this.soundEffects.HIT);
                break;
            }
        }
        
        // check collisions with arrows
        if(this.PLAYER.isShielded){
            if(rectCircleColliding(this.SHIELD, this.ARROW)){
                this.destroyProjectile(this.ARROW);
                this.ARROW.x = this.ARROW.initialX;
                this.ARROW.y = this.ARROW.initialY;
                this.PLAYER.isShielded = false;
            }
        }
        
        else if(AABB(this.PLAYER, this.ARROW)){
            console.log("player Collided with arrow");
            this.PLAYER.livesRemaining--;
            this.destroyProjectile(this.ARROW);
            this.ARROW.x = this.ARROW.initialX;
            this.ARROW.y = this.ARROW.initialY;
            this.sound.playEffect(this.soundEffects.HIT);
        }
        
        // if the player's lives are 0, it's game over
        if(this.PLAYER.livesRemaining <=0){
            this.gameState = this.GAME_STATE.END;
            this.sound.playEffect(this.soundEffects.LIFE_LOST);
            this.sound.stopBGAudio();
        }
    },
    
    
    // has the player correspond to the coordinates of the mouse
    doMousemove: function(e){
        this.prevMouse = this.mouse;
        
        this.mouse = getMouse(e);
        this.PLAYER.x = this.mouse.x - (this.PLAYER.width/2);
        this.PLAYER.y = this.mouse.y - (this.PLAYER.height/2);
        
        // angle in degrees
        this.angleBetweenMousePoints = Math.atan2(this.prevMouse.y - this.mouse.y, this.prevMouse.x - this.mouse.x) * 180 / Math.PI;
        //console.log(this.angleBetweenMousePoints);
        
        // sprite up
        if(this.angleBetweenMousePoints > 67.5 && this.angleBetweenMousePoints <=112.5){
            this.PLAYER.currentFrame = 18;
            
        }
        
        // sprite up-right
        else if(this.angleBetweenMousePoints > 112.5 && this.angleBetweenMousePoints <= 157.5){
            this.PLAYER.currentFrame = 21;
        }
        
        // sprite right
        else if((this.angleBetweenMousePoints > 157.5 && this.angleBetweenMousePoints <= 180) || (this.angleBetweenMousePoints > -180 && this.angleBetweenMousePoints <= -157.5)){
            this.PLAYER.currentFrame <= 12;
        }
        
        // sprite down-right
        else if(this.angleBetweenMousePoints > -157.5 && this.angleBetweenMousePoints <= -112.5){
            this.PLAYER.currentFrame = 9;
        }
        
        // sprite down
        else if(this.angleBetweenMousePoints > -112.5 && this.angleBetweenMousePoints <= -67.5){
            this.PLAYER.currentFrame = 0;
        }
        
        // sprite down-left
        else if(this.angleBetweenMousePoints > -67.5 && this.angleBetweenMousePoints <= -22.5){
            this.PLAYER.currentFrame = 3;
        }
        
        // sprite left
        else if(this.angleBetweenMousePoints > -22.5 && this.angleBetweenMousePoints <= 22.5){
            this.PLAYER.currentFrame = 6;
        }
        
        // sprite up-left
        else if(this.angleBetweenMousePoints > 22.5 && this.angleBetweenMousePoints <= 67.5){
            this.PLAYER.currentFrame = 15;
        }
        
        this.currentCycle ++;
        if (this.currentCycle >= this.cyclesUntilFrameAdvance){
            this.PLAYER.frameOffset++;
            this.currentCycle = 0;
            if(this.PLAYER.frameOffset >= 3){
                this.PLAYER.frameOffset = 0;
            }
        }
        
    },
    
    
    // a function used for defining circle objects
    makeCircles: function(num){
        // a function that we will soon use a method
        var circleMove = function(dt){
            this.x += this.xSpeed * this.speed * dt;
            this.y += this.ySpeed * this.speed * dt;
        };
        
        // a function that we will soon use as a "method"
        var circleDraw = function(ctx, sprite){
            if(this.isActive){
                //draw circle
                ctx.save();
                ctx.drawImage(
                    sprite,
                    this.x - (this.radius * 2),
                    this.y - (this.radius * 2) ,
                    this.radius * 3,
                    this.radius * 3
                );
                ctx.restore();
            }
        };
        
        var circleArray = [];
        for(var i=0; i<num; i++){
            //make a new object literal
            var c = {};
            
            // add .x and .y properties
            // the circle will spawn somewhere in the end tile
            c.x = getRandom(this.CIRCLE.CIRCLE_RADIUS * 2 + this.pathEnd.tileX, this.pathEnd.tileX + this.pathEnd.tileWidth - this.CIRCLE.CIRCLE_RADIUS * 2);
            c.y = getRandom(this.CIRCLE.CIRCLE_RADIUS * 2 + this.pathEnd.tileY, this.pathEnd.tileY + this.pathEnd.tileHeight - this.CIRCLE.CIRCLE_RADIUS * 2);
            
            // add a radius property
            c.radius = this.CIRCLE.CIRCLE_RADIUS;
            
            // getRandomUnitVector() is from utilities.js
            var randomVector = getRandomUnitVector();
            c.xSpeed = randomVector.x;
            c.ySpeed = randomVector.y;
            
            // make more properties
            c.speed = this.CIRCLE.MIN_SPEED + (this.turnNum * 2);
            if(c.speed > this.CIRCLE.MAX_SPEED){
                c.speed = this.CIRCLE.MAX_SPEED;
            }
            c.fillStyle = "red";
            
            c.draw = circleDraw;
            c.move = circleMove;
            
            c.isActive = true;
            
            // no more properties can be added
            Object.seal(c);
            circleArray.push(c);
        }
        return circleArray;
    },
    
    
    // handles circle collisions between both the path and the player
    checkCircleCollision: function(dt){
		for(var i=0;i<this.circles.length; i++){
			// move circles
            var circle = this.circles[i];
			circle.move(dt);
            
            
            // check to see which tile the circle is currently residing within
            var currentPathTileRect;
            for(var j=0; j< this.currentPath.length; j++){
                currentPathTileRect = {
                    x: this.currentPath[j].tileX,
                    y: this.currentPath[j].tileY,
                    width: this.currentPath[j].tileWidth,
                    height: this.currentPath[j].tileHeight};

                var adjacentTileRect;
                // check for collision with all of the surrounding tile's adjacent tiles
                for(var k=0; k < this.currentPath[j].adjacentTiles.length; k++){
                    adjacentTileRect = {
                        x: this.currentPath[j].adjacentTiles[k].tileX,
                        y: this.currentPath[j].adjacentTiles[k].tileY,
                        width: this.currentPath[j].adjacentTiles[k].tileWidth,
                        height: this.currentPath[j].adjacentTiles[k].tileHeight
                    };

                    if(rectCircleColliding(circle, adjacentTileRect)){

                        // did circles hit the left or right side of a tile outside of the path?
                        if(this.currentPath[j].tileY == this.currentPath[j].adjacentTiles[k].tileY && circle.y > this.currentPath[j].adjacentTiles[k].tileY && circle.y < (this.currentPath[j].adjacentTiles[k].tileY + this.TILE.TILE_HEIGHT)){
                            circle.xSpeed *= -1;
                            circle.move(dt); // an extra move
                        }

                        // did circles hit the top or bottom side of a tile outside of the path?
                        else if(this.currentPath[j].tileX == this.currentPath[j].adjacentTiles[k].tileX && circle.x > this.currentPath[j].adjacentTiles[k].tileX && circle.x < (this.currentPath[j].adjacentTiles[k].tileX + this.TILE.TILE_WIDTH)){
                            circle.ySpeed *= -1;
                            circle.move(dt); // an extra move
                        }
                    }
                }
            }    


            // otherwise, check for collision with the edge of the screen
            if(this.circleHitLeftRight(circle)){
                circle.xSpeed *= -1;
                circle.move(dt); // an extra move
            }

            if(this.circleHitTopBottom(circle)){
                circle.ySpeed *= -1;
                circle.move(dt); // an extra move
            }
		} // end for loop
	},
    
    
    // circle collides with left or right of adjacent tile        
    circleHitLeftRight: function (c){
        if(c.x < c.radius || c.x > (this.GAME_WORLD.WORLD_WIDTH * this.TILE.TILE_WIDTH) - c.radius){
            return true;
        }
    },
    
    
    // circle collides with the top or bottom of adjacent tile
    circleHitTopBottom: function (c){
        if(c.y < c.radius || c.y > (this.GAME_WORLD.WORLD_HEIGHT * this.TILE.TILE_HEIGHT) - c.radius){
            return true;
        }
    },
    
    
    // draws any and all circle projectiles on the screen
    drawCircles: function(ctx, sprite){
        for(var i = 0; i< this.circles.length; i++){
            this.circles[i].draw(ctx, sprite);
        }
    },
    
    
    // creates a new arrow once the level is loaded
    createArrow: function(){
        // see which direction the arrow will be facing; will fire from the end of the path

        // vertical path
        if(this.longestHall[0].tileX == this.longestHall[this.longestHall.length - 1].tileX){
            this.ARROW.initialX = this.longestHall[this.longestHall.length - 1].tileX + (this.longestHall[this.longestHall.length - 1].tileWidth/2);

            // facing down
            if(this.longestHall[0].tileY > this.longestHall[this.longestHall.length - 1].tileY){
                this.ARROW.direction = this.DIRECTIONS.FACE_DOWN;

                // start at the top
                this.ARROW.initialY = this.longestHall[this.longestHall.length - 1].tileY;
            }

            //facing up
            else{
                this.ARROW.direction = this.DIRECTIONS.FACE_UP;

                // start at the bottom
                this.ARROW.initialY = this.longestHall[this.longestHall.length - 1].tileY + this.longestHall[this.longestHall.length - 1].tileHeight;
            }

        }

        // horizontal path
        else{
            this.ARROW.initialY = this.longestHall[this.longestHall.length - 1].tileY + (this.longestHall[this.longestHall.length - 1].tileHeight/2);

            // facing left
            if(this.longestHall[0].tileX < this.longestHall[this.longestHall.length - 1].tileX){
                this.ARROW.direction = this.DIRECTIONS.FACE_LEFT;

                // start at the right
                this.ARROW.initialX = this.longestHall[this.longestHall.length - 1].tileX + this.longestHall[this.longestHall.length - 1].tileWidth;
            }

            // facing right
            else{
                this.ARROW.direction = this.DIRECTIONS.FACE_RIGHT;

                // start at the left
                this.ARROW.initialX = this.longestHall[this.longestHall.length - 1].tileX;
            }
        }
        
        this.ARROW.x = this.ARROW.initialX;
        this.ARROW.y = this.ARROW.initialY;
        
        this.ARROW.speed += ((this.turnNum/10)*2);
    },
    
    
    // moves the arrow in the appropriate direction
    moveArrow: function(dt){
        switch(this.ARROW.direction)
        {
            case this.DIRECTIONS.FACE_UP:
                this.ARROW.y -= this.ARROW.speed * dt;
                break;
                
            case this.DIRECTIONS.FACE_DOWN:
                this.ARROW.y += this.ARROW.speed * dt;
                break;
                
            case this.DIRECTIONS.FACE_LEFT:
                this.ARROW.x -= this.ARROW.speed * dt;
                break;
                
            case this.DIRECTIONS.FACE_RIGHT:
                this.ARROW.x += this.ARROW.speed * dt;
                break;
        }
    },
    
    
    // check the arrow's position against all of the adjacent tiles of its destination tile
    checkArrowCollisions: function(dt){
        
        this.moveArrow(dt);
        
        for(var i = 0; i< this.longestHall[0].adjacentTiles.length; i++){
           var currentPathTileRect = {
                    x: this.longestHall[0].adjacentTiles[i].tileX,
                    y: this.longestHall[0].adjacentTiles[i].tileY,
                    width: this.longestHall[0].adjacentTiles[i].tileWidth,
                    height: this.longestHall[0].adjacentTiles[i].tileHeight};
            
            if(AABB(this.ARROW, currentPathTileRect) || 
               this.ARROW.x > this.canvas.width || 
               this.ARROW.y > this.canvas.height||
               this.ARROW.x < 0 || 
               this.ARROW.y < 0){
                this.destroyProjectile(this.ARROW);
                this.ARROW.x = this.ARROW.initialX;
                this.ARROW.y = this.ARROW.initialY;
            }
        }
    },
    
    
    // destroys a projectile object if the player collides with it
    destroyProjectile: function(proj){
        proj.isActive = false;
    },
    
    
    // calculates the time from one frame to the next
    calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
    
    
    // stops playing any and all background audio
    stopBGAudio: function(){
        this.sound.stopBGAudio();
    },
    
    
    // pauses the game after "p" has been pressed
    pauseGame: function(){
      
        this.paused = true;
        
        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        
        this.sound.playEffect(this.soundEffects.PAUSE);
        this.stopBGAudio();
        
        //call update() once so that out paused screen gets drawn
        this.update();
    },
    
    
    // resumes the game after it's been paused
    resumeGame: function(){
      
        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        
        this.paused = false;
        
        if(this.sound != undefined){
            this.sound.playBGAudio();
        }

        
        //restart the loop
        this.update();
    },
    
    
    // turn the player's shield on
    toggleShield: function(){
        if(this.PLAYER.isShielded == false && this.PLAYER.shieldUsedInLevel == false && this.PLAYER.shieldsRemaining > 0 && this.gameState == this.GAME_STATE.PLAY){
            this.PLAYER.shieldsRemaining--;
            this.PLAYER.shieldUsedInLevel = true;
            this.PLAYER.isShielded = true;
            this.sound.playEffect(this.soundEffects.SHIELD);
        }
    },
    
    // advance screens (from title to intro, from intro to gameplay, from game over to title)
    advanceScreen: function(){
        
        if(this.gameState == this.GAME_STATE.TITLE){
            this.gameState = this.GAME_STATE.INTRO;
        }
        else if(this.gameState == this.GAME_STATE.INTRO){
            this.gameState = this.GAME_STATE.PLAY;
            this.sound.playBGAudio();
        }
        else if(this.gameState == this.GAME_STATE.END){
            this.sound.stopBGAudio();
            this.reset();
        }
    }

};