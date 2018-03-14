//sound.js
"use strict"
//if app exists use the existing copy
//else create a new object literal
var app = app ||{};

//define the .sound module and immediately invoke it in an IIFE
app.sound = (function(){
    console.log("sound.js module loaded");
    
    //audio variables
    var bgAudio = undefined;
    var currentEffect = undefined;
    var effectSounds = ["life-lost.mp3", "hit.wav", "path-clear.wav", "pause.wav", "shield.wav", "shield-get.wav", "arrow-fire.wav"];
    var EFFECTS = Object.freeze({
        LIFE_LOST: 0,
        HIT: 1,
        PATH_CLEAR: 2,
        PAUSE: 3,
        SHIELD: 4,
        SHIELD_GET: 5,
        ARROW_FIRE: 6
    });
    
    function init(){
        //audio
        bgAudio = document.querySelector("#bgAudio");
        bgAudio.volume=0.25;
    }
    
    function stopBGAudio(){
        bgAudio.pause();
    }
    
    function getEffects(){
        return EFFECTS;
    }
    
    
    function playEffect(index){
        var effectSound = document.createElement('audio');
        currentEffect = effectSounds[index];
        effectSound.volume = 0.5;
        effectSound.src = "media/audio/" + currentEffect;
        effectSound.play();
    }
    
    function playBGAudio(){
        bgAudio.currentTime = 0;
        bgAudio.play();
    }
    
    function lowerVolume(){
        if(bgAudio.volume > 0.05){
            bgAudio.volume -= 0.1;
        }
    }
    
    function raiseVolume(){
        if(bgAudio.volume < 0.9){
            bgAudio.volume += 0.1;
        }
    }
    
    return {
        init: init,
        stopBGAudio: stopBGAudio,
        playEffect: playEffect,
        playBGAudio: playBGAudio,
        lowerVolume: lowerVolume,
        raiseVolume: raiseVolume,
        getEffects: getEffects
    };
    
}());