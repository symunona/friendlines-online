define([
    'knockout',
    './draw-utils',
    'd3',
    'moment',
    'json!lib/utils/colors.json',
    'lib/stat',
    'lib/search'


], function(ko, utils, d3, moment, colors, stat, search) {

    var drawData;

    return {
        draw: draw,
        showSearchResults: showSearchResults

    };


    function convertToDrawingData(userActivity, params) {

        /* Get the minimum and the maximum date of the filtered data. */
        var firstAndLastMonthKey = utils.getFirstAndLastMonthKey(userActivity);

        /* This many months are visualized. */
        var dataTimeLength = getSlotDifference(
            firstAndLastMonthKey.lastMonthKey, firstAndLastMonthKey.firstMonthKey);

        /* According to the new starting point, create a full matrix of data do visualize. */
        var userDrawData = flattenUserData(userActivity, firstAndLastMonthKey.firstMonthKey, dataTimeLength);

        /* The first layer's data will come from this key. */
        var keyToVisualize = params.layerOneKey;

        /* Get the maximum values for scaling all user visualisations relatively. */
        var maxY = d3.max(userDrawData.map(function(oneUserData) {
            return d3.max(oneUserData.map(function(dataPoint) {
                return d3.max([dataPoint.inbound[keyToVisualize] || 0, dataPoint.inbound[keyToVisualize] || 0]);
            }));
        }));
        return {
            userActivity: userActivity,
            params: params,
            userDrawData: userDrawData,
            firstAndLastMonthKey: firstAndLastMonthKey,
            maxY: maxY,
            dataTimeLength: dataTimeLength,
            keyToVisualize: keyToVisualize
        };
    }



    function draw(selector, userActivity, params, filter, metadata) {


        // Clear the former graph TEMP 
        $(selector).html('');

        /* Calculate drawing data */
        drawData = convertToDrawingData(userActivity, params);

        drawData.metadata = metadata;

        /* Per user scale, take the max Y value to display
                    and since it is very rare, get the domain double.
                    This way it will be mapped to.  */

        initializeScales(drawData, params);

        if (params.type == 2) {
            createGraphFunctionsFlat(drawData);
        } else {
            createGraphFunctions(drawData);
        }

        calculateDimensions(drawData);

        createAxis(drawData, userActivity);


        drawData.zoom = d3.behavior.zoom()
            .x(drawData.timeAxisScaleX)
            .y(drawData.yAllGraphScale)
            .scaleExtent([0.1, 32])
            .on("zoom", zoomed.bind(this, drawData));



        drawData.svg = (drawData.svg ? drawData.svg : d3.select(selector).append("svg"))
            .attr("width", drawData.width + drawData.margin.left + drawData.margin.right)
            .attr("height", drawData.height + drawData.margin.top + drawData.margin.bottom);

        /* The viewport */
        if (!drawData.initialized) {

            /* Transform the margin */
            drawData.mainContainer = drawData.svg.append("g")
                .attr("transform", "translate(" + drawData.margin.left + "," + drawData.margin.top + ")")
                .call(drawData.zoom);

            drawData.mainrect = drawData.mainContainer.append("rect");

            /* Zoom container */
            drawData.zoomContainer = drawData.mainContainer.append("g");

            // TEMP reference square
            drawData.reference = drawData.zoomContainer.append("rect");

            /* Appending the axes */
            drawData.timeAxisNodes = drawData.mainContainer.append("g");

            drawData.userAxis = drawData.mainContainer.append("g");
        }

        drawData.mainrect
            .attr("width", drawData.width)
            .attr("height", drawData.height)
            .attr("class", "mainrect");

        // drawData.reference
        //     .attr("fill", "rgba(200,200,200,0.2)")
        //     .attr('transform', 'translate(0,' + drawData.yAllGraphScale(-0.5) + ')')
        //     .attr("width", drawData.timeAxisScaleX(1))
        //     .attr("height", 2 * params.yStep);

        setupAxisNodes(drawData);

        if (params.type == 2) {
            appendContentType2(drawData);
        } else {
            appendContent(drawData);
        }

        colorAxisNames(drawData);

        drawData.data.exit().remove();

        emphasizeYearTicks(drawData.timeAxisNodes);
        drawData.initialized = true;

    }


    /**
     * Bind mouse events 
     */
    function bind(drawData) {

    }


    /**
     * Creates data group objects, and sets their propertise
     */
    function appendContent(drawData) {

        drawData.data = drawData.zoomContainer.selectAll("g")
            .data(drawData.userDrawData);

        drawData.newDataGroups = drawData.data.enter().append('g');

        drawData.newDataGroups.attr("transform", function(d, i) {
            return 'translate(0,' + (((i + 1) * drawData.params.yStep * 2) + ')');
        }).attr('class', 'markerr');

        // drawData.newDataGroups.append('rect')
        //     .attr('width', drawData.timeAxisScaleX(drawData.dataTimeLength + 2))
        //     .attr('height', drawData.params.yStep * 2)
        //     .attr('transform', 'translate(0,' + (-drawData.maxY / 4) + ')')
        //     .attr('class', 'userBoundingBox');

        /* Top part of the graphs */
        drawData.newDataGroups.append("path")
            .attr("d", drawData.areaTopGraph)
            .attr('class', 'top')
            .attr("userId", function(d, i) {
                return Object.keys(drawData.userActivity)[i];
            })
            .style("fill", function(data, index) {
                return getColor(drawData.userActivity[index].id);
            })
            .on('mouseenter', mouseEnterToUser)
            .on('mouseup', openUser);

        /* Bottom part of the graph */
        drawData.newDataGroups.append("path")
            .attr("d", drawData.areaBottomGraph)
            .attr('class', 'bottom')
            .attr("userId", function(d, i) {
                return Object.keys(drawData.userActivity)[i];
            })
            .style("fill", function(data, index) {
                return getColor(drawData.userActivity[index].id);
            })
            .style("opacity", 0.7)
            .on('mouseenter', mouseEnterToUser)
            .on('mouseup', openUser);

        if (drawData.params.layerTwoKey) {
            // d3.svg.line()

            /* Top part of the graphs */
            drawData.newDataGroups.append("path")
                .attr("d", drawData.secondLayerPathTop)
                .attr('class', 'top')
                .attr("userId", function(d, i) {
                    return Object.keys(drawData.userActivity)[i];
                })
                .style("stroke", '#0f0')
                .style('fill', 'none');

            /* Bottom part of the graph */
            drawData.newDataGroups.append("path")
                .attr("d", drawData.areaBottomGraph)
                .attr('class', 'bottom')
                .attr("userId", function(d, i) {
                    return Object.keys(drawData.userActivity)[i];
                })
                .style("stroke", '#f00')
                .style('fill', 'none');



        }
    }

    function showSearchResults(messages) {
        drawData.zoom.scale(1);
        drawData.zoom.translate([0, 0]);

        drawData.searchResults = drawData.zoomContainer.selectAll("circle")
            .data(messages);

        drawData.newSearchResults = drawData.searchResults.enter();

        drawData.newSearchResults.append("circle")
            .attr("r", drawData.params.yStep / 2)
            .attr('cy', function(message, i) {
                var userId = message.fromUserId == drawData.metadata.mainUserId ? message.toUserId : message.fromUserId;

                var user = drawData.userActivity.find(function(e) {
                    return e.id == userId;
                });

                return drawData.yAllGraphScale(drawData.userActivity.indexOf(user));
            })
            .attr('cx', function(message, i) {

                var slot = getSlotDifference(toTimeKey(message.sendDate), drawData.firstAndLastMonthKey.firstMonthKey);
                return drawData.timeAxisScaleX(slot);
            })
            // .style("stroke", 'green')
            .style('fill', 'red')
            .attr('class', 'search-result')
            .on('click', function(message) {
                search.openThread(message);
            });
        drawData.searchResults.exit().remove();

    }



    /**
     * Creates data group objects, and sets their propertise
     */
    function appendContentType2(drawData) {

        drawData.data = drawData.zoomContainer.selectAll("g")
            .data(drawData.userDrawData);

        drawData.newDataGroups = drawData.data.enter().append('g');

        drawData.newDataGroups.attr("transform", function(d, i) {
            return 'translate(0,' + (((i + 1) * drawData.params.yStep * 2) + ')');
        }).attr('class', 'markerr');

        // drawData.newDataGroups.append('rect')
        //     .attr('width', drawData.timeAxisScaleX(drawData.dataTimeLength + 2))
        //     .attr('height', drawData.params.yStep * 2)
        //     .attr('transform', 'translate(0,' + (-drawData.maxY / 4) + ')')
        //     .attr('class', 'userBoundingBox');

        /* Top part of the graphs */
        drawData.newDataGroups.append("path")
            .attr("d", drawData.areaTopGraph)
            .attr('class', 'top')
            .attr("userId", function(d, i) {
                return Object.keys(drawData.userActivity)[i];
            })
            .style("fill", function(data, index) {
                return getColor(drawData.userActivity[index].id);
            })
            .on('mouseenter', mouseEnterToUser)
            .on('click', openUser);

    }


    function mouseEnterToUser(e, i) {
        // console.log(drawData.userActivity[i].userName);
        app.selectedUser(drawData.userActivity[i]);
        app.ui.statusColor(getColor(drawData.userActivity[i].id));
        app.ui.status(drawData.userActivity[i].userName);
        drawData.moved = false;
    }


    function openUser(e, i) {
        /* Only open if not panning */
        console.log('moved', drawData.moved);
        if (!drawData.moved)
            stat.openUser(drawData.userActivity[i].id);
    }


    /**
     * Sets the axis nodes properties
     */
    function setupAxisNodes(drawData) {
        drawData.timeAxisNodes
            .attr("class", "x axis")
            .attr("transform", "translate(0," + drawData.height + ")")
            .call(drawData.xAxis);

        drawData.userAxis
            .attr("class", "y axis")
            .call(drawData.yAxis);

        drawData.svg.selectAll('.tick')
            .on('click', function(i) {
                if (!drawData.userActivity[i]) {
                    console.error('user not found: ', i, arguments);
                }
                stat.openUser(drawData.userActivity[i].id);
            });
    }


    /**
     * returns a color from the te collection. If not present, makes a random
     * and saves it for later.
     */
    function getColor(id) {
        if (!colors[id]) {
            colors[id] = getRandomColor();
        }
        return colors[id];
    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }


    /**
     * Sets up the two Y and one X scale.
     * 
     * The X scale is time, mapped from 
     * the first interaction month of the
     * actual renderable users to the last, to 
     * (time difference in months) * (renderable users number) 
     * 
     * yScale is calculated from the maxY 
     * value, and is local for every user.
     *  
     * yAllGraphScale is mapped from the 
     * number of users represented to the 
     * number of users * params.yStep * 2
     */
    function initializeScales(drawData, params) {
        /* Once these assignments have been initialized, they will 
            update on every new call. */
        drawData.yScale = (drawData.yScale || d3.scale.linear())
            .domain([-drawData.maxY / params.divider, drawData.maxY / params.divider])
            .range([-params.yStep, params.yStep]);

        /* Each user is one line, the double of the  */
        drawData.yAllGraphScale = (drawData.yAllGraphScale ? drawData.yAllGraphScale : d3.scale.linear())
            .domain([0, drawData.userDrawData.length])
            .range([params.yStep * 2, (drawData.userDrawData.length * params.yStep * 2) + (params.yStep * 2)]);

        /* Horizontal axis is the month. */
        drawData.timeAxisScaleX = (drawData.timeAxisScaleX ? drawData.timeAxisScaleX : d3.scale.linear())
            .domain([0, drawData.dataTimeLength])
            .range([0, params.xStep * drawData.dataTimeLength]);

    }

    /**
     * Creates the SNAKE visualisation functions.
     */
    function createGraphFunctions(drawData) {
        /* Drawing functions, hi my name is MR HARDWIRE. 
                    Good enough for first packaged version */
        /* Top: inbound, Bottom: outbound */
        drawData.areaTopGraph = (drawData.areaTopGraph ? drawData.areaTopGraph : d3.svg.area())
            .x(function(d, i) {
                return drawData.timeAxisScaleX(i);
            })
            .y(function(d) {
                return 0;
            })
            .y1(function(d) {
                return drawData.yScale(-d.inbound[drawData.keyToVisualize] || drawData.params.minY);
            }).interpolate('basis');

        drawData.areaBottomGraph = (drawData.areaBottomGraph ? drawData.areaBottomGraph : d3.svg.area())
            .x(function(d, i) {
                return drawData.timeAxisScaleX(i);
            })
            .y(function(d) {
                return drawData.yScale(d.outbound[drawData.keyToVisualize] || drawData.params.minY);
            })
            .y1(function(d) {
                return 0;
            }).interpolate('basis');

        if (drawData.params.layerTwoKey) {
            drawData.secondLayerPathTop = (drawData.secondLayerPathTop ? drawData.secondLayerPathTop : d3.svg.line())
                .x(function(d, i) {
                    return drawData.timeAxisScaleX(i);
                })
                .y(function(d) {
                    return drawData.yScale(d.inbound[drawData.params.layerTwoKey] || drawData.params.minY);
                })
                .interpolate('basis');

            drawData.secondLayerPathBottom = (drawData.secondLayerPathBottom ? drawData.secondLayerPathBottom : d3.svg.line())
                .x(function(d, i) {
                    return drawData.timeAxisScaleX(i);
                })
                .y(function(d) {
                    return drawData.yScale(-d.outbound[drawData.params.layerTwoKey] || drawData.params.minY);
                })
                .interpolate('basis');

        }

    }


    /**
     * Creates the SNAKE visualisation functions.
     */
    function createGraphFunctionsFlat(drawData) {
        /* Drawing functions, hi my name is MR HARDWIRE. 
                    Good enough for first packaged version */
        /* Top: inbound, Bottom: outbound */
        drawData.areaTopGraph = (drawData.areaTopGraph ? drawData.areaTopGraph : d3.svg.area())
            .x(function(d, i) {
                return drawData.timeAxisScaleX(i);
            })
            .y(function(d) {
                return 0;
            })
            .y1(function(d) {
                // console.log(d)
                return d.sum[drawData.keyToVisualize] > drawData.params.error ? drawData.params.yFlatHeight : 0;
            }).interpolate('step-before');

    }

    function createAxis(drawData, userActivity) {
        /* Time axis. Create +2 for pufferning the data end */
        drawData.xAxis = (drawData.xAxis ? drawData.xAxis : d3.svg.axis())
            .scale(drawData.timeAxisScaleX)
            .orient("bottom")
            .tickValues(_.range(drawData.dataTimeLength + 2))
            .tickSize(-drawData.height)
            .tickFormat(function(val) {
                var timeKey = addTimeKey(drawData.firstAndLastMonthKey.firstMonthKey, val - 1);
                if (timeKey.substr(4, 2) == '01')
                    return timeKey.substr(0, 4);
                else
                    return (moment().month(parseInt(timeKey.substr(4, 2)) - 1).format('MMM'));
            });

        /* User list */
        drawData.yAxis = (drawData.yAxis ? drawData.yAxis : d3.svg.axis())
            .scale(drawData.yAllGraphScale)
            .orient("left")
            .tickSize(-drawData.width)
            .tickValues(userActivity.map(function(user, index) {
                return index;
            }))
            .tickFormat(function(val) {
                return userActivity[val].userName;
            })
            // .attr('userId', function(val) {
            //     return userActivity[val].id;
            // });


    }

    /**
     * Creates colored rectangles for user's names to the Y Axis.
     */

    function colorAxisNames(drawData) {

        drawData.userAxis.selectAll('g.tick').insert('rect', ':first-child')
            .attr('height', 20).attr('width', 120)
            .attr('transform', 'translate(-120,-10)')
            .attr('fill', function(e, i) {
                return getColor(drawData.userActivity[i].id);
            });
    }

    /**
     * Drawing information, sizez are computed from 
     * the actual window size. To be recalculated on  
     */
    function calculateDimensions(drawData) {

        drawData.margin = {
            top: 32,
            right: 0,
            bottom: 50,
            left: 100
        };
        drawData.width = window.innerWidth - drawData.margin.left - drawData.margin.right;
        drawData.height = window.innerHeight - drawData.margin.top - drawData.margin.bottom;
    }

    /**
     * Handles zoom events, updates coordinates,
     * manages axis scales.
     */
    function zoomed(drawData) {
        drawData.svg.select(".x.axis").call(drawData.xAxis);
        drawData.svg.select(".y.axis").call(drawData.yAxis);
        drawData.zoomContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        emphasizeYearTicks(drawData.timeAxisNodes);

        /* Do not open userscreen when panning */
        drawData.moved = true;
    }

    /**
     * Marks the year tick groups with a 'year' class.
     */
    function emphasizeYearTicks(timeAxisNodes) {
        timeAxisNodes.selectAll('text').each(function() {
            if (+this.textContent) {
                if (this.parentNode.classList)
                    this.parentNode.classList.add("year");
            }
        });
    }

    /**
     * Iterates over the user database mapping the
     * userActivity object to renderable lines, filling
     * the empty data.
     */

    function flattenUserData(userActivity, startSlot, dataLength) {
        return Object.keys(userActivity).map(function(userId) {
            return createUserActivityArray(userActivity[userId], startSlot, dataLength);
        });
    }

    /**
     * Creates an array from the userActivity object to a 
     * renderable data array, filling in the non existing
     * timekeys.
     * 
     * @returns the user line data array.
     */
    function createUserActivityArray(userActivity, startSlot, dataLength) {

        var activityArray = [];
        /* Counting from -1 to dataLength+1 creates a puffer zone 
          at the beginning and at the end to be nicer looking. */
        for (var i = -1; i <= dataLength + 1; i++) {
            var timeSlotKey = addTimeKey(startSlot, i);

            activityArray.push(_.extend({
                timeSlot: i,
                timeSlotKey: timeSlotKey,
                inbound: {},
                outbound: {},
                sum: {}
            }, userActivity.monthData[timeSlotKey]));

        }
        return activityArray;
    }

    /**
     * Adds i months to the timekey.
     */
    function addTimeKey(yyyymm, i) {
        return moment(yyyymm, "YYYYMM").add(i, 'months').format("YYYYMM");
    }

    /**
     * @returns the month difference between the first and the last interaction. 
     */
    function getStartAndEndDifference(userActivity) {
        return getSlotDifference(Object.keys(userActivity[0]), Object.keys(userActivity[Object.keys(userActivity).length]));
    }

    /**
     * @returns the month different between two YYYYMM keys.
     */

    function getSlotDifference(yyyymm1, yyyymm2) {
        return moment(yyyymm1, "YYYYMM").diff(moment(yyyymm2, "YYYYMM"), 'months');

    }

    function toTimeKey(date) {
        return moment(date).format('YYYYMM');
    }

    /**
     * ------------------------------------------------------------------------------
     */



});