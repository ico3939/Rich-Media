	// An IIFE ("Iffy") - see the notes in mycourses
	(function(){
		"use strict";
		
		var NUM_SAMPLES = 256;
        var trackSet_1 = [
            'media/songs/Wretched Weaponry/Wretched Weaponry-Quiet-Instrumental.mp3',
            'media/songs/Wretched Weaponry/Wretched Weaponry-Quiet-Vocals.mp3',
            'media/songs/Wretched Weaponry/Wretched Weaponry-Medium-Instrumental.mp3',
            'media/songs/Wretched Weaponry/Wretched Weaponry-Medium-Vocals.mp3',
            'media/songs/Wretched Weaponry/Wretched Weaponry-Dynamic-Instrumental.mp3',
            'media/songs/Wretched Weaponry/Wretched Weaponry-Dynamic-Vocals.mp3'
        ];
        var trackSet_2 = [
            'media/songs/Birth of a Wish/Birth of a Wish - Instrumental.mp3',
            'media/songs/Birth of a Wish/Birth of a Wish - Vocal.mp3',
            'media/songs/Birth of a Wish/Birth of a Wish - Become as Gods.m4a',
            'media/songs/Birth of a Wish/Birth of a Wish - This Cannot Continue.mp3',
        ];
        var emilImage = document.getElementById("emil");
        var trackIndex = 0;
        var allMusic = [trackSet_1, trackSet_2];
        var currentTrackSet = trackSet_1;
        var currentTrack = trackSet_1[trackIndex];
        var filesLoaded = 0;
        var trackType1 = true;
        var trackType2 = false;
        var isVocal = false;
		var audioElement;
		var analyserNode;
        var dataStreamType = 1; // type 1 displays the frequency range, 2 displays the waveform
		var canvas,ctx;
        var maxRadius = 100;
        var minRadius = 85;
        var circleRadius;
        var invert = false;
        var isGlitched = false;
        var noise = false;
        var blurred = false;
        
        // variables for the delay effect
        var delayAmount = 0.0;
        var delayNode;
        
        // variables for the panning effect
        var panNode;
        
		
        
        
		function init(){
			// set up canvas stuff
			canvas = document.querySelector('canvas');
			ctx = canvas.getContext("2d");
			
			// get reference to <audio> element on page
			audioElement = document.querySelector('audio');
            audioElement.volume = 0.2;
			
			// call our helper function and get an analyser node
			analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
			
			// load and play default sound into audio element
            // preloaded the tracks in this set
            for(var i in currentTrackSet) {
                preloadAudio(currentTrackSet[i]);
            }
            
            			
			// get sound track <select> and Full Screen button working
			setupUI();
            
			// start animation loop
			update();
		}
		
		
		function createWebAudioContextWithAnalyserNode(audioElement) {
			var audioCtx, analyserNode, sourceNode, feedback;
			// create new AudioContext
			// The || is because WebAudio has not been standardized across browsers yet
			// http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
			audioCtx = new (window.AudioContext || window.webkitAudioContext);
			
			// create an analyser node
			analyserNode = audioCtx.createAnalyser();
            
            //create DelayNode instance
            delayNode = audioCtx.createDelay();
            delayNode.delayTime.value = delayAmount;
            
            // create additional effects for the delay node
            feedback = audioCtx.createGain();
            feedback.gain.value = 0.8; // makes the audio 
            // create PannerNode instance
            panNode = audioCtx.createStereoPanner();
			
			/*
			We will request NUM_SAMPLES number of samples or "bins" spaced equally 
			across the sound spectrum.
			
			If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
			the third is 344Hz. Each bin contains a number between 0-255 representing 
			the amplitude of that frequency.
			*/ 
			
			// fft stands for Fast Fourier Transform
			analyserNode.fftSize = NUM_SAMPLES*2;
			
			// this is where we hook up the <audio> element to the analyserNode
			sourceNode = audioCtx.createMediaElementSource(audioElement); 
            //connect source node directly to speakers so we can hear the unaltered source in this channel
            sourceNode.connect(audioCtx.destination);
            
            // this channel will play and visualize the delay
            feedback.connect(delayNode);
            sourceNode.connect(delayNode);
            sourceNode.connect(panNode);
            panNode.connect(analyserNode);
            delayNode.connect(analyserNode);
			
			// here we connect to the destination i.e. speakers
			analyserNode.connect(audioCtx.destination);
            
            //Explanation:
            // the destination (speakers) will play both channels simultaneously
            //if we didn't connect both channels to the destination, 
            // we wouldn't be able to hear the delay effect
			return analyserNode;
		}
        
		
		function setupUI(){
            // changing the base track
			document.querySelector("#trackSelect").onchange = function(e){
                
                switch(e.target.value) {
                    case "wretched-weaponry":
                        trackType1 = true;
                        trackType2 = false;
                        isVocal = false;
                        document.getElementById("vocal-check").checked = false;
                        document.getElementById("intensity").value = "quiet";
                        currentTrackSet = trackSet_1;
                        trackIndex = 0;
                        currentTrack = currentTrackSet[trackIndex]; // plays the first track in the list by default
                        // preloaded the tracks in this set
                        for(var i in currentTrackSet) {
                            preloadAudio(currentTrackSet[i]);
                        }
                        break;
                        
                    case "birth-of-a-wish": 
                        trackType1 = false;
                        trackType2 = true;
                        isVocal = false; document.getElementById("version").value = "instrumental";
                        currentTrackSet = trackSet_2;
                        trackIndex = 0;
                        currentTrack = currentTrackSet[trackIndex]; // plays the first track in the list by default
                        // preloaded the tracks in this set
                        for(var i in currentTrackSet) {
                            preloadAudio(currentTrackSet[i]);
                        }
                        break;
                }
                
                // hides certain selector elements depending on which song is chosen
                if(trackType1) {
                    document.getElementById("version").style.display = "none";
                    document.getElementById("version-text").style.display = "none";
                    document.getElementById("intensity").style.display = "inline";
                    document.getElementById("intensity-text").style.display = "inline";
                    document.getElementById("vocals").style.display = "inline";
                }
                else if(trackType2) {
                    document.getElementById("intensity").style.display = "none";
                    document.getElementById("intensity-text").style.display = "none";
                    document.getElementById("vocals").style.display = "none";
                    document.getElementById("version").style.display = "inline";
                    document.getElementById("version-text").style.display = "inline";
                }
			};
            
            document.querySelector("#version").onchange = function(e){
                switch(e.target.value){
                    case "instrumental":
                        trackIndex= 0;
                        currentTrack = currentTrackSet[trackIndex];
                        var markedTime = audioElement.currentTime;
                        playStream(audioElement,currentTrack);
                        audioElement.currentTime = markedTime;
                        break;
                    
                    case "vocal":
                        trackIndex = 1;
                        currentTrack = currentTrackSet[trackIndex];
                        var markedTime = audioElement.currentTime;
                        playStream(audioElement,currentTrack);
                        audioElement.currentTime = markedTime;
                        break;
                        
                    case "become-as-gods":
                        trackIndex = 2;
                        currentTrack = currentTrackSet[trackIndex];
                        var markedTime = audioElement.currentTime;
                        playStream(audioElement,currentTrack);
                        audioElement.currentTime = markedTime;
                        break;
                        
                    case "this-cannot-continue":
                        trackIndex = 3;
                        currentTrack = currentTrackSet[trackIndex];
                        var markedTime = audioElement.currentTime;
                        playStream(audioElement,currentTrack);
                        audioElement.currentTime = markedTime;
                        break;
                }
            };
            
            document.querySelector("#intensity").onchange = function(e){
                switch(e.target.value){
                    case "quiet":
                        if(!isVocal){
                            trackIndex = 0;
                            currentTrack = currentTrackSet[trackIndex];
                            var markedTime = audioElement.currentTime;
                            playStream(audioElement,currentTrack);
                            audioElement.currentTime = markedTime;
                        }
                        else {
                            trackIndex = 1;
                            currentTrack = currentTrackSet[trackIndex];
                            var markedTime = audioElement.currentTime;
                            playStream(audioElement,currentTrack);
                            audioElement.currentTime = markedTime;
                        }
                        break;
                    case "medium":
                        if(!isVocal){
                            trackIndex = 2;
                            currentTrack = currentTrackSet[trackIndex];
                            var markedTime = audioElement.currentTime;
                            playStream(audioElement,currentTrack);
                            audioElement.currentTime = markedTime;
                        }
                        else {
                            trackIndex = 3;
                            currentTrack = currentTrackSet[trackIndex];
                            var markedTime = audioElement.currentTime;
                            playStream(audioElement,currentTrack);
                            audioElement.currentTime = markedTime;
                        }
                        break;
                    case "dynamic":
                        if(!isVocal){
                            trackIndex = 4;
                            currentTrack = currentTrackSet[trackIndex];
                            var markedTime = audioElement.currentTime;
                            playStream(audioElement,currentTrack);
                            audioElement.currentTime = markedTime;
                        }
                        else {
                            trackIndex = 5;
                            currentTrack = currentTrackSet[trackIndex];
                            var markedTime = audioElement.currentTime;
                            playStream(audioElement,currentTrack);
                            audioElement.currentTime = markedTime;
                        }
                        break;
                }  
            };
            
			//set up radio buttons
			document.querySelector("#fsButton").onclick = function(){
				requestFullscreen(canvas);
			};
            
            document.getElementById("glitch").checked = false;
            document.querySelector("#glitch").addEventListener("click", function() {
                isGlitched = !isGlitched;
            });
           
           document.getElementById("invert").checked = false; document.querySelector("#invert").addEventListener("click", function() {
                invert = !invert;
            });
           
           document.getElementById("blur").checked = false; document.querySelector("#blur").addEventListener("click", function() {
                blurred = !blurred;
                if(blurred) {
                    canvas.style.webkitFilter = "blur(5px)";
                }
                else {
                    canvas.style.webkitFilter = "blur(0px)";
                }
                
            });
            
            // turns vocals on and off if the track allows it
            document.getElementById("vocal-check").checked = false;
            document.querySelector("#vocal-check").addEventListener("click", function() {
                isVocal = !isVocal;
                
                if(isVocal) {
                    trackIndex++;
                    currentTrack = currentTrackSet[trackIndex];
                    var markedTime = audioElement.currentTime;
                    playStream(audioElement,currentTrack);
                    audioElement.currentTime = markedTime;
                }
                else {
                    trackIndex--;
                    currentTrack = currentTrackSet[trackIndex];
                    var markedTime = audioElement.currentTime;
                    playStream(audioElement,currentTrack);
                    audioElement.currentTime = markedTime;
                }
            });
            
            // hides certain selector elements depending on which song is chosen
            if(trackType1) {
                document.getElementById("version").style.display = "none";
                document.getElementById("version-text").style.display = "none";
                document.getElementById("intensity").style.display = "inline";
                document.getElementById("intensity-text").style.display = "inline";
                document.getElementById("vocals").style.display = "inline";
            }
            else if(trackType2) {
                document.getElementById("intensity").style.display = "none";
                document.getElementById("intensity-text").style.display = "none";
                document.getElementById("vocals").style.display = "none";
                document.getElementById("version").style.display = "inline";
                document.getElementById("version-text").style.display = "inline";
            }

            document.getElementById("trackSelect").value = "wretched-weaponry";
            document.getElementById("intensity").value = "quiet";
            document.getElementById("version").value = "instrumental";
            
            //set initial position of sliders
            document.getElementById("radiusSlider").value = 0.5;
            document.getElementById("delaySlider").value = 0;
            document.getElementById("panSlider").value = 0;
            
            // change the type of data stream to display
            document.getElementById("dataStreamSelect").value = "frequency-range"; document.querySelector("#dataStreamSelect").onchange = function(e) {
                if(dataStreamType == 1) {
                    dataStreamType = 2;
                }
                else {
                    dataStreamType = 1;
                }
            }
			
		}
        
		
		function playStream(audioElement,path){
			audioElement.src = path;
			audioElement.play();
			document.querySelector('#status').innerHTML = "Now playing: " + path;
		}
        
            
        function preloadAudio(path) {
            var audio = new Audio();
            // once this file loads, it will call loadedAudio()
            // the file will be kept by the browser as cache
            audio.addEventListener('canplaythrough', loadedAudio, false);
            audio.src = path;
        }
        
        
        function loadedAudio() {
            // this will be called every time an audio file is loaded
            // we keep track of the loaded files vs the requested files
            filesLoaded++;
            if(filesLoaded == currentTrackSet.length){
                // all have loaded
                filesLoaded = 0;
                playStream(audioElement, currentTrack);
            }
        }
        
		
		function update() { 
            
			// this schedules a call to the update() method in 1/60 seconds
			requestAnimationFrame(update);
            
            // create a new array of 8-bit integers (0-255)
			var data = new Uint8Array(analyserNode.frequencyBinCount); 			
			/*
				Nyquist Theorem
				http://whatis.techtarget.com/definition/Nyquist-Theorem
				The array of data we get back is 1/2 the size of the sample rate 
			*/
			
            if(dataStreamType == 1) {
                // populate the array with the frequency data
			     // notice these arrays can be passed "by reference" 
                analyserNode.getByteFrequencyData(data);
            }
            else {
                // OR
			     analyserNode.getByteTimeDomainData(data); // waveform data
            }
			
            // apply delay to audio
            //change the amount of reverb with the slider
            document.querySelector("#delaySlider").onchange = function(e) {
                delayAmount = (e.target.value)
            };
            delayNode.delayTime.value=delayAmount;
            
            //adds a stereo panning effect to the audio
            // pans the audio left or right depending on the position of the slider
            document.querySelector("#panSlider").onchange = function(e){
                panNode.pan.value = e.target.value;
            }
            
                                                    
            //change the maxRadius with the slider
            document.querySelector("#radiusSlider").onchange = function(e) {
                maxRadius = (e.target.value * 200)
            };
			
			// DRAW!
			ctx.clearRect(0,0,800,600);
            ctx.fillStyle = "#918B7D";
            ctx.fillRect(0,0, 800, 600);
            ctx.strokeStyle = 'rgba(0,0,0,1)'; 
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; 
            
            // create the radial pattern around the center-piece
            var angle = 2*Math.PI/NUM_SAMPLES;
            ctx.save();
            ctx.translate(320, 200); // move to the center of the canvas
            
			// loop through the data and draw!
			for(var i=0; i< data.length; i++) { 
                
                //draw the bars in the radial pattern
                ctx.rotate(angle);
                var val = data[i]/256*100;
                var yPos;
                if(dataStreamType == 1){
                    yPos = maxRadius;
                    val *= 1.2;
                }
                else{
                    yPos = circleRadius;
                }
                ctx.fillRect(-1, yPos, 2, val);
                
                // draw the lines on the outer edges of the bars
                var nextVal;
                if(i == data.length - 1){
                    nextVal = data[0]/256*100;
                }
                else{
                    nextVal = data[i+1]/256*100;
                }
                ctx.beginPath();
                ctx.moveTo(2, (yPos + val)+ 20);
                ctx.lineTo(-2, (yPos + nextVal) + 20);
                ctx.stroke();

			}
            ctx.restore();
            
            
            // draw the pulsating circle in the center
            for(var i = 0; i<data.length; i++){
                                         
                var percent = data[i] / 255;
                circleRadius = percent * 2 * maxRadius;
                
                if(dataStreamType == 1){
                   
                    if(circleRadius < minRadius){
                        circleRadius = minRadius;
                    }
                    else if(circleRadius > maxRadius){
                        circleRadius *= percent/2;
                    } 
                }

                ctx.fillStyle = 'rgba(61, 59, 52, 1)';
                ctx.beginPath();
                ctx.arc(canvas.width/2, canvas.height/2, circleRadius, 0, 2*Math.PI, false);
                ctx.fill();
                ctx.closePath();
            }
            
            // draw the center image
            ctx.drawImage(document.getElementById("emil"), 180,95, 280, 210);
            
            manipulatePixels();
			 
		} 
        
        
		
		// HELPER
		function makeColor(red, green, blue, alpha){
   			var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   			return color;
		}
        
        var randInt = function(a,b){
            return ~~(Math.random() * (b-a) + a);
        };
        
            
        //helper for looping through and setting random heights to splice from the canvas
        var glitchImg = function(data, width, height){
            for(var i = 0; i < randInt(1, 13); i++) {
                var shiftLeft;
                var randBit = randInt(0,1);
                if(randBit === 0) {
                    shiftLeft = true;
                }
                else{
                    shiftLeft = false;
                }
                var randRow = Math.floor(randInt(0, height*4));
                var spliceWidth = 4* randInt(5, canvas.width/5);
                var spliceHeight = randInt(5, canvas.height/2);
                // rows
                for(var j = randRow; j < randRow + spliceHeight; j++){
                    //columns
                    for(var k = 0; k < width; k++){
                        var index = (j*width)+k * 4;
                        var newIndex;
                        if(shiftLeft){
                            newIndex = index - spliceWidth;
                            //if pixels are shifted off the canvas, move them to the other side of the canvas
                            if(((newIndex-(j*width))/4) < 0) {
                                data[newIndex + (width*4)] = data[index];
                                data[newIndex + (width*4)+1] = data[index + 1];
                                data[newIndex + (width*4)+2] = data[index + 2];
                                data[newIndex + (width*4)+3] = data[index + 3];
                            }
                            else{
                                data[index - spliceWidth] = data[index];
                                data[index - spliceWidth + 1] = data[index + 1];
                                data[index - spliceWidth + 2] = data[index + 2];
                                data[index - spliceWidth + 3] = data[index + 3];
                            }
                        }
                        else{
                            newIndex = index + spliceWidth;
                            //if pixels are shifted off the canvas, move them to the other side of the canvas
                            if(((newIndex - (j*width))/4) > width){
                                data[newIndex - (width*4)] = data[index];
                                data[newIndex - (width*4)+1] = data[index + 1];
                                data[newIndex - (width*4)+2] = data[index + 2];
                                data[newIndex - (width*4)+3] = data[index + 3];
                            }
                            else{
                                data[index + spliceWidth] = data[index];
                                data[index + spliceWidth + 1] = data[index + 1];
                                data[index + spliceWidth + 2] = data[index + 2];
                                data[index + spliceWidth + 3] = data[index + 3];
                            }
                        }
                    }
                }
            }
            
            
        };
        
        function manipulatePixels(){
            //i) Get all the rgba pixel data of the canvas by grabbing the
            // ImageData Object
            //https://developer.mozilla.org/en-US/docs/Web/API/ImageData
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            //ii) imageData.data is an 8-bit typed array - values range from 0-255
            // imageData.data contains 4 values per pixel: 4 x canvas.width x 
            // canvas.height = 1024000 values!
            // we're looping through this 60 FPS - wow!
            var data = imageData.data;
            var length = data.length;
            var width = imageData.width;
            var height = imageData.height;
            //iii) Iterate through each pixel
            // we step by 4 so that we can manipulate 1 pixel per iteration
            // data[i] is the red value
            // data[i+1] is the green value
            // data[i+2] is the blue value
            // data[i+3] is the alpha value
            
            for(var i = 0; i<length; i+=4) {
                if(invert) {
                    var red = data[i], green = data[i+1], blue = data[i+2];
                    data[i] = 255 - red;        //set red value
                    data[i+1] = 255 - green;   //set blue value
                    data[i+2] = 255 - blue;     //set green value
                    //data[i+3] is the alpha but we're leaving that alone
                }
            }
            
            if(randInt(0, 100) > 85){
                if(isGlitched){
                
                    glitchImg(data, width, height);
                
                }
            }
            
            
            // put the modified data back on the canvas
            ctx.putImageData(imageData, 0, 0);
           
        }
		
        
        
		 // FULL SCREEN MODE
		function requestFullscreen(element) {
			if (element.requestFullscreen) {
			  element.requestFullscreen();
			} else if (element.mozRequestFullscreen) {
			  element.mozRequestFullscreen();
			} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
			  element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
			  element.webkitRequestFullscreen();
			}
			// .. and do nothing if the method is not supported
		};
		
		window.addEventListener("load",init);
	}());
        
	