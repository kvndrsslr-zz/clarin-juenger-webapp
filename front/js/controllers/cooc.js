angular.module('ir-matrix-cooc')
    .controller('coocController', function ($scope, $timeout, $http, $translate, data) {
    	//$scope.alert = window.alert.bind(window);
    	

    	$scope.logSwitch = false;
        $scope.datetype = false;

      
        $scope.paginationSize = 10;
        $scope.paginationSize2 = 10;
        $scope.setPaginationSize = function (s) {
            $scope.paginationSize = s;
        };
        $scope.setPaginationSize2 = function (s) {
            $scope.paginationSize2 = s;
        };
        window.setPaginationSize = $scope.setPaginationSize;
        window.setPaginationSize2 = $scope.setPaginationSize2;

        $scope.statistic = {
            files: [],
            resultLists : [],
            safe : {}
        };
        $scope.parseFloat = parseFloat;

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
        $scope.minlinksig = 0;
        $scope.$watch('minlinksig', function(y){ /*console.log('#');*/ });

        

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
            //console.log(payload);
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

        $scope.draw = function (xdata) { /*console.log(xdata);*/

        	addTable(xdata);
            $scope.statistic.safe = [];
            $scope.statistic.safe['normal'] = [];
            $scope.statistic.safe['corporas'] = [];
        	var startword = "";
        	var wordset = [];
        	var nodes = [];
        	var links = [];
            var linksigmin = 0;
            var linksigmax = 0;
            var statcorp = [];
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
	        						var node1 = {"name":""+pairs[p].word1+"","group":3};	
	        					}
	        					
	        					nodes.push(node1);
                                
	        				}
	        				else{
	        					w1id = wordset.indexOf(pairs[p].word1);
	        				}

	        				if( wordset.indexOf(pairs[p].word2) == -1){
	        					w2id = wordset.length;
	        					wordset[wordset.length] = pairs[p].word2;
								var node2 = {"name":""+pairs[p].word2+"","group":4};
	        					nodes.push(node2);
	        				}
	        				else{
	        					w2id = wordset.indexOf(pairs[p].word2);
	        				}
	        				//{"name":"Child1","group":10},
	        				
	        				var linksweight = 0;
	        				if(pairs[p].significance != null){linksweight=pairs[p].significance;}
	        				var link = {"source":w1id,"target":w2id,"value":linksweight};
	        				if(linksigmax<(linksweight/2)){linksigmax = (linksweight/2)+1;}
	        				
	        				links.push(link);
                            var l = {"source":pairs[p].word1,"target":pairs[p].word2,"value":pairs[p].significance};
                            $scope.statistic.safe['normal'].push(l);
                            
        				}

        			}
        		}

                //generate data for statistic table
                
                var cname = "";
                //console.log(xdata[d].corpus.name);
                if(  xdata[d].pairs.length >0 ){
                    cname = xdata[d].corpus.name;
                    $scope.statistic.safe[cname] = [];
                    
                    
                    for(p in pairs){
                        if(pairs[p].word1 == '' || pairs[p].word2 == '' || pairs[p].word1 == null || pairs[p].word2 == null){continue;}
                        var l = {"source":pairs[p].word1,"target":pairs[p].word2,"value":pairs[p].significance};
                        $scope.statistic.safe[cname].push(l);
                    }
                    

                }
                //console.log(scorp);

                if($scope.statistic.safe['corporas'].indexOf(cname) === -1 && cname !== ''){
                    $scope.statistic.safe['corporas'].push(cname);
                }
                
        	}$scope.statistic.safe['corporas'].push('normal');
 console.log($scope.statistic.safe);
        	//console.log(wordset);
        	//console.log(nodes);
        	//console.log(links);


			var margin = {top: 20, right: 200, bottom: 30, left: 50},
                width = 1160 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom,
                 fill = d3.scale.category10();

			var color = d3.scale.category10();

			var force = d3.layout.force()
			    .charge(-60)
			    .linkDistance(120)
			    .size([width, height]);

                $('#visualization-words').empty();
            var svgdiv = d3.select("#visualization-words").append("div")
                .attr("id",function(){
                    //svgcounter++; 
                    return "svg"+svgcounter+"div";
                })
                .style("background-color","whitesmoke");

            var svgdivheader = d3.select("#svg"+svgcounter+"div");
            var sliderdiv = $('<div id="sliderdiv" ></div>').appendTo(svgdivheader);

            $('<div/>').text("min significance")
                .appendTo(sliderdiv)
                .css("float","left")
                .css("margin-right","5px");
             
            $('<div id="sliderlabel" />')
                .text(0)
                .css("float","left")
                .appendTo(sliderdiv);

             //var svgdivslider = d3.select("#visualization-words");
             var slider = $(' <input ng-model="svgcounter" type="range" min="0" value="0" class="slider"></input>')
             .attr("max",linksigmax)
             .attr("id","slider-range").css("width","150px").css("float","left")
             .change(function(e){
                $('#sliderlabel').text($(this).val());
                $scope.minlinksig = $(this).val();
               
                svg.selectAll("line.link")
                    .style("stroke-width", function(d) { 
                        var linksig =  (d.value/2)-$scope.minlinksig;
                        if(linksig < 0) {return 0;}
                        else{return (d.value/2);}
                    })
            })
            // .appendTo("#visualization-words");
            .appendTo(sliderdiv);

            

                
            
            var svg = d3.select("#svg"+svgcounter+"div").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("id",function(){return "svg"+svgcounter+"content";})
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


			d3.json("", function(error ) {
			  if (error) throw error;



				var force = self.force = d3.layout.force()
				        .nodes(nodes)
				        .links(links)
				        .gravity(.05)
				        .distance(height/2)
				        .charge(-30)
				        .size([width, height])
				        .start();

			    var link = svg.selectAll("line.link")
			        .data(links)
			        .enter().append("svg:line")
			        .style("stroke-width", function(d) { return d.value/2/*Math.sqrt(d.value)*/; })
			        //.style("stroke","gray")
			        .style("stroke",function(d){ if(d.source.name === startword){return "blue"}else{ return "gray";}})
			        .attr("class", "link")
			        .attr("x1", function(d) { return d.source.x; })
			        .attr("y1", function(d) { return d.source.y; })
			        .attr("x2", function(d) { return d.target.x; })
			        .attr("y2", function(d) { return d.target.y; });

			    var node_drag = d3.behavior.drag()
			        .on("dragstart", dragstart)
			        .on("drag", dragmove)
			        .on("dragend", dragend);

			    function dragstart(d, i) {
			        force.stop() // stops the force auto positioning before you start dragging
			    }

			    function dragmove(d, i) {
			        d.px += d3.event.dx;
			        d.py += d3.event.dy;
			        d.x += d3.event.dx;
			        d.y += d3.event.dy; 
			        tick(); // this is the key to make it work together with updating both px,py,x,y on d !
			    }

			    function dragend(d, i) {
			        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
			        tick();
			        force.resume();
			    }

			    var linkedByIndex = {};
				links.forEach(function(d) {
					linkedByIndex[d.source.index + "," + d.target.index] = 1;
					linkedByIndex[d.target.index + "," + d.source.index] = 1;
				});

				function neighboring(a, b){ 
					if(a.index===b.index) return 1;
				  return linkedByIndex[b.index + "," + a.index]; 
				}
				function neighboringlinks(a,b){ 
					return (a.index==b.source.index) ? (a.index==b.source.index) : a.index==b.target.index;
				}



			    var node = svg.selectAll("g.node")
			        .data(nodes)
				      .enter().append("svg:g")
				        .attr("class", "node")     
				        .call(node_drag)
				        .on("mouseover", fade(.1)).on("mouseout", fade(1));

			    node.append("circle")
				  	.attr("class", "node")
				  	.attr("r", 5)
					.style("fill", function(d) { return fill(d.group); })
				;

			    node.append("svg:title")
			        .text(function(d) { return d.name; });

			    node.append("svg:text")
			        .attr("class", "nodetext text")
			        .attr("dx", 12)
			        .attr("dy", ".35em")
                    .style("font-size","15px")
			        .style("fill",function(d) { return fill(d.group); })
			        .style("cursor","pointer")
			        .text(function(d) { return d.name })
			        .on({
			          "mouseover": function() { /* do stuff */ },
			          "mouseout":  function() { /* do stuff */ }, 
			          "click":  function(d) { update(d.name) }, 
			        });


			    force.on("tick", tick);

			    function tick() {
			      link.attr("x1", function(d) { return d.source.x; })
			          .attr("y1", function(d) { return d.source.y; })
			          .attr("x2", function(d) { return d.target.x; })
			          .attr("y2", function(d) { return d.target.y; });

			      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
			    };

				function fade(opacity) { 
				    return function(d, i){
				    	node.style("opacity", function(o) {
				    		if(opacity==1) return opacity;
				  			return neighboring(d, o) ? 1 : opacity;
						});
						link.style("opacity", function(o) {
							if(opacity==1) return opacity;
				  			return neighboringlinks(d,o) ?   1:opacity;
						});
				    }
				}
			});


        $scope.selectCooclist = function (name) {
            $scope.sel.wordList = name;
            //console.log(name);
            //console.log($scope.statistic.safe);
        };
        $scope.selectCooclist2 = function (name) {
            $scope.sel.wordList2 = name;
            //console.log(name);
            //console.log($scope.statistic.safe);
        };


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

        function update(word){
        	//console.log("##"+word);

       		var words = [];
       		words.push(word);
            var payload = {
                words : words,
                corpora : $scope.corpora.filter(function (c) {
                    var filter = true;
                    //if (s === c.name) filter = true;
                    
                    return filter;
                }),
                minYear: $scope.minYear,
                maxYear: $scope.maxYear
            };
            //console.log(payload);
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
              //  $scope.statistic.resultLists(data);
            }).error(function (data, status, header) {
                console.log('error retrieving wordfrequencies!');
            });
        
        }


        function addTable(data){    	
            //cooctable
            $('#cooctable').empty();
            var table = $('<table class="table table-bordered table-striped" />').css('border',"black 1px solid").css("padding","3px");
            var thead = $('<thead />');
            var tbody = $('<tbody />');

            var theadtr = $('<tr />');
            theadtr.append('<th style="border:1px black solid;padding:3px">corpus</th>')
                    .append('<th class="col-xs-4 " style="border:1px black solid;padding:3px">word1</th>')
                    .append('<th class="col-xs-4 " style="border:1px black solid;padding:3px">word2</th>')
                    .append('<th class="col-xs-4 " style="border:1px black solid;padding:3px">ABSOLUTE_FREQUENCY</th>')
                    .append('<th class="col-xs-4 " style="border:1px black solid;padding:3px">significance</th>');            

            thead.append(theadtr);

        	for(d in data){
        		if(data[d].pairs.length>0){

                    corpname = data[d].corpus.name;
                    for(e in data[d].pairs){

                        var tr = $('<tr />');
                        var cn = $('<td/>').css('border',"black 1px solid").css("padding","3px").text(corpname);
                        var w1 = $('<div name="'+data[d].pairs[e].word1+'">')
                        .attr("name",data[d].pairs[e].word1)
                        .text(data[d].pairs[e].word1)
                        .click(function(){update($(this).attr("name"));})
                        ;
                        var wa = $('<td />').css('border',"black 1px solid").css("padding","3px").append(w1);

                        var w2 = $('<div name="'+data[d].pairs[e].word2+'">')
                        .attr("name",data[d].pairs[e].word2)
                        .text(data[d].pairs[e].word2)
                        .click(function(){update($(this).attr("name"));})
                        ;
                        var wb = $('<td />').css('border',"black 1px solid").css("padding","3px").append(w2);
                        var af = $('<td />').css('border',"black 1px solid").css("padding","3px").text(data[d].pairs[e].absoluteFreq);
                        var si = $('<td />').css('border',"black 1px solid").css("padding","3px").text(data[d].pairs[e].significance);

                        tr.append(cn).append(wa).append(wb).append(af).append(si);
                        tbody.append(tr);
                    }
                } 
        	}

            table.append(thead).append(tbody);
            $('#cooctable').append(table);
        }

    });


 