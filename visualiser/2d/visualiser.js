console.log("This project uses Pizzicato which was authored by Alejandro Mantecon Guillen. It is released under the MIT license which is available at their repo where: https://github.com/alemangui/pizzicato/blob/master/LICENSE.");

const minColor = [201, 75, 75];
const maxColor = [144, 218, 208];
const colorStops = 100;
let colorInterpolation = [];

// The following function was taken from https://graphicdesign.stackexchange.com/a/83867
// As a result, I don't actually know how it works. Took people smarter than I to do that
// I've made some modifications to this to make it work in the scenario but its basically the same

function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) {
        factor = 0.5;
    }
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

function interpolateColors() {
    let stepFactor = 1 / (colorStops - 1);
    for (let i = 0; i < colorStops; i++) {
        colorInterpolation.push(interpolateColor(minColor, maxColor, stepFactor * i));
    }
}

/**
 * Converts an RGB array such as that returned by getStop into a CSS rgb string of style `rgb(<red>, <green>, <blue>)`.
 * @param {Array} color a three element array holding r g b values in that order with values between 0-255
 */
function arrayToRGB(color) {
    return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
}

/**
 * Returns a color at a particular distance within the interpolation range. If the requested stop is too large, the last element will be returned
 * @param {Number} level the interpolation stop to fetch
 * @return {Array} the color at this stop or at the last stop if the number if too large
 */
function getStop(level) {
    if (level >= colorStops) return colorInterpolation[colorInterpolation.length - 1];
    return colorInterpolation[level];
}

// Generate a 100 stops between the min and max colours above which will be stored in colorInterpolation
interpolateColors();

function visualise(data) {
    var analyser = Pizzicato.context.createAnalyser();
    var sound = new Pizzicato.Sound(data, function() {
        // Attach the analyser to the actual sound file that is playing
        sound.connect(analyser);
        // Define our size so we know how many points we will be getting
        analyser.fftSize = 2048;
        // This is how many points we are actually getting. It should be equal to fftSize/2 so 1024 which is the
        //   number of spheres we created earlier
        var bufferLength = analyser.frequencyBinCount;
        
        // Initialise two arrays to hold our data
        var timeDomainData = new Uint8Array(bufferLength);
        var frequencyData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeDomainData);

        // Get a canvas defined with ID "oscilloscope"
        var canvas = document.getElementById("oscilloscope");
        var canvasCtx = canvas.getContext("2d");

        let angleChange = (Math.PI * 2) / bufferLength;
        let activeAngle = 0;
        let angleOffset = (Math.PI * 2) / 2000;
        let activeAngleOffset = 0;

        // draw an oscilloscope of the current audio source

        function draw() {
            requestAnimationFrame(draw);

            // The center of the circle. As the canvas is 900x900, the center is therefore 450x450
            let cX = 450;
            let cY = 450;

            // Holds the angle that we are actually at when calculating the location of points
            let activeAngle = 0;

            // Fetch the data at the current instant of the music
            analyser.getByteFrequencyData(frequencyData);
            analyser.getByteTimeDomainData(timeDomainData);

            // Fill the canvas with a 0.1 opacity black rectangle which will fade out what is currently there slowly
            //   producting trails
            canvasCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            // We start at a given offset as we want the circles to rotate
            activeAngle = activeAngleOffset;

            // Get the average of the frequency data which will be used to get an index for the colour
            let total = 0;
            for (var i = 0; i < bufferLength; i++) {
                total += frequencyData[i];
            }
            total /= bufferLength * 1.0;
            // While the maximum possible value this could return is 255, I am using 128 here as it will provide more
            //   variation in colour as with the audio I was testing with, it very rarely got above 129. We have 100
            //   possible colours so we need an index in 0-99 inclusive
            let index = Math.round((total / 128.0) * 99);
            // If we do get a total average over 128, the index will come out greater than 99 which would throw an 
            //   error so we just cap it at 99 to be save
            if (index > 99) index = 99;
            // Then fetch the colour for this index value
            let colorValue = arrayToRGB(getStop(index));


            for (var i = 0; i < bufferLength; i++) {
                // Calculate the x and y location. We need to work out the radius of the sphere the point
                //   is being drawn to and we know that the maximum value we can receive is 255 so we turn it
                //   into a muliitpler and then times it by the scale to form the radius
                // Then using standard trig we can work out the x and y positions using the parametric equations
                //   of a circle
                // Then just draw a point at that position
                var v = (timeDomainData[i] / 255.0);
                var r = 430 * v;
                let x = cX + (r * Math.cos(activeAngle));
                let y = cY + (r * Math.sin(activeAngle));

                point(x, y, canvasCtx, colorValue);

                // Repeat the process for the frequency data but invert the initial result. This means that
                //   if it is at 0 it will be at the maximum radius forming a nice outer ring that closes inward
                //   as the values increase
                v = 1 - (frequencyData[i] / 255.0);
                r = (430 * v);
                x = cX + (r * Math.cos(activeAngle));
                y = cY + (r * Math.sin(activeAngle));

                // If the point is not at the outermost radius then render it. We do this just so we don't get a plain
                //   circle of points that doesn't move during the visualisation
                if (r !== 430) point(x, y, canvasCtx, "#EC5F1C");

                // And offset the angle for the next point
                activeAngle += angleChange;
            }

            // Once all points are rendered then offset the total angle so that the circle will rotate on the screen
            activeAngleOffset += angleOffset;
        }

        // Start the drawing which will initialise the view and start the song straight after
        draw();
        sound.play();

        // Once the song stops, we swap straight back to the song selection window
        sound.on("stop",function() {
            $("#s1").css("display", "flex");
            $("#s2").css("display", "none");
        });
    });

    /**
     * Shortcut for drawing a rectangular point on the canvas at the given position. Color defaults to black if excluded.
     * The rectangle has a size of 2 (width and height)
     * @param {Number} x the position the CENTER of the rectangle should be
     * @param {Number} y the position the CENTER of the rectangle should be
     * @param {CanvasRenderingContext2D} the canvas context to draw to
     * @param {string} a valid CSS color string to be be used to fill the rectangle
     */
    function point(x, y, ctx, color) {
        if (color === undefined) color = "#000000";
        ctx.beginPath();
        ctx.fillStyle = color;
        let size = 2;
        ctx.fillRect(x - (size / 2), y - (size / 2), size, size);
        ctx.closePath();
    }
}