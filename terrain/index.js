function square(p1, p2, p3, p4, height_map, jitter) {
    // Find the midpoint of the current square
    let midpoint_x = Math.floor((p1.x + p2.x + p3.x + p4.x) / 4);
    let midpoint_y = Math.floor((p1.y + p2.y + p3.y + p4.y) / 4);

    // This stores all pairs of points that lie on the same axis
    let pairs = []
    // All of the pairs that have already been visited
    let cached_pairs = [];
    // The four points of the square
    let points = [p1, p2, p3, p4]

    // We basically match up points here:
    //  - p1                  - p2
    // @---------------------@
    // |                     |
    // |                     |
    // |                     |
    // |                     |
    // |                     |
    // |                     |
    // |                     |
    // |                     |
    // |-p3                  |- p4
    // @---------------------@
    // This will form pairs of:
    //   [p1, p2]
    //   [p1, p3]
    //   [p2, p4]
    //   [p4, p3]
    for (let point1 of points) {
        for (let point2 of points) {
            if (point1 != point2) {
                if ((point1.x == point2.x || point1.y == point2.y) && cached_pairs.indexOf(point1.x + " " + point1.y + " " + point2.x + " " + point2.y) == -1 && cached_pairs.indexOf(point2.x + " " + point2.y + " " + point1.x + " " + point1.y) == -1) {
                    pairs.push([point1, point2]);
                    cached_pairs.push(point1.x + " " + point1.y + " " + point2.x + " " + point2.y)
                }
            }
        }
    }

    // We need to average the heights of the two points to determine the height of the point in between them including a random amount of jitter
    // in the range -jitter to +jitter and apply it to the point

    let average = 0
    for (let pair of pairs) {
        let p1 = pair[0];
        let p2 = pair[1];
        let value = (height_map[p1.y][p1.x] + height_map[p2.y][p2.x]) / 2;
        value += (Math.random() * ((jitter) - (-jitter))) + (-jitter);

        if (value < 0) value *= -1;
        if (value > 1) value = 1;

        let x_loc = Math.floor((p1.x + p2.x) / 2);
        let y_loc = Math.floor((p1.y + p2.y) / 2);
        height_map[y_loc][x_loc] = value;
        average += value;
    }

    // Subdivide this square into four smaller squares which can be passed back to the function to be calculated next
    let squares = [];
    for (let point of points) {
        let temp = [{
            "x": point.x,
            "y": point.y
        }, {
            "x": midpoint_x,
            "y": point.y
        }, {
            "x": midpoint_x,
            "y": midpoint_y
        }, {
            "x": point.x,
            "y": midpoint_y
        }];

        // Calculate the maximum distance between the points
        let max_x_dist = 0;
        let max_y_dist = 0;

        for (let p1 of temp) {
            for (let p2 of temp) {
                if (Math.abs(p1.x - p2.x) > max_x_dist) max_x_dist = Math.abs(p1.x - p2.x);
                if (Math.abs(p1.y - p2.y) > max_y_dist) max_y_dist = Math.abs(p1.y - p2.y);
            }
        }

        // If it is 1 it means that it cannot be subdivided any more so we don't include it
        if (max_x_dist != 1 && max_y_dist != 1) squares.push(temp);
    }

    // Set the center of the square to the averatge of the points around it
    height_map[midpoint_y][midpoint_x] = average / 4;

    // And return the latered height map and the new set of squares to render
    return [height_map, squares];
}

// Create the data for the initial plot. This just initialises the view which will then have the new
//   map placed on top of it
var data_z1 = {
    z: [
        [0, 0],
        [0, 0]
    ],
    type: 'surface',
    zaxis: {
        range: [0, 1]
    }
};
// Pass it to plotly to render the surface and then hide the loading view. This just means that the user
//   wont be able to interact with the page until Plotly has completely loaded and is initialised
Plotly.newPlot('plot_div', [data_z1]).then(function() {
    $("#loading").css("display", "none")
});

/**
 * Actually generates a map of a given size. The resolution is turned into the size of the map using the expression
 * (2^r) + 1 which guarantees that the map will be divisible correctly when forming the map as we must subdivide
 * the map.
 * @param {Number} resolution an integer that will be used to calculate the size of the map as described above
 * @param {Number} jitter a float value which represents the initial amount of jitter used when adding randomness to point
 * @param {Number} dampening_factor a float value which represents how much jitter should be removed after each run. This means that it will 
 * get less random as more subdivisions take place
 * @param {Number} min_initial an integer value which represents the lowest posible value of the initial points
 * @param {Number} max_initial an integer value which represents the greatest posible value of the initial points
 */ 
function generate(resolution, jitter, dampening_factor, min_initial, max_initial) {
    // Calculate the size of the map that we will be calculating
    let size = Math.pow(2, resolution) + 1;

    // And initialse a height map of size size*size and fill it with 0
    let height_map = [];
    for (let i = 0; i < size; i++) {
        height_map[i] = [];
        for (let j = 0; j < size; j++) {
            height_map[i][j] = 0;
        }
    }

    // Decrement the size which allows the process below to work. This size is how many points there are but because we
    // start referencing the array, we need to remove 1 to give valid array locations
    size -= 1;

    // Calculate random initial points between the minimum and maximum initial points. This is not perfectly random and
    // will have some bias towards particular values but it does not actually matter that much
    height_map[0][0] = (Math.random() * ((max_initial) - (min_initial))) + (min_initial);
    height_map[0][size] = (Math.random() * ((max_initial) - (min_initial))) + (min_initial);
    height_map[size][0] = (Math.random() * ((max_initial) - (min_initial))) + (min_initial);
    height_map[size][size] = (Math.random() * ((max_initial) - (min_initial))) + (min_initial);

    // Make the first modification so we have a valid result to work off and apply the effects to the height map
    let result = square({
        "x": 0,
        "y": 0
    }, {
        "x": 0,
        "y": size
    }, {
        "x": size,
        "y": 0
    }, {
        "x": size,
        "y": size
    }, height_map, jitter);
    height_map = result[0];
    result = result[1];

    for (let i = 0; i < resolution - 1; i++) {
        // If the result gives us no more squares to check, it means that the grid has been subdivided completely
        // and there are no more points to calculate, therefore we can just break out as we are done
        if (result.length == 0) break;

        // Reduce the jitter by the dampening factor to make it less random during each iteration
        jitter *= dampening_factor;

        // We need to store all of the squares that we need to calculate on the next run. This will ultimately become
        // the result value but as we need to use result in the loop below we just use a temp value which will overwrite
        // it at a later time
        let temp = [];

        // For each square that needs processing, calculate the changes and apply them to the height map and then
        // add all of the points that need processing next time to the result list
        for (let s of result) {
            let tresult = square(s[0], s[1], s[2], s[3], height_map, jitter);
            height_map = tresult[0];
            temp = temp.concat(tresult[1]);
        }

        // Overwrite the result with all the new squares that need processing
        result = temp;
    }

    // Calculate the minimum point on the map and the maximum point in the height map, the sum of all the points get the 
    // number of points on the map
    minimum = 1000;
    maximum = -1000;
    sum = 0;
    count = height_map.length * height_map[0].length;
    for (let y of height_map) {
        for (let x of y) {
            if (x > maximum) maximum = x;
            if (x < minimum) minimum = x;
            sum += x;
        }
    }

    // Calculate the average level of points so we can add a marker
    average = sum / count;
    // Calculate an estimate of the water level, I can't remember where I got this from of if it was just based on look but
    // I'm leaving it in
    water = average - ((average - minimum) / 2);
    // To pass the levels to Plotly they need to have a valid set of x points so we just build it up from the size of the grid
    avg_z = [];
    water_z = [];
    for (let i = 0; i < size + 1; i++) {
        avg_z[i] = [];
        water_z[i] = [];
        for (let j = 0; j < size + 1; j++) {
            avg_z[i][j] = average;
            water_z[i][j] = water;
        }
    }

    // Set up the properties of the map
    var contours = {
        "y": {
            "highlight": false,
            "show": true,
            "width": 2,
            "usecolormap": true
        },
        "x": {
            "highlight": false,
            "show": true,
            "width": 2,
            "usecolormap": true
        },
        "z": {
            "highlight": false,
            "show": false
        }
    };
    // Set up the properties of the average data marker
    var avg_data = {
        z: avg_z,
        type: "surface",
        "contours": contours,
        "hidesurface": true,
        "name": "Average Level"
    };
    // Set up the properties of the water level marker
    var water_data = {
        z: water_z,
        type: "surface",
        "contours": contours,
        "hidesurface": true,
        "name": "Water Level (estimated)"
    };

    // Set up the properties of the actual map that we will be rendering including the maximum and minimum possible values
    // for the z axis
    var data_z1 = {
        z: height_map,
        type: 'surface',
        zaxis: {
            range: [0, 1]
        }
    };

    // And apply the new plot
    Plotly.newPlot('plot_div', [data_z1, avg_data, water_data]).then(function() {
        $("#loading").css("display", "none");
    });
}