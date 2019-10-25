/**
 * main.js
 * 
 * This application is a very simple music player. It loads a sound file then 
 * changes the view according to which frequencies are played.
 * 
 * @author Dan Isler
 * @author Ryan Isler
 * @author Chris Isler
 */

var WIDTH
var HEIGHT
var REMOVE_UI = false
var MAX_CIRCLES = 5000;
var isRyanCode = getQueryVariable("a"); // deprecated
const selVisual = document.getElementById('visuals'), BOTH = 'BOTH', BOTH_B = 'BOTH_B', BARS = 'BARS', CIRCLES = 'CIRCLES'
var selectedVisualizer = selVisual.options[selVisual.selectedIndex].value

// Base circle class
class Circle {

  constructor(circleX, circleY, circleRadius, myCtx, circleAttributes, circleId = null, destroyTimer = null) {

    this.changeSpeed = circleAttributes.changeSpeed;

    // X coordinate on screen
    this.x = circleX

    // Y coordinate on screen
    this.y = circleY

    // Change of X position per update
    this.changeX = 0

    // Change of Y position per update
    this.changeY = 0

    // Radius of circle 
    this.radius = 50

    this.circleAttr = circleAttributes

    this.ctx = myCtx;
    
    this.destroyTimer = destroyTimer

    this.isMain = false
    
    if(this.destroyTimer == null) {
      this.isMain = true
    }

    this.circleId = circleId
    
  }

  // Write the circles graphics (called every frame for a rewrite)
  audioUpdate() {
    // Write
    this.ctx.beginPath();
    this.ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);
    this.ctx.fillStyle = rgba(this.circleAttr.r, this.circleAttr.g, this.circleAttr.b, this.circleAttr.a)
    this.ctx.fill()
    this.ctx.strokeStyle = rgba(255,255,255,0);
    this.ctx.stroke();
  }

  // Move the circle around and handle circle removal
  update() {

    this.changeX += -this.changeSpeed + random(this.changeSpeed * 2)
    this.changeY += -this.changeSpeed + random(this.changeSpeed * 2)

    this.x += this.changeX
    this.y += this.changeY

    if(this.destroyTimer != null) {

      this.destroyTimer -= 1
      if(this.destroyTimer < 20) {
        this.circleAttr.a -= 0.03;
      }
      if(this.destroyTimer < 1) {
        this.destroy(); 
      }

    }

    if(this.isMain) {
      if(random(100) == 0) {
        //extraCircles
      }
    }
  }
  
  // Remove this circle from the array of circle (clearing up space)
  destroy() {
    if(!this.isMain) {
      extraCircles[this.circleId] = null;
    }
  }
}

// This looks ... unused
var mainCircles = [
  new Circle(100, 100, 50, document.getElementById("canvas").getContext("2d"), {r:200, g: 100, b: 5})
];

// if(isRyanCode) {
  mainCircles = [];			
// }

// Implement primary circles array
var extraCircles = new Array(MAX_CIRCLES);
extraCircles.fill(null);

// Adds a circle to the extraCircles array
function addExtraCircle(x, y, radius, canvasContext, circleAttrs, circleDuration = 90) {
  for(let i = 0; i < extraCircles.length; i++) {
    if(extraCircles[i] == null) {
      extraCircles[i] = new Circle(x, y, radius, canvasContext, circleAttrs, i, circleDuration);
      return true;
      break;
    }
  }
  return false;
}

// Get variables from URL string
function getQueryVariable(variable) {

  var query = window.location.search.substring(1);
  var vars = query.split("&");

  for (var i=0;i<vars.length;i++) {

    var pair = vars[i].split("=");
    
    if(pair[0] == variable) 
      return pair[1];

  }
  return(false);
}

/**
 * Returns a random number from 0 to exclusiveRand
 * 
 * @param exclusiveRand {Number} - Random number.
 */
function random(exclusiveRand) {
  return Math.floor(exclusiveRand * Math.random());
}

// Update each circle
function circleUpdateHandler() {

  for(let i = 0; i < mainCircles.length; i++) {
    mainCircles[i].update();
  }
  
  for(let i = 0; i < extraCircles.length; i++) { 
    if(extraCircles[i] != null) {
      extraCircles[i].update();
    }
  }

}

// Set the interval for updating ALL circles
function initCircles() {
  var myTimeOut = setInterval(circleUpdateHandler, 35);
}

/**
 * Handle all circles' graphic updates based on the audio
 * 
 * _frequencyLevel = soundData[_frequency];
 * @param soundData - data array
 * @param bufferLength - buffer length
 * @param ctx - canvas object
 */
function funcCircles(soundData, bufferLength, ctx) {

  for(let i = 0; i < extraCircles.length; i++) { 
    if(extraCircles[i] != null) {
      extraCircles[i].audioUpdate();
    }
  }

  for (var _frequency = 0; _frequency < bufferLength; _frequency++) {
    
    if(soundData[_frequency] > 200) { 
      var circleAttrs = {
        r: (_frequency < 30) ? soundData[_frequency] : 0,
        g: (_frequency < 60) ? soundData[_frequency] : 0,
        b: (_frequency > 90) ? soundData[_frequency] : 0,
        a: 0.5,
        //changeSpeed: soundData[_frequency] * 0.010		
        changeSpeed: 5
      }
      addExtraCircle(WIDTH / 2, HEIGHT / 2, soundData[_frequency], ctx, circleAttrs, 50);
    }
    
  }

}

