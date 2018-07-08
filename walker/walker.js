// Fetch the canvas element and get the graphics context from it
let canvas = $("canvas");
let g = canvas[0].getContext("2d");

// Set up the colours that we are using for this drawing
let backgroundStyle = "rgb(41,41,41)";
let foregroundStyle = "black";
let lineStyle = "rgba(255, 0, 0, 0.2)";

// Once we have our colours determined we want to just fill the canvas and blank it out
g.fillStyle = backgroundStyle;
g.beginPath();
g.rect(0, 0, 1000, 1000);
g.fill();
g.closePath();

// These are the chances that each node is picked. Eg in the configuration 
//  visited = 4
//  unvisited = 2
// then visited nodes are twice as likely to be visited than unvisited nodes
const visitedChance = 2;
const unvisitedChance = 8;

// This determines the width and height of the grid that the walk will be taking place on
const width = 200;
const height = 200;

// Initialise the grid
// Its a width x height grid so we just iterate through and build up an empty array
// The values in the grid refer to the amount of times that a node has actually be visited
//   by the walker.
// As each point has not been visited at this point, all points are set to 0
let grid = [];
for (let i = 0; i < height; i++) {
    let row = [];
    for (let j = 0; j < width; j++) {
        row.push(0);
    }
    grid.push(row);
}

// This is the amount of steps that the walker can take before it automatically stops
let steps = 200000 - 3;

// The active location of the walker right now
var activeX = 50;
var activeY = 50;

// This is a multiplier which is used to relate a coordinate on the grid to a coordinate on the canvas
// This is used to allow the canvas to be any size and the grid to be any size but drawing to still be okay
// The only issue with this is that if the canvas is not a perfect multiple of the grid, spheres will be drawn
//   wrong as they will not scale properly.
var scaleX = canvas.width() / grid[0].length;
var scaleY = canvas.height() / grid.length;

// Determine the colour maps
// The colour range goes from minColor -> maxColor with 'colorStops' possible steps in between
const minColor = [40, 40, 40];
const maxColor = [255, 255, 255];
const colorStops = 40;
// This stores the colors at each stop so we don't need to calculate them again
let colorInterpolation = [];

// The following code was copied from online so I can't really explain it...
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

function arrayToRGB(color) {
    return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
}

function getStop(level) {
    if (level >= colorStops) return arrayToRGB(colorInterpolation[colorInterpolation.length - 1]);
    return arrayToRGB(colorInterpolation[level]);
}

interpolateColors();

// Shorthand for drawing a circle to the grid.
// Note: converts grid coordinates to canvas coordinates
// Radius is not scaled.
function drawCircle(x, y, r) {
    g.beginPath();
    g.arc(x * scaleX, y * scaleY, r, 0, 2 * Math.PI);
    g.fill();
    g.closePath();
}

// Converts an amounts array to a probability array
// Eg:
// {a: 3, b: 4, c: 1}
// becomes
// {a: 0.375, b: 0.5, c: 0.125}
function amountsToProbabilities(amounts) {
    let sum = 0;
    for (let key of Object.keys(amounts)) {
        if (!amounts.hasOwnProperty(key)) continue;
        sum += amounts[key];
    }

    let probabilities = {};
    for (let key of Object.keys(amounts)) {
        if (!amounts.hasOwnProperty(key)) continue;
        probabilities[key] = amounts[key] / sum;
    }

    return probabilities;
}

// Based on a function found online.
// It uses the probabilities in the object to pick an element. 
// Those with the higher probability are more likely to be selected
// If for some reason it cannot select one (this should never happen if weights are correct) then it will default to the last element
// Note: all weights must sum to 1
function weightedRandom(probabilities) {
    let r = Math.random();
    let sum = 0;
    let keys = Object.keys(probabilities)
    for (let key of keys) {
        sum += probabilities[key];
        if (sum > r) return key;
    }

    console.log("Something is broken");
    return probabilities[keys[keys.length - 1]];
}

// Causes the walker to take one step
function step() {
    // This holds each point and how likely it is for the walker to step there
    // in an integer value. See the description of visited and unvisited chance above for details
    let amounts = {};

    // For each block below, it checks if the point is valid (not off the grid)
    // Then it checks if the point has been visited yet and then adds it to the amounts object with the correct chance
    // This is repeated for the point above, below, to the left and to the right

    // ABOVE
    if (activeY - 1 >= 0) {
        let above = grid[activeY - 1][activeX];
        if (above === 0) amounts[[activeY - 1, activeX]] = unvisitedChance;
        else amounts[[activeY - 1, activeX]] = visitedChance;
    }

    // LEFT
    if (activeX - 1 >= 0) {
        let left = grid[activeY][activeX - 1];
        if (left === 0) amounts[[activeY, activeX - 1]] = unvisitedChance;
        else amounts[[activeY, activeX - 1]] = visitedChance;
    }

    // RIGHT
    if (activeX + 1 < grid[0].length) {
        let right = grid[activeY][(activeX + 1)];
        if (right === 0) amounts[[activeY, activeX + 1]] = unvisitedChance;
        else amounts[[activeY, activeX + 1]] = visitedChance;
    }

    // BELOW
    if (activeY + 1 < grid.length) {
        let below = grid[(activeY + 1)][activeX];
        if (below === 0) amounts[[activeY + 1, activeX]] = unvisitedChance;
        else amounts[[activeY + 1, activeX]] = visitedChance;
    }

    // Converts the amounts array into proper probabilities that we can select from
    // Then select a new point (for some reason called post) and split it to get the individual points
    // This is because while you can use an array as a key it is secretly turned into a string when you do
    // Additionally, when you split this, the elements are still strings meaning that you must parse them first
    //   as you will see below.
    let probs = amountsToProbabilities(amounts);
    let newPost = weightedRandom(probs).split(",");

    // Reset the style so we are ready to draw the points
    g.fillStyle = foregroundStyle;
    g.strokeStyle = lineStyle;
    g.lineWidth = 1;

    // Determine our new x and y from the point
    activeY = parseInt(newPost[0]);
    activeX = parseInt(newPost[1]);

    // Increment this point on the grid so we have an active value to draw from
    grid[activeY][activeX] += 1;

    // Determine the colour that we are meant to be using at this point for this many visits and then
    //  render a circle at this point on the grid using half the amount of times this point has been 
    //  visited as a radius.
    g.fillStyle = getStop(grid[activeY][activeX]);
    drawCircle(activeX, activeY, grid[activeY][activeX] / 2);
}

// Count is the amount of steps we've taken
// Last is the last percentage that was printed to the screen
let count = 0;
let last = 0;

// In a single run, we take a step and determine how far through the process we are as a percentage
// If this is different to the last one we printed, we output it and save it
// This stops it from spamming the console when we don't actually care that much
// When we have reached the desired amount of steps, we call the complete function
function animate(time) {
    step();
    count++;

    if (count < steps) {
        let p = Math.round((count / steps) * 100);
        if (p !== last) {
            console.log(p + "%");
            last = p;
        }
    } else {
        complete();
    }
}


// Triggering of the animation below, either when the user presses the 's' key or hits the button
$(document).keypress(function(e) {
    if (e.which === 115) run();
});
$("#run").click(run);

// This is where the actual animation takes place
// I tried using requestAnimationFrame but it didn't seem to work quick enough for me
// So we are using setInterval with a 1ms delay. 
// On each run we try to take 50 steps
// If we reach the end of the run then we just clear the interval and break out so
//   we don't end up spamming the complete function
function run() {
    let id = setInterval(function() {
        for (let i = 0; i < 50; i++) {
            animate();
            if (count >= steps) {
                clearInterval(id);
                break;
            }
        }
    }, 1);
}

// When everything is complete, we want to work out some stats about the run so we calculate:
// 1) Percentage of points visited
// 2) Amount of points unvisited
// 3) Total points available
// And print it all out to the console.
function complete() {
    let visitedSpaces = 0;
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] > 0) visitedSpaces++;
        }
    }

    let gridSize = grid.length * grid[0].length;
    let percentage = visitedSpaces / gridSize;
    console.log("Visited " + Math.round(percentage * 100) + "% of the grid.");
    console.log("  => " + (gridSize * (1 - percentage)) + " points of " + gridSize + " are unvisited");
    console.log("  => Maximum number of points that could theoretically be visited is " + steps);
}