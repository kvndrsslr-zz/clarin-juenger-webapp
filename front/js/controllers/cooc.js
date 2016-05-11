angular.module('ir-matrix-cooc')
    .controller('coocController', function ($scope, $timeout, $http, $translate, data) {
    	//$scope.alert = window.alert.bind(window);
    	

    	$scope.logSwitch = false;
        $scope.datetype = false;

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
        $scope.corpora = [];
    //console.log(data.corpora);
        $scope.genres = data.genres;
        $scope.languages = data.languages;
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

        $scope.$watch('corpora', function (y) { /*console.log(y.length);*/        });

        $scope.sel = {languages:[],genres:[]};

        $scope.validation = function () {
            if ($scope.corpora.length < 1) {
                return "Bitte mindestens 1 Korpora auswählen!";
            } else if ($scope.getWords().length === 0) {
                return 'Bitte mindestens 1 Wort zum Vergleichen eingeben!';
            } else {
                return '';
            }

        };

        $scope.submit = function () {
            var payload = {
                words : $scope.getWords(),
                corpora : $scope.corpora.filter(function (c) {
                    var filter = true;
                    //if (s === c.name) filter = true;
                    
                    return filter;
                }),
                minYear: $scope.minYear,
                maxYear: $scope.maxYear
            };
            console.log(payload);
            $http({
                method: 'post',
                url: '/api/cooc',
                timeout: 9999999999,
                data: payload
            }).success(function (data) {
                console.log('success!');
                //console.log(data);
                showFeature.Visualisierung = false;
                $scope.draw(data);
            }).error(function (data, status, header) {
                console.log('error retrieving wordfrequencies!');
            });
        };


        var svgcounter = 0; //counts active svg

        $scope.draw = function (xdata) {

        	var startword = "";
        	var wordset = [];
        	var nodes = [];
        	var links = [];

        	for(d in xdata){

        		if(startword == ""){startword = xdata[d].word;}

        		if(  xdata[d].pairs.length >0 ){
        			var pairs = xdata[d].pairs;
        			for(p in pairs){
        				if(pairs[p].word1 != undefined && pairs[p].word1 != "" && pairs[p].word2 != undefined && pairs[p].word1 != "" ){
        					var w1id=-1;
	        				var w2id=-1;
	        				if(  wordset.indexOf(pairs[p].word1) == -1){
	        					w1id = wordset.length;
	        					wordset[wordset.length] = pairs[p].word1;
	        					if(pairs[p].word1 === startword){
	        						var node1 = {"name":""+pairs[p].word1+"","group":1};
	        					}
	        					else{
	        						var node1 = {"name":""+pairs[p].word1+"","group":10};	
	        					}
	        					
	        					nodes.push(node1);
	        				}
	        				else{
	        					w1id = wordset.indexOf(pairs[p].word1);
	        				}

	        				if( wordset.indexOf(pairs[p].word2) == -1){
	        					w2id = wordset.length;
	        					wordset[wordset.length] = pairs[p].word2;
	        					var node2 = {"name":""+pairs[p].word2+"","group":10};
	        					nodes.push(node2);
	        				}
	        				else{
	        					w2id = wordset.indexOf(pairs[p].word2);
	        				}
	        				//{"name":"Child1","group":10},
	        				
	        				var linksweight = 0;
	        				if(pairs[p].significance != null){linksweight=pairs[p].significance;}
	        				var link = {"source":w1id,"target":w2id,"value":linksweight};
	        				
	        				
	        				links.push(link);

        				}

        				
        			}
        			
        		}
        	}
        	//console.log(wordset);
        	//console.log(nodes);
        	//console.log(links);


			var margin = {top: 20, right: 200, bottom: 30, left: 50},
                width = 1160 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom,
                 fill = d3.scale.category20();

			var color = d3.scale.category20();

			var force = d3.layout.force()
			    .charge(-60)
			    .linkDistance(120)
			    .size([width, height]);


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




		/*	var svg = d3.select("body").append("svg")
			    .attr("width", width)
			    .attr("height", height);*/

			d3.json("", function(error ) {
			  if (error) throw error;

			  force
			      .nodes(nodes)
			      .links(links)
			      .start();

			  var link = svg.selectAll(".link")
			      .data(links)
			    .enter().append("line")
			      .attr("class", "link")
			      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

			  var node = svg.selectAll(".node")
			      .data(nodes)
			    .enter().append("circle")
			      .attr("class", "node")
			      .attr("r", 5)
			      .style("fill", function(d) { return color(d.group); })
			      .call(force.drag)
			      ;

			  node.append("title")
			      .text(function(d) { return d.name; });

			  force.on("tick", function() {
			    link.attr("x1", function(d) { return d.source.x; })
			        .attr("y1", function(d) { return d.source.y; })
			        .attr("x2", function(d) { return d.target.x; })
			        .attr("y2", function(d) { return d.target.y; });

			    node.attr("cx", function(d) { return d.x; })
			        .attr("cy", function(d) { return d.y; });
			  });
			});







        }












         $scope.updatecorp = function(){

            var y = data.corpora.filter(function(s){ 
                if( ($scope.datetype ==false && s.datetype == 'year') || ($scope.datetype ==true && s.datetype == 'day')  ){
                    if($scope.sel.languages.indexOf(s.language) != -1 ) {
                        //console.log(s);
                        if($scope.sel.genres.indexOf(s.genre) != -1 ) {
                            return s;
                        }
                        
                    }
                }
                
            });
            $scope.corpora = y;
        }

        



    });