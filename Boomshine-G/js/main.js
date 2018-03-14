// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
    sound:undefined, //required-loaded by main.js
    GAME_STATE: Object.freeze({
        BEGIN: 0,
        DEFAULT: 1,
        EXPLODING: 2,
        ROUND_OVER: 3,
        REPEAT_LEVEL: 4,
        END: 5
    }),
    
    paused: false,
    Game: Object.freeze({
        WIDTH : 640, 
        HEIGHT: 480
    }),

    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: true,
    animationID: 0,
    gameState: undefined,
    myKeys: undefined, // required - loaded by main.js
    Emitter: undefined, // required - loaded by main.js
    pulsar: undefined,
    roundScore: 0,
    totalScore: 0,
    
    // original 8 fluorescent crayons: https://en.wikipedia.org/wiki/List_of_Crayola_crayon_colors#Fluorescent_crayons
    //  "Ultra Red", "Ultra Orange", "Ultra Yellow","Chartreuse","Ultra Green","Ultra Blue","Ultra Pink","Hot Magenta"
    colors: ["#FD5B78","#FF6037","#FF9966","#FFFF66","#66FF66","#50BFE6","#FF6EFF","#EE34D2"],
    
    //circle object
    CIRCLE: Object.freeze({
        NUM_CIRCLES_START: 5,
        NUM_CIRCLES_END: 20,
        START_RADIUS: 12, // starting circle radius
        MAX_RADIUS: 45,
        MIN_RADIUS: 2,
        MAX_LIFETIME: 2.5,
        MAX_SPEED: 80, // pixels per second
        EXPLOSION_SPEED: 60,
        IMPLOSION_SPEED: 84
    }),
    
    CIRCLE_STATE: Object.freeze({ //fake enumeration, actually an objecy literal
        NORMAL: 0,
        EXPLODING: 1,
        MAX_SIZE: 2,
        IMPLODING: 3,
        DONE: 4
    }),
    
    cirlces: [],
    numCircles: this.NUM_CIRCLES_START,

    
    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.Game.WIDTH;
		this.canvas.height = this.Game.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
        
        this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
        this.circles = this.makeCircles(this.numCircles);
        console.log("this.circles = " + this.circles);

        this.gameState = this.GAME_STATE.BEGIN;
        
        //hook up events
        this.canvas.onmousedown = this.doMousedown.bind(this);
        // load level
		this.reset();
        
		// start the game loop
		this.update();
	},
    
    reset: function(){
        this.numCircles += 5;
        this.roundScore = 0;
        this.circles =  this.makeCircles(this.numCircles);
    },
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
        if(this.paused){
            this.drawPauseScreen(this.ctx);
            return;
        }
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
        // move circles
        this.moveCircles(dt);
        
        // CHECK FOR COLLISIONS
        this.checkForCollisions();
	 	
		// 5) DRAW	
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.Game.WIDTH,this.Game.HEIGHT); 
	
		// ii) draw circles
        this.ctx.globalAlpha = 0.9;
        this.drawCircles(this.ctx);
	
		// iii) draw HUD
		this.ctx.globalAlpha = 1.0;
        this.drawHUD(this.ctx);
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.Game.WIDTH - 150, this.Game.HEIGHT - 10, "18pt courier", "white");
		}
        
        //6 CHECK FOR CHEATS
        // if we are on the start screen or a round over screen
        if(this.gameState == this.GAME_STATE || this.gameState == this.GAME_STATE.ROUND_OVER){
            // if the shift key and up arrow are both down (true)
            if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_UP] && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_SHIFT]){
                this.totalScore++;
                this.sound.playEffect();
            }
        }
		
	},
	
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
    
        
    circleHitLeftRight: function (c){
        if(c.x < c.radius || c.x > this.Game.WIDTH - c.radius){
            return true;
        }
    },
    
    circleHitTopBottom: function (c){
        if(c.y < c.radius || c.y > this.Game.HEIGHT - c.radius){
            return true;
        }
    },
    
    checkForCollisions: function(){
		if(this.gameState == this.GAME_STATE.EXPLODING){
			// check for collisions between circles
			for(var i=0;i<this.circles.length; i++){
				var c1 = this.circles[i];
				// only check for collisions if c1 is exploding
				if (c1.state === this.CIRCLE_STATE.NORMAL) continue;   
				if (c1.state === this.CIRCLE_STATE.DONE) continue;
				for(var j=0;j<this.circles.length; j++){
					var c2 = this.circles[j];
				// don't check for collisions if c2 is the same circle
					if (c1 === c2) continue; 
				// don't check for collisions if c2 is already exploding 
					if (c2.state != this.CIRCLE_STATE.NORMAL ) continue;  
					if (c2.state === this.CIRCLE_STATE.DONE) continue;
				
					// Now you finally can check for a collision
					if(circlesIntersect(c1,c2) ){
						c2.state = this.CIRCLE_STATE.EXPLODING;
						c2.xSpeed = c2.ySpeed = 0;
						this.roundScore ++;
                        
                        this.sound.playEffect();
					}
				}
			} // end for
			
			// round over?
			var isOver = true;
			for(var i=0;i<this.circles.length; i++){
				var c = this.circles[i];
				if(c.state != this.CIRCLE_STATE.NORMAL && c.state != this.CIRCLE_STATE.DONE){
				 isOver = false;
				 break;
				}
			} // end for
		
			if(isOver){
				this.gameState = this.GAME_STATE.ROUND_OVER;
				this.totalScore += this.roundScore;
                this.stopBGAudio();
			 }
				
		} // end if GAME_STATE_EXPLODING
	},
    
    drawCircles: function(ctx){
        if(this.gameState == this.GAME_STATE.ROUND_OVER){this.ctx.globalAlpha = 0.25;}
        for(var i=0; i<this.circles.length; i++){
            var c = this.circles[i];
            if(c.state === this.CIRCLE_STATE.DONE) {continue;}
            if(c.pulsar && c.state != this.CIRCLE_STATE.NORMAL){
                c.pulsar.updateAndDraw(ctx,{x:c.x,y:c.y});
            }
            c.draw(ctx);
        }
    },
    
    drawHUD: function(ctx){
		ctx.save(); // NEW
		// draw score
      	// fillText(string, x, y, css, color)
		this.fillText(this.ctx, "This Round: " + this.roundScore + " of " + this.numCircles, 20, 20, "14pt courier", "#ddd");
		this.fillText(this.ctx, "Total Score: " + this.totalScore, this.Game.WIDTH - 200, 20, "14pt courier", "#ddd");

		// NEW
		if(this.gameState == this.GAME_STATE.BEGIN){
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "To begin, click a circle", this.Game.WIDTH/2, this.Game.HEIGHT/2, "30pt courier", "white");
		} // end if
	
		// NEW
		if(this.gameState == this.GAME_STATE.ROUND_OVER){
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "Round Over", this.Game.WIDTH/2, this.Game.HEIGHT/2 - 40, "30pt courier", "red");
			this.fillText(this.ctx, "Click to continue", this.Game.WIDTH/2, this.Game.HEIGHT/2, "30pt courier", "red");
			this.fillText(this.ctx, "Next round there are " + (this.numCircles + 5) + " circles", this.Game.WIDTH/2 , this.Game.HEIGHT/2 + 35, "20pt courier", "#ddd");
		} // end if
		ctx.restore(); // NEW
	},
    
    moveCircles: function(dt){
		for(var i=0;i<this.circles.length; i++){
			var c = this.circles[i];
			if(c.state === this.CIRCLE_STATE.DONE) continue;
			if(c.state === this.CIRCLE_STATE.EXPLODING){
				c.radius += this.CIRCLE.EXPLOSION_SPEED  * dt;
				if (c.radius >= this.CIRCLE.MAX_RADIUS){
					c.state = this.CIRCLE_STATE.MAX_SIZE;
					console.log("circle #" + i + " hit CIRCLE.MAX_RADIUS");
				}
				continue;
			}
		
			if(c.state === this.CIRCLE_STATE.MAX_SIZE){
				c.lifetime += dt; // lifetime is in seconds
				if (c.lifetime >= this.CIRCLE.MAX_LIFETIME){
					c.state = this.CIRCLE_STATE.IMPLODING;
					console.log("circle #" + i + " hit CIRCLE.MAX_LIFETIME");
				}
				continue;
			}
				
			if(c.state === this.CIRCLE_STATE.IMPLODING){
				c.radius -= this.CIRCLE.IMPLOSION_SPEED * dt;
				if (c.radius <= this.CIRCLE.MIN_RADIUS){
					console.log("circle #" + i + " hit CIRCLE.MIN_RADIUS and is gone");
					c.state = this.CIRCLE_STATE.DONE;
					continue;
				}
			
			}
		
			// move circles
			c.move(dt);
		
			// did circles leave screen?
			if(this.circleHitLeftRight(c)){
                c.xSpeed *= -1;
                c.move(dt); // an extra move
            }
            
            if(this.circleHitTopBottom(c)){
                c.ySpeed *= -1;
                c.move(dt); // an extra move
            }
	
		} // end for loop
	},

	
    makeCircles: function(num){
        // a function that we will soon use a method
        var circleMove = function(dt){
            this.x += this.xSpeed * this.speed * dt;
            this.y += this.ySpeed * this.speed * dt;
        };
        
        // a function that we will soon use as a "method"
        var circleDraw = function(ctx){
            //draw circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
            ctx.closePath();
            ctx.fillStyle = this.fillStyle;
            ctx.fill();
            ctx.restore();
        };
        
        var array = [];
        debugger;
        for(var i=0; i<num; i++){
            //make a new object literal
            var c = {};
            
            // add .x and .y properties
            // .x and .y are somewhere on the canvas, with a minimum margin of START_RADIUS
            // getRandom() is from utilities.js
            c.x = getRandom(this.CIRCLE.START_RADIUS * 2, this.Game.WIDTH - this.CIRCLE.START_RADIUS * 2);
            c.y = getRandom(this.CIRCLE.START_RADIUS * 2, this.Game.HEIGHT - this.CIRCLE.START_RADIUS * 2);
            
            // add a radius property
            c.radius = this.CIRCLE.START_RADIUS;
            
            // getRandomUnitVector() is from utilities.js
            var randomVector = getRandomUnitVector();
            c.xSpeed = randomVector.x;
            c.ySpeed = randomVector.y;
            
            // make more properties
            c.speed = this.CIRCLE.MAX_SPEED;
            c.fillStyle = this.colors[i % this.colors.length];
            c.state = this.CIRCLE_STATE.NORMAL;
            c.lifetime = 0;
            
                        
            //initialize pulsar
            var pulsar = new this.Emitter();
            pulsar.fill = c.fillStyle;
            pulsar.minXspeed = pulsar.minYspeed = -0.5;
            pulsar.maxXspeed = pulsar.maxYspeed = 0.5;
            pulsar.lifetime = 500;
            pulsar.expansionRate = 0.1;
            pulsar.numParticles = 80;
            pulsar.xRange = 70;
            pulsar.yRange = 70;
            pulsar.useCircles = false;
            pulsar.useSquares = true;
            pulsar.createParticles({x:-300,y:-300});
            c.pulsar = pulsar;
            
            c.draw = circleDraw;
            c.move = circleMove;
            
            // no more properties can be added
            Object.seal(c);
            array.push(c);
        }
        return array;
    },
    
    pauseGame: function(){
      
        this.paused = true;
        
        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        
        this.stopBGAudio();
        
        //call update() once so that out paused screen gets drawn
        this.update();
    },
    
    drawPauseScreen: function(ctx){
        ctx.save();
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.Game.WIDTH, this.Game.HEIGHT);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.fillText(this.ctx, "...PAUSED...", this.Game.WIDTH/2, this.Game.HEIGHT/2, "40pt courier", "white");
        ctx.restore();
    },
    
    resumeGame: function(){
      
        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        
        this.paused = false;
        
        this.sound.playBGAudio();
        
        //restart the loop
        this.update();
    },
    
    doMousedown: function(e){
        
        this.sound.playBGAudio();
        
        //unpause on a click
        // just to make sure we never get stuck in a paused state
        if(this.paused){
            this.paused = false;
            this.update();
            return;
        };
        
        // you can only click one circle
        if(this.gameState == this.GAME_STATE.EXPLODING){return;}
        
        // if the round is over, reset and add 5 more circles
        if(this.gameState == this.GAME_STATE.ROUND_OVER){
            this.gameState = this.GAME_STATE.DEFAULT;
            this.reset();
            return;
        }
        
        
        var mouse = getMouse(e); 

        this.checkCircleClicked(mouse);
    },
    
    checkCircleClicked: function(mouse) {
        
        // looping through circle array backwards, why?
        for(var i = this.circles.length - 1; i>=0; i--){
            var c = this.circles[i];
            if(pointInsideCircle(mouse.x, mouse.y, c)){
                c.xSpeed = c.ySpeed = 0;
                c.state = this.CIRCLE_STATE.EXPLODING;
                this.gameState = this.GAME_STATE.EXPLODING;
                this.roundScore++;
                this.sound.playEffect();
                break; // we want to click only one circle
            }
        }
    },
    
    stopBGAudio: function(){
        this.sound.stopBGAudio();
    }
   
}; // end app.main