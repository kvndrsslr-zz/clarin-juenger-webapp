angular.module('ir-matrix-cooc')
    .controller('wordsController', function ($scope, $timeout, $http, $translate, data) {

        $scope.logSwitch = false;
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
                $scope.draw(data, $scope.logSwitch);
            }).error(function (data, status, header) {
                console.log('error retrieving wordfrequencies!');
            });
        };

        var svgcounter = 0; //counts active svg

        $scope.draw = function (xdata, logSwitch) {
            var formatNumber = d3.format(",.2f");
//var formatNumber = d3.format(".2s");

            var tickFormatForLogScale = function(d) { return "$" + formatNumber(d) };

            var logBase = 2;

            var charts = [];
            var dates = [];
            var cdata = [];



            xdata.forEach(function (x, i) {
                var chartName = $translate.instant('SEC_WORDS_LABELGLUE', {label: x.word, corpus : x.corpus.displayName});
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

            //console.log(cdata);
            //console.log(dates);
            //console.log(charts);

            var margin = {top: 20, right: 200, bottom: 30, left: 50},
                width = 1160 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var x = d3.time.scale()
                .range([0, width]);

            var y = (!logSwitch ? d3.scale.linear() : d3.scale.log().base(logBase).nice());
                y = y.range([height, 0])
                .clamp(true);
            window.yscale = y;

            var color = d3.scale.category10();

            

            // domain muss zahl aller combis aus corpoa + wort sein (vorher berechnen!)
            color.domain(charts);

            //
            var cities = cdata;

            x.domain([d3.min(dates), d3.max(dates)]);

            y.domain([
                Math.max(0.0000000001, d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.relativeFreq; }); })),
                d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.relativeFreq; }); })
            ]);

            /*console.log([
                Math.max(0.0000000001,d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.relativeFreq; }); })),
                d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.relativeFreq; }); })
            ]);*/


            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹",
                formatPower = function(d) { console.log("exp:"+d); return (d + "").split("").map(function(c) { return c==='-'?'-':superscript[c]; }).join(""); };

            var yAxis = d3.svg.axis()
                .scale(y)
                .tickFormat(function(d) { return "" + logBase + formatPower(Math.round(Math.log(d)/Math.log(logBase))); })
                .ticks(10)
            .orient("left");


            var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([0,0])
              .html(function(d) { tip.offset[0,0];
                tip.offset(function() {//console.log(d3.mouse(this)[1]);
                  return [ d3.mouse(this)[1],d3.mouse(this)[0]-(width/2)]
                })
                return "<strong>Frequency:</strong> <span style='color:red'>" + y.invert(d3.mouse(this)[1]) + "</span>";
              });
              

            var line = d3.svg.line()
                .interpolate("linear")
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d.relativeFreq); });



            var svgdiv = d3.select("#visualization-words").append("div")
                .attr("id",function(){
                    svgcounter++; 
                    return "svg"+svgcounter+"div";
                })
                .style("background-color","whitesmoke");

            var svgdivheader = d3.select("#svg"+svgcounter+"div")
                .append("h3")
                .text("SVG #"+svgcounter);
            
            svgdivheader.append("span")
                .attr("class","glyphicon glyphicon-chevron-down svgarrow")
                .attr("id", "svg"+svgcounter+"chevron")
                .attr("name", "svg"+svgcounter)
                .on("click",function(d){
                    
                    if( $(this).hasClass("glyphicon-chevron-down") ){
                        $("#"+$(this).attr("name")+"content").hide();
                        $(this).removeClass("glyphicon-chevron-down");
                        $(this).addClass("glyphicon-chevron-up");
                    }
                    else{
                        $("#"+$(this).attr("name")+"content").show();
                        $(this).removeClass("glyphicon-chevron-up");
                        $(this).addClass("glyphicon-chevron-down");

                    }
                })
                .style("margin-left","15px")
                .style("cursor","pointer");

            svgdivheader.append("span")
                .attr("class","glyphicon glyphicon-remove svgremove")
                .attr("id", "svg"+svgcounter+"remove")
                .attr("name", "svg"+svgcounter)
                .on("click",function(d){ 
                    $( "#"+$(this).attr("name")+"div").remove(); 
                })
                .style("margin-right","5px")
                .style("color","red")
                .style("cursor","pointer")
                .style("float","right");
            
            var svg = d3.select("#svg"+svgcounter+"div").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("id",function(){return "svg"+svgcounter+"content";})
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
                .text($translate.instant('SEC_WORDS_YLABEL'));

            svg.call(tip);            

            var city = svg.selectAll(".city")
                .data(cities)
                .enter().append("g")
                .attr("class", "city")
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                ;

            city.append("path")
                .attr("class", "line")
                .attr("id",function(d,i){return "svg"+svgcounter+"line"+i;})
                .attr("d", function(d) { return line(d.values); })
                .attr("name",function(d) { return color(d.name); })
                .on('mouseover', function(){ d3.select(this).style({"stroke-width":'5'});})
                .on('mouseout', function(){ d3.select(this).style({"stroke-width":'3'});})
                .style("stroke-width","3")
                .style("stroke", function(d) { return color(d.name); });


             var legend = svg.selectAll(".legend")
                .data(cities)
                .enter().append("g")
                .attr("class", "legend");

             legend.append("text")
             .attr("class","legendtext")
                    .attr("name",function(d,i){return "svg"+svgcounter+"line"+i;})
                    .attr("x", width)         
                    .attr("y", function(d,i){return 40+(i*17);})
                    .style("font-size", "1.2em")
                    .style('fill', function(d) { return color(d.name); })
                    .text(function(d) { return d.name;});


                    

            $(".legendtext").mouseover(function(d){
                $("#"+$(this).attr("name") )
                    .css("stroke","red")
                    .css("stroke-width","5")
                    ; 
            });

            $(".legendtext").mouseout(function(d){
                var lcol = $("#"+$(this).attr("name") ).attr("name");
                $("#"+$(this).attr("name") )
                    .css("stroke",lcol)
                    .css("stroke-width","3")
                    ; 
            });


            
        };

    

    });

