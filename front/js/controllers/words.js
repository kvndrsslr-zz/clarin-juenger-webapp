angular.module('ir-matrix-cooc')
    .controller('wordsController', function ($scope, $timeout, $http, data) {

        // feature display toggle
        var showFeature = {'Konfiguration' : false};
        $scope.show = function (id, write) {
            if (typeof showFeature[id] === 'undefined') {
                showFeature[id] = true;
            }
            if (typeof write !== undefined && write) {
                showFeature[id] = !showFeature[id];
            }
            return showFeature[id];
        };
        $scope.words = "";
        $scope.getWords = function () {
            return $scope.words.split(",").map(function (w) {return w.trim()}).filter(function (w) {return w !== ""});
        };
        $scope.corpora = data.corpora;
        $scope.minYearScale = data.minYear;
        $scope.maxYearScale = data.maxYear;
        $scope.minYear = data.minYear;
        $scope.maxYear = 0;
        $timeout(function() {$scope.maxYear = data.maxYear}, 10);
        $scope.$watch('minYear', function (y) {
            if (y > $scope.maxYear)
                $scope.maxYear = y;
        });
        $scope.$watch('maxYear', function (y) {
            if (y < $scope.minYear)
                $scope.minYear = y;
        });
        $scope.sel = {corpora : []};

        $scope.validation = function () {
            if ($scope.sel.corpora.length < 1) {
                return "Bitte mindestens 1 Korpora auswählen!";
            } else if ($scope.getWords().length === 0) {
                return 'Bitte mindestens 1 Wort zum Vergleichen eingeben!';
            } else {
                return '';
            }

        };
        // Submit Job Request and queue up jobs
        $scope.submit = function () {
            var payload = {
                words : $scope.getWords(),
                corpora : $scope.corpora.filter(function (c) {
                    var filter = false;
                    $scope.sel.corpora.forEach(function (s) {
                        if (s === c.name) filter = true;
                    });
                    return filter;
                }),
                minYear: $scope.minYear,
                maxYear: $scope.maxYear
            };
            $http({
                method: 'post',
                url: '/api/words',
                timeout: 9999999999,
                data: payload
            }).success(function (data) {
                console.log('success!');
                console.log(data);
                showFeature.Visualisierung = false;
                $scope.draw(data);
            }).error(function (data, status, header) {
                console.log('error retrieving wordfrequencies!');
            });
        };

        $scope.draw = function (xdata) {

            var charts = [];
            var dates = [];
            var cdata = [];
            xdata.forEach(function (x, i) {
                var chartName = '"' + x.word + '" bei ' + x.corpus.displayName;
                var yearDate = new Date(x.year,0,1,1,0);
                if (charts.indexOf(chartName) === -1) {
                    charts.push(chartName);
                    cdata.push({name: chartName, values: []});
                }
                if (dates.indexOf(yearDate) === -1)
                    dates.push(yearDate);
                cdata.filter(function (d) {return d.name === chartName})[0]['values'].push({date: yearDate, relativeFreq: x.freq.relative});
                //var dPoint = data.filter(function (d) {return d.date === yearDate})[0];

            });

            console.log(cdata);
            console.log(dates);
            console.log(charts);

            var margin = {top: 20, right: 80, bottom: 30, left: 50},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var x = d3.time.scale()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var color = d3.scale.category10();

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var line = d3.svg.line()
                .interpolate("step")
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d.relativeFreq); });

            var svg = d3.select("#visualization").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // domain muss zahl aller combis aus corpoa + wort sein (vorher berechnen!)
            color.domain(charts);

            //
            var cities = cdata;

            x.domain([d3.min(dates), d3.max(dates)]);

            y.domain([
                d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.relativeFreq; }); }),
                d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.relativeFreq; }); })
            ]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Relative Häufigkeit");

            var city = svg.selectAll(".city")
                .data(cities)
                .enter().append("g")
                .attr("class", "city");

            city.append("path")
                .attr("class", "line")
                .attr("d", function(d) { return line(d.values); })
                .style("stroke", function(d) { return color(d.name); });

            city.append("text")
                .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
                .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.relativeFreq) + ")"; })
                .attr("x", 3)
                .attr("dy", ".35em")
                .text(function(d) { return d.name; });
        };





    });

