angular.module('ir-matrix-cooc')
    .controller('korporaController', function ($scope, data, $http, $timeout) {

        $scope.sel = {corpora: ['deu_news_1995','deu_news_1997','deu_news_2000','deu_news_2009','deu_wikipedia_2007','deu_wikipedia_2010','deu_wikipedia_2012'], metric: 3};
        $scope.alert = window.alert.bind(window);
        $scope.dbs = data.dbs.map(function(x) {
            return {name: x, language: window.languages.get(x.substring(0,3))};
        });

        $scope.clusterDepth = 1;

        $scope.limit = Math.pow(2,32) - 1;
        $timeout(function () {$scope.limit = 125}, 200);
        //$timeout(function () {$scope.sel.corpora = $scope.sel.corpora.slice(0,2)}, 2000);

        $scope.languages = $scope.dbs.reduce(function (prev, curr, i) {
            if (i == 0) {
                return prev.concat([curr.language]);
            } else if (prev.indexOf(curr.language) == -1) {
                return prev.concat([curr.language]);
            } else {
                return prev;
            }
        }, []);
        $scope.wordCount = 10000;
        var show = {};
        $scope.show = function (x, y) {
            if (typeof show[x] === 'undefined') {
                show[x] = false;
            }
            if (typeof y !== undefined && y) {
                show[x] = !show[x];
            }
            return show[x];
        };
        //@todo: add validation for count(corpora)>=2
        $scope.validation = function () {
            if ($scope.sel.corpora.length < 2) {
                return "Bitte mindestens 2 Korpora auswählen!";
            } else {
                return '';
            }

        };

        $scope.metrics = [
            {key: 1, title: "Cosinus - basierend auf Rang"},
            {key: 2, title: "Cosinus - basierend auf Freq."},
            {key: 3, title: "Cosinus - basierend auf Logarithmus d. Freq."},
            {key: 4, title: "Anteil unterschiedlicher Wörter"},
            {key: 5, title: "Kendalls Tau - basierend auf Rang"},
            {key: 6, title: "Mass nach UQ - basierend auf Rang"},
            {key: 7, title: "Cosinus - basierend auf Rang"},
            {key: 8, title: "Cosinus - basierend auf Freq."},
            {key: 9, title: "Cosinus - basierend auf Logarithmus d. Freq."}];

        $scope.metricgroup = function (x) {
            return ( x.key < 5 ? "Versch." : "Gleiche" ) + " Listenlängen";
        };

        /*
         Masse 1-4 arbeiten auf beliebig langen Listen.
         Masse 5-9 arbeiten auf gleich langen Listen.
         Die laengere Liste wird automatisch gekuerzt.
         */

        function tryRequest (id) {
            var now = new Date();
            $http({
                method: 'post',
                url: '/api/korpora/request',
                timeout: 9999999999,
                data: {requestId: id}
            })
                .success(function (data) {
                    if (typeof data.progress !== 'undefined') {
                        $timeout(tryRequest.bind(null, id), 2000);
                    } else {
                        console.log("Daten:");
                        console.log(data);
                        $scope.drawDendogram(data);
                        show.matrix = true;
                        //show.stats = true;
                    }
                })
                .error(function (data, status, header) {
                    console.log("Fehler!");
                    console.log("Zeit:" + now.toString() + " bis " + (new Date()).toString());
                    console.log(data);
                    console.log(status);console.log(header);
                });
        }

        $scope.submit = function () {
            if (!$scope.validation())
                var now = new Date();
            $http({method: 'post',
                url: '/api/korpora',
                timeout: 9999999999,
                data:{wordCount: $scope.wordCount, corpora: $scope.sel.corpora, metric: $scope.sel.metric, clusterDepth: $scope.clusterDepth}})
                .success(function (data) {
                    console.log("Daten:");
                    console.log(data);
                    if (data.requestId) {
                        tryRequest(data.requestId);
                    } else {
                        $scope.drawDendogram(data);
                        show.matrix = true;
                        //show.stats = true;
                    }
                })
                .error(function (data, status, header) {
                    console.log("Fehler!");
                    console.log("Zeit:" + now.toString() + " bis " + (new Date()).toString());
                    console.log(data);
                    console.log(status);console.log(header);
                });
        };

        $scope.drawDendogram = function (data) {
            // dendogram
            (function () {
                var json = data.hierarchy;
                var w = 425,
                    h = 500;
                var cluster = d3.layout.cluster()
                    .size([h, w - 200]);
                var diagonal = d3.svg.diagonal()
                    .projection(function (d) {
                        return [d.y, d.x];
                    });
                var vis = d3.select("#dendogram").html('').append("svg:svg")
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
                node.append("svg:circle")
                    .attr("r", function (d) {
                        return d.diameter ? d.diameter * 23 + 2 : 0;
                    });
                node.append("svg:text")
                    .attr("dx", function (d) {
                        return d.children ? 8 : 8;
                    })
                    .attr("dy", 3)
                    .attr("text-anchor", function (d) {
                        return d.children ? "start" : "start";
                    })
                    .text(function (d) {
                        return d.children ? "" : d.name;
                    });
            })();
            //matrix
            (function () {
                var miserables = {nodes: data.entities, links: data.distances};
                var margin = {top: 120, right: 150, bottom: 10, left: 0},
                    width = 500,
                    height = 500;
                var x = d3.scale.ordinal().domain(miserables.nodes.map(function (x, i) {return i})).rangeRoundBands([0, width]),
                    z = d3.scale.linear().domain([0, 1000]).clamp(true),
                    c = d3.scale.category10().domain(d3.range(10));
                width = height = x.rangeBand()*miserables.nodes.length;
                console.log(width);
                var svg = d3.select("#dendogram").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .style("margin-left", -margin.left + "px")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var matrix = [],
                    nodes = miserables.nodes,
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
                miserables.links.forEach(function (link) {
                    matrix[link[0]][link[1]].z += (1 - link[2])*1000;
                    matrix[link[1]][link[0]].z += (1 - link[2])*1000;
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
                    })
                };
                // The default sort order.
                x.domain(orders.group);
                svg.append("rect")
                    .attr("class", "background")
                    .attr("width", width)
                    .attr("height", height);
                var row = svg.selectAll(".row")
                    .data(matrix)
                    .enter().append("g")
                    .attr("class", "row")
                    .attr("transform", function (d, i) {
                        return "translate(0," + x(i) + ")";
                    })
                    .each(row);
                row.append("line")
                    .attr("x2", width);
                row.append("svg")
                    .attr("x", width)
                    .attr("y", -2*x.rangeBand())
                    .append("g")
                    .attr("transform", function (d, i) {
                        return "translate(10," + (x.rangeBand()/6*5 + 2*x.rangeBand()) + ")rotate(-30)";
                    })
                    .append("text")
                    .attr("text-anchor", "start")
                    .text(function (d, i) {
                        return nodes[i].name;
                    });
                var column = svg.selectAll(".column")
                    .data(matrix)
                    .enter().append("g")
                    .attr("class", "column")
                    .attr("transform", function (d, i) {
                        return "translate(" + x(i) + ")rotate(-90)";
                    });
                column.append("line")
                    .attr("x1", -width);
                column.append("g")
                    .attr("transform", function (d, i) {
                        return "rotate(60)";
                    })
                    .append("text")
                    .attr("x", 15)
                    .attr("y", 0)
                    .attr("dy", ".32em")
                    .attr("text-anchor", "start")
                    .text(function (d, i) {
                        return nodes[i].name;
                    });
                function row(row) {
                    var cell = d3.select(this).selectAll(".cell")
                        .data(row.filter(function (d) {
                            return d.z;
                        }))
                        .enter().append("rect")
                        .attr("class", "cell")
                        .attr("x", function (d) {
                            return x(d.x);
                        })
                        .attr("width", x.rangeBand())
                        .attr("height", x.rangeBand())
                        .style("fill-opacity", function (d) {

                            return (nodes[d.x].group == nodes[d.y].group ? Math.pow(z(d.z),10) : 1-z(d.z));
                        })
                        .style("fill", function (d) {

                            return d3.rgb(nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : '#000');
                        })
                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout);
                }
                function mouseover(p) {
                    d3.selectAll(".row text").classed("active", function (d, i) {
                        return i == p.y;
                    });
                    d3.selectAll(".column text").classed("active", function (d, i) {
                        return i == p.x;
                    });
                }
                function mouseout() {
                    d3.selectAll("text").classed("active", false);
                }
                function order(value) {
                    x.domain(orders[value]);
                    var t = svg.transition().duration(1500);
                    t.selectAll(".row")
                        .delay(function (d, i) {
                            return x(i) * 4;
                        })
                        .attr("transform", function (d, i) {
                            return "translate(0," + x(i) + ")";
                        })
                        .selectAll(".cell")
                        .delay(function (d) {
                            return x(d.x) * 4;
                        })
                        .attr("x", function (d) {
                            return x(d.x);
                        });
                    t.selectAll(".column")
                        .delay(function (d, i) {
                            return x(i) * 4;
                        })
                        .attr("transform", function (d, i) {
                            return "translate(" + x(i) + ")rotate(-90)";
                        });
                }

                /*var timeout = setTimeout(function () {
                 order("group");
                 //d3.select("#order").property("selectedIndex", 2).node().focus();
                 }, 1000);
                 */
            })();
        }
    });

