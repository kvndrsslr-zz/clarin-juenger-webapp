angular.module('ir-matrix-cooc').factory('matrixVisualization', function (jobManager) {

    var root = d3.select('#visualization');
    var c = d3.scale.category10().domain(d3.range(10));
    var maxClusterDiameter = 0.25;
    var scope;

    var heatMap = {
        colorMap: [],
        setMap : function (m) {
            if (m instanceof Array) {
                this.colorMap = m;
            } else {
                this.colorMap = this.predefined[m];
            }
        },
        appendHeatScale: function (node, id, height) {
            node.append('rect')
                .style("stroke-width", 1)
                .style("stroke", "#000")
                .attr("width", 30)
                .attr("height", height)
                .attr("fill", "url(/korpora/#" + id + ")");
        },
        appendDefs: function (node, id) {
            var g = node.append('defs')
                .append('linearGradient')
                .attr('id', id)
                .attr('x1', "0%")
                .attr('x2', "0%")
                .attr('y1', "100%")
                .attr('y2', "0%");
            this.colorMap.forEach(function (x) {
                g.append('stop')
                    .attr('offset', (x[0]*100)+'%')
                    .attr('stop-color', 'rgb(' + x[1][0] + ',' + x[1][1] + ',' + x[1][2] + ')');
            });
        },
        get : function (d) {
            var score = [0, 0, 0];
            var colorMap = this.colorMap;
            colorMap.forEach(function (x, i) {
                var y = colorMap[i + 1];
                if (i < colorMap.length - 1 && d >= x[0] && d <= y[0]) {
                    var r, g, b;
                    r = x[1][0] * (y[0] - d) / (y[0] - x[0]) + y[1][0] * (-x[0] + d) / (y[0] - x[0]);
                    g = x[1][1] * (y[0] - d) / (y[0] - x[0]) + y[1][1] * (-x[0] + d) / (y[0] - x[0]);
                    b = x[1][2] * (y[0] - d) / (y[0] - x[0]) + y[1][2] * (-x[0] + d) / (y[0] - x[0]);
                    score = [r, g, b];
                }
            });
            return score;
        },
        predefined : {
            "Standard": [
                [0.0, [128, 128, 255]],
                [0.5, [255, 255, 0]],
                [1.0, [255, 0, 0]]
            ],
            "Blue-ish": [
                [0.0, [255,255,204]],
                [0.25, [161,218,180]],
                [0.5, [65,182,196]],
                [0.75, [44,127,184]],
                [1.0, [37,52,148]]
            ],
            "Niedrige Ähnlichkeit": [
                [0.0, [128, 128, 255]],
                [0.2, [255, 255, 0]],
                [0.6, [255, 0, 0]],
                [1.0, [255, 0, 0]]
            ],
            "Hohe Ähnlichkeit": [
                [0.0, [0, 0, 128]],
                [0.65, [128, 128, 255]],
                [0.85, [255, 255, 0]],
                [1.0, [255, 0, 0]]
            ]
        },
        colors : function () {
            var result = [];
            for (key in this.predefined) {
                result.push(key);
            }
            return result;
        }
    };

    var matrixVisualization = {
        draw: draw,
        heatMap: heatMap,
        maxClusterDiameter: function (s) {
            scope = s;
            return maxClusterDiameter;
        }
    };

    return matrixVisualization;

    function matrix (data) {
        var margin = {top: 120, right: 150, bottom: 10, left: 75},
            width = 500;
        var x = d3.scale.ordinal().domain(data.nodes.map(function (x, i) {
                return i
            })).rangeRoundBands([0, width]),
            z = d3.scale.linear().domain([0, 1000]).clamp(true);
        width = height = x.rangeBand() * data.nodes.length;
        var h = d3.scale.linear().domain([1,0]).range([0, height]);
        var svg = root.append("svg")
            .attr("id","matrix")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        heatMap.appendDefs(svg, "heatmap");
        var heatScale = svg.append("g")
            .attr("transform", "translate(25 ," + margin.top + ")");
        var heatAxis = d3.svg.axis()
            .scale(h)
            .orient("left")
            .ticks(4);
        heatMap.appendHeatScale(heatScale, "heatmap", height);
        heatScale.append("g")
            .attr("class", "axis") //Assign "axis" class
            .call(heatAxis);
        svg = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var matrix = [],
            nodes = data.nodes,
            n = nodes.length;
        // Compute index per node.
        nodes.forEach(function (node, i) {
            node.index = i;
            node.count = 0;
            matrix[i] = d3.range(n).map(function (j) {
                return {x: j, y: i, z: 0};
            });
        });
        // Convert links to matrix; count character occurrences.
        data.links.forEach(function (link) {
            matrix[link[0]][link[1]].z += (1 - link[2]) * 1000 + 0.000001;
            matrix[link[1]][link[0]].z += (1 - link[2]) * 1000 + 0.000001;
            matrix[link[0]][link[0]].z = 1000;
            matrix[link[1]][link[1]].z = 1000;
            nodes[link[0]].count += link[2] * 10;
            nodes[link[1]].count += link[2] * 10;
        });
        // Precompute the orders.
        var orders = {
            name: d3.range(n).sort(function (a, b) {
                return d3.ascending(nodes[a].name, nodes[b].name);
            }),
            group: d3.range(n).sort(function (a, b) {
                return nodes[b].group - nodes[a].group;
            }),
            sortOrder: d3.range(n).sort(function (a, b) {
                return nodes[b].sortOrder - nodes[a].sortOrder;
            })
        };
        // The default sort order.
        x.domain(orders.sortOrder);

        var row = svg.selectAll(".row")
            .data(matrix)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", function (d, i) {
                return "translate(0," + x(i) + ")";
            })
            .each(row);
        //row.append("line")
        //    .attr("x2", width);
        var labels = row.append("svg")
            .attr("x", width)
            .attr("y", -2 * x.rangeBand())
            .append("g")
            .attr("transform", function (d, i) {
                return "translate(10," + (x.rangeBand() / 6 * 5 + 2 * x.rangeBand()) + ")rotate(-30)";
            })
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "start")
            .text(function (d, i) {
                return nodes[i].name;
            });
        //wrap(labels, 100);
        var column = svg.selectAll(".column")
            .data(matrix)
            .enter().append("g")
            .attr("class", "column")
            .attr("transform", function (d, i) {
                return "translate(" + x(i) + ")rotate(-90)";
            });
        //column.append("line")
        //    .attr("x1", -width);
        labels = column.append("g")
            .attr("transform", function (d, i) {
                return "translate(0)rotate(60)";
            })
            .append("text")
            .attr("x", 15)
            .attr("y", 0)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .attr("class", "label")
            .text(function (d, i) {
                return nodes[i].name;
            });
        //wrap(labels, 100);
        function row(row) {
            var cell = d3.select(this).selectAll(".cell")
                .data(row.filter(function (d) {
                    return d.z;
                }))
                .enter()
                .append("g");
            cell
                .append("rect")
                .style("stroke-width", 3)
                .style("stroke", function (d, i) {
                    return d3.rgb(nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : '#000');
                })
                .style("stroke-opacity", function (d, i) {
                    return nodes[d.x].group == nodes[d.y].group ? 1 : 0;
                })
                .attr("class", "cell")
                .attr("x", function (d) {
                    return x(d.x);
                })
                .attr("width", x.rangeBand())
                .attr("height", x.rangeBand())
                .attr("fill", function (d) {
                    return d3.rgb.apply(this, heatMap.get(z(d.z)));
                    //return d3.rgb(nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : '#000');
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
            cell.append("text")
                .attr("x", function (d) {
                    return x(d.x) + x.rangeBand() / 2 + 1;
                })
                .attr("text-anchor", "middle")
                .attr("width", x.rangeBand())
                .attr("height", x.rangeBand())
                .attr("y", x.rangeBand() / 2 + 1)
                .style("fill", "#999")
                .text(function (d, i) {
                    return (d.z / 1000).toFixed(3);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
            cell
                .append("text")
                .attr("x", function (d) {
                    return x(d.x) + x.rangeBand() / 2;
                })
                .attr("text-anchor", "middle")
                .attr("width", x.rangeBand())
                .attr("height", x.rangeBand())
                .attr("y", x.rangeBand() / 2 + 1)
                .style("fill", "#000")
                .text(function (d, i) {
                    return (d.z / 1000).toFixed(3);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        }

        function mouseover(p) {
            d3.selectAll(".row text.label").classed("active", function (d, i) {
                return i == p.y;
            });
            d3.selectAll(".column text.label").classed("active", function (d, i) {
                return i == p.x;
            });
        }

        function mouseout() {
            d3.selectAll("text").classed("active", false);
        }

    }

    function draw (data, threshold) {
        data = transform(data, threshold);
        root.html('');
        dendogram(data);
        matrix({nodes: data.entities, links: data.distances});

    }

    function transform (data, threshold) {

        var clusterFinder = getClusters();
        var clusterNumberizer = numberClusters();
        treeSearch([data.hierarchy], clusterNumberizer);
        treeSearch([data.hierarchy], clusterFinder);
        data.clusters = clusterFinder.getClusters();
        data.entities = getEntityGroups(data.entities, data.clusters);
        return data;

        function treeSearch (stack, cb) {
            while (stack.length > 0) {
                var node = stack.pop();
                var leaf = typeof node.children === "undefined";
                if (cb(node, leaf, stack) && !leaf) {
                    node.children.forEach(function (child) {
                        stack.push(child);
                    });
                }
            }
        }

        function numberClusters () {
            var i = 0;
            return function (node, leaf, stack) {
                data.entities.forEach(function (e) {
                   if (e.name === node.name) {
                       e.sortOrder = i;
                   }
                });
                node.sortOrder = i;
                i++;
                return true;
            }
        }

        function getClusters () {
            var clusters = [];
            var cb = function (node, leaf, stack) {
                if (!leaf && node.diameter <= threshold) {
                    clusters.push(node);
                    return false;
                } else if (leaf) {
                    clusters.push(node);
                }
                return true;
            };
            cb.getClusters = function () {
                return clusters.length === 0 ?
                    [data.hierarchy] :
                    clusters.sort(function (a, b) {
                        return b.sortOrder - a.sortOrder;
                    });
            };
            return cb;
        }

        function getEntityGroups (entities, clusters) {
            return entities.map(function (e) {
                clusters
                    .forEach(function (c, i) {
                        if (c.name.indexOf(e.name) > -1) {
                            e.group = i;
                        }
                    });
                return e;
            });
        }
    }

    function dendogram (data) {
        var json = data.hierarchy;
        var w = 400,
            h = 500;
        var cluster = d3.layout.cluster()
            .size([h, w - 150]);
        var diagonal = d3.svg.diagonal()
            .projection(function (d) {
                return [d.y, d.x];
            });
        var vis = root.append("svg:svg")
            .attr("width", w)
            .attr("height", h)
            .append("svg:g")
            .attr("transform", "translate(40, 0)");
        var nodes = cluster.nodes(json);
        var link = vis.selectAll("path.link")
            .data(cluster.links(nodes))
            .enter().append("svg:path")
            .attr("class", "link")
            .attr("d", diagonal);
        var node = vis.selectAll("g.node")
            .data(nodes)
            .enter().append("svg:g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
        var circles = node.append("svg:circle")
            .attr("r", function (d) {
                return d.diameter ? d.diameter * 23 + 2 : 0;
            })
            .style("fill", function (d) {
                return selectColor(d.name, data.entities);
            });
        var texts = node.append("svg:text")
            .attr("x", 8)
            .attr("y", 3)
            .attr("text-anchor", "start")
            .style("fill", function (d) {
                return selectColor(d.name, data.entities);
            })
            .text(function (d) {
                return d.children ? "" : d.name;
            });
        texts.call(wrap, 100);

        circles.on("click", function (node) {
            if (typeof node.diameter !== "undefined") {
                maxClusterDiameter = node.diameter;
                scope.$apply();
            }
        });
    }

    function selectColor (name, entities) {
        var result = [];
        entities.forEach(function (e) {
            if (name.indexOf(e.name) > -1 && result.indexOf(e.group) === -1) {
                result.push(e.group);
            }
        });
        if (result.length === 1)
            result = c(result[0]);
        else
            result = "#ccc";
        return result;
    }

    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/_/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", isNaN(dy) ? "0" : dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join("_"));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join("_"));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
                }
            }
        });
    }

});