// Initialize 
window.onload = function() {

  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  
  // Handle music file upload
  file.onchange = function() {

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var files = this.files;
    
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    console.log(`WIDTH`, WIDTH)
    console.log(`HEIGHT`, HEIGHT)
  
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 256;

    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    
    console.log(bufferLength);

    var barWidth = (WIDTH / bufferLength) * 2.5;
    var barHeight;
    var x = 0;
  
    // if(isRyanCode != false) {
      initCircles();
    // }

    // Render our animation (as soon as the graphics card is ready - go)
    function renderFrame() {

      // Animate
      requestAnimationFrame(renderFrame);
    
      x = 0;
    
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      /**
       * Array of size 128 where lower numbers are low frequencies and higher numbers are high frequencies
       * Each item in the index is a number from 0-255
       * 
       * Example
       * [
       * 		214, 239, 233, 205, 178, 164, 161, 165, 
       * 		165, 162, 159, 145, 124, 137, 143, 148, 
       * 		136, 132, 134, 113, 90, 71, 77, 82, 85, ...
       * ]
       * 
       * The idea is to create special functions that create interesting abstract shapes/animations based on random rules on the frequency spectrum
       */

      //  funcOriginal()
      //  funcSquare()
      if(selectedVisualizer == BARS) {
        funcBigBars()
      } 
      else if(selectedVisualizer == BOTH) {
        funcBigBars()
        funcCircles(dataArray, bufferLength, ctx);
      }  
      else if(selectedVisualizer == BOTH_B) {
        funcCircles(dataArray, bufferLength, ctx);
        funcBigBars()
      } 
      else {
        funcCircles(dataArray, bufferLength, ctx);
      }
    }
    
    // Display audio bars
    function funcBigBars() {

      // we're looping through the frequencies so... 
      // _frequency < ~40 = low freq, 
      // _frequency > ~40 && _frequency < ~80 = mid freq,
      //  _frequency > ~80

      const randomColorFactor = 30
      const chunks = bufferLength
      const chunkSize = Math.floor(WIDTH / chunks)
      const bufferCutOff = Math.floor(bufferLength / chunks)	
      const xCutOffsSortedMaxToMin = Array(chunks).fill(0).map((i, _idx) => _idx).reverse().map( _i => (bufferCutOff * (_i)) )

      for (var _frequency = 0; _frequency < bufferLength; _frequency++) {

        for(var i = xCutOffsSortedMaxToMin.length - 1; i >= 0; i--) {
          const xCutOff = xCutOffsSortedMaxToMin[i]
          if(_frequency > xCutOff) {
            x = chunkSize * Math.abs(xCutOffsSortedMaxToMin.length - i)
          }
        }
        
        _frequencyLevel = dataArray[_frequency];
        
        const y = 0

        const barWidth = chunkSize
        const barHeight = HEIGHT

        const grd = ctx.createLinearGradient(0,0,0,HEIGHT);
        const r = 0
        const g = 0
        const b = _frequencyLevel - 25
        const bEnd = _frequencyLevel
        grd.addColorStop(0, rgb(b, g, r));
        grd.addColorStop(1, rgba(b, g, r, 0.2));
        // grd.addColorStop(1, rgb(g, r, g));

        // set the color
        // ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillStyle = grd

        // set x, y, width, height
        ctx.fillRect(x, y, barWidth, barHeight);

      }
    }

    // Square
    function funcSquare() {

      // we're looping through the frequencies so... 
        // _frequency < ~40 = low freq, 
        // _frequency > ~40 && _frequency < ~80 = mid freq,
        //  _frequency > ~80
      for (var _frequency = 0; _frequency < bufferLength; _frequency++) {

        const rand3 = Math.random() * 3
        const rand10 = Math.random() * 10
        const rand25 = Math.random() * 25
        
        _frequencyLevel = dataArray[_frequency];
        
        const y = HEIGHT / 4 + (_frequency *rand3)
        const x = WIDTH / 4 + (_frequency*rand3)

        const barWidth = Math.abs(-_frequencyLevel)
        const barHeight = _frequencyLevel

        const r = _frequencyLevel
        const g = _frequencyLevel
        const b = _frequencyLevel

        // set the color
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";

        // set x, y, width, height
        ctx.fillRect(x, y, barWidth, barHeight);
      

        
        // var r = barHeight + (1 * (i/bufferLength));
        // var g = 250 * (i/bufferLength);
        // var b = 50;
      
        // ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        // ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      
        // x += barWidth + 1;
      }
    }

    // Render original circle
    function funcOriginal() {
      for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        var r = barHeight + (1 * (i/bufferLength));
        var g = 250 * (i/bufferLength);
        var b = 50;
      
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      
        x += barWidth + 1;
      }
    }
    
    audio.play();
    renderFrame();
    
    if(REMOVE_UI) {
      setOpacity(file, 0)
      setOpacity(audio, 0)
    }

  };

  // audio.src = ".\Watch It Burn Down\\music\\iterations\\25\\album_song_25.wav";
};

// Convert OOP rgb to str 'rgb(x, x, x)' format
function rgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`
}

// Convert OOP rgba to str 'rgba(x, x, x, x)' format
function rgba(r, g, b, a) {
  return `rgb(${r}, ${g}, ${b}, ${a})`
}

// Set opacity of DOM object
function setOpacity(el, amount) {
  el.style.opacity = amount;
}

// Check for change of select menu
selVisual.onchange = (e) => (selectedVisualizer = e.currentTarget.options[e.currentTarget.selectedIndex].value)