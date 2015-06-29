var _ = require('underscore');

exports.clustering = function (params) {

    return function (entities, distances, clusterDepth) {

        function isClusterEntityEntry(cluster, entity, entry) {
            if (cluster === null) {
                return entry === entity;
            } else {
                return cluster.indexOf(entry) > -1 && entry === entity;

            }
        }

        function splitCore(cluster) {

            function meanDistances(cluster) {

                function meanDistance(cluster, entity) {
                    return distances
                            .filter(function (entry) {
                                return isClusterEntityEntry(cluster, entity, entry[0])
                                    || isClusterEntityEntry(cluster, entity, entry[1]);
                            }).map(function (entry) {
                                return entry[2];
                            }).reduce(function (a, b) {
                                return a + b;
                            }) / (cluster.length - 1);
                }

                return cluster
                    .map(function (entity) {
                        return {entity: entity, meanDistance: meanDistance(cluster, entity)};
                    });
            }

            return meanDistances(cluster)
                .sort(function (a, b) {
                    return a.meanDistance - b.meanDistance;
                })[0].entity;
        }

        function distanceBetween(entity1, entity2) {
            return distances
                .filter(function (entry) {
                    return (isClusterEntityEntry(null, entity1, entry[0])
                        && isClusterEntityEntry(null, entity2, entry[1]))
                        || (isClusterEntityEntry(null, entity1, entry[1])
                        && isClusterEntityEntry(null, entity2, entry[0]));
                }).map(function (entry) {
                    return entry[2];
                })[0];
        }


        function split(cluster, core) {

            function meanDistancesBetween(cluster, splinterGroup) {

                function distancesTo(cluster, entity) {

                    return cluster
                        .filter(function (entry) {
                            return entry != entity;
                        })
                        .map(function (entity2) {
                            return distanceBetween(entity, entity2);
                        });
                }

                return cluster
                    .map(function (entity) {
                        var meanClusterDistance = distancesTo(cluster, entity)
                                .reduce(function (a, b) {
                                    return a + b;
                                }, 0.0) / cluster.length;
                        var meanSplinterDistance = distancesTo(splinterGroup, entity)
                                .reduce(function (a, b) {
                                    return a + b;
                                }, 0.0) / splinterGroup.length;
                        return {entity: entity, distance: meanSplinterDistance - meanClusterDistance};
                    });
            }

            var splinterGroup = [];
            var rebels = [core];
            while (rebels.length > 0) {
                splinterGroup = splinterGroup.concat(rebels);
                cluster = _.difference(cluster, rebels);
                rebels = meanDistancesBetween(cluster, splinterGroup)
                    .filter(function (entry) {
                        return entry.distance < 0;
                    }).map(function (entry) {
                        return entry.entity;
                    });
            }
            var clusterDistancesToAll = meanDistancesBetween(cluster, entities);
            clusterDistancesToAll = clusterDistancesToAll
                .map(function (a) {
                    return a.distance;
                })
                .reduce(function (a, b) {
                return a + b;
            }, 0.0) / clusterDistancesToAll.length;
            var splinterGroupDistancesToAll = meanDistancesBetween(splinterGroup, entities);
            splinterGroupDistancesToAll = splinterGroupDistancesToAll
                .map(function (a) {
                    return a.distance;
                })
                .reduce(function (a, b) {
                return a + b;
            }, 0.0) / splinterGroupDistancesToAll.length;
            return clusterDistancesToAll > splinterGroupDistancesToAll ?
                [cluster, splinterGroup] : [splinterGroup, cluster];
        }

        function diameter(cluster) {
            return distances
                .filter(function (entry) {
                    return isClusterEntityEntry(cluster, entry[0], entry[0])
                        && isClusterEntityEntry(cluster, entry[1], entry[1]);
                }).map(function (entry) {
                    return entry[2];
                }).sort(function (a, b) {
                    return b - a;
                })[0];
        }

        function nextCluster(clusters) {

            var next = clusters
                .filter(function (cluster) {
                    return cluster.length > 1;
                }).map(function (cluster) {
                    return {cluster: cluster, diameter: diameter(cluster)};
                }).sort(function (a, b) {
                    return b.diameter - a.diameter;
                })[0];

            if (clusters.length == entities.length) {
                return null;
            } else {
                return next;
            }

        }

        function makeHierarchy(oldH, oldC, newC) {
            if (typeof oldH.name === 'undefined') {
                oldH.name = oldC.toString();
                oldH.diameter = diameter(oldC);
                oldH.root = true;
                oldH.children = newC.map(function (c) {return {name: c.toString(), diameter: diameter(c)}});
            } else {
                var stack = oldH.children.slice();
                var current;
                while (stack.length > 0) {
                    current = stack.pop();
                    if (current.name === oldC.toString()) {
                        break;
                    }
                    if (!_.isUndefined(current.children)) {
                        stack = stack.concat(current.children);
                    }
                }
                current.children = newC.map(function (c) {return {name: c.toString(), diameter: diameter(c)}});
            }
        }

        var clusters = [];
        var next = nextCluster([entities.slice()]);
        var hierarchy = {},
            division;

        while (next !== null) {
            clusters = clusters.filter(function (x) {
                return next !== null && next.cluster !== x;
            });
            division = split(next.cluster.slice(), splitCore(next.cluster.slice()));
            clusters = clusters.concat(division.slice());
            makeHierarchy(hierarchy, next.cluster, division.slice());
            next = nextCluster(clusters);
        }

        return {
            hierarchy: hierarchy,
            distances: distances.map(function (d) {
                return [entities.indexOf(d[0]), entities.indexOf(d[1]), d[2]];
            }),
            entities: entities.map(function (e) {
                var c = params.corpora.filter(function (c) { return c.name === e})[0];
                c.group = 0;
                return c;
            })
        };
    }
};