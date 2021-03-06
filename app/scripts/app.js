/*global define */
define([], function () {
    'use strict';

    return '';
});

var Point = function(x, y) {
    'use strict';
    this.x = x;
    this.y = y;
};

// var ProjectedPoint = function(x, y) {
//     'use strict';
//     this.x = x;
//     this.y = y;
// };

var Coordinate = function(latitude, longitude) {
    'use strict';
    this.latitude = latitude;
    this.longitude = longitude;
};

var Size = function(width, height) {
    'use strict';
    this.width = width;
    this.height = height;
};

var Rect = function(x, y, width, height) {
    'use strict';
    this.origin = new Point(x, y);
    this.size = new Size(width, height);
};

var Map2 = function() {
    'use strict';
    this.zoom = 0;
    this.tileLength = 256;
    this.projectedRect = new Rect(-20037508.34, -20037508.34, 20037508.34 * 2, 20037508.34 * 2);
};

// public

Map2.prototype.coordinateToPixel = function(coordinate) {
    'use strict';
    var projectedPoint = this.coordinateToProjectedPoint(coordinate);
    return this.projectedPointToPixel(projectedPoint);
};

Map2.prototype.pixelToCoordinate = function(point) {
    'use strict';
    var projectedPoint = this.pixelToProjectedPoint(point);
    return this.projectedPointToCoordinate(projectedPoint);
};

// protected

Map2.prototype.projectedPointToCoordinate = function(projectedPoint) {
    'use strict';
    projectedPoint.x /= 6378137.0;
    projectedPoint.y /= 6378137.0;
  
    var d = 180.0 / Math.PI;
  
    var coordinate = new Coordinate(projectedPoint.x * d, (2 * Math.atan(Math.exp(projectedPoint.y)) - (Math.PI / 2)) * d);
    return coordinate;
};

Map2.prototype.coordinateToProjectedPoint = function(coordinate) {
    'use strict';
    var d = Math.PI / 180.0;
    var max = 85.0511287798;
    var lat = Math.max(Math.min(max, coordinate.latitude), -max);
    var x = coordinate.longitude * d;
    var y = lat * d;
    y = Math.log(Math.tan((Math.PI / 4) + (y / 2)));
  
    var projectedPoint = new Point(x * 6378137.0, y * 6378137.0);
    return projectedPoint;
};

// private

Map2.prototype.projectedPointToPixel = function(projectedPoint) {
    'use strict';
    var metersPerPixel = this.metersPerPixel();
    var normalizedProjectedPoint = new Point(projectedPoint.x + Math.abs(this.projectedRect.origin.x), projectedPoint.y + Math.abs(this.projectedRect.origin.y));
    var point = new Point((normalizedProjectedPoint.x / metersPerPixel), (this.contentSize().height - (normalizedProjectedPoint.y / metersPerPixel)));
    return point;
};

Map2.prototype.pixelToProjectedPoint = function(point) {
    'use strict';
    var metersPerPixel = this.metersPerPixel();
    var normalizedProjectedPointx = point.x * metersPerPixel - Math.abs(this.projectedRect.origin.x);
    var normalizedProjectedPointy = ((this.contentSize().height - point.y) * metersPerPixel) - Math.abs(this.projectedRect.origin.y);
    var normalizedProjectedPoint = new Point(normalizedProjectedPointx, normalizedProjectedPointy);

    return normalizedProjectedPoint;
};

Map2.prototype.contentSize = function() {
    'use strict';
    var contentLength = Math.pow(2, this.zoom) * this.tileLength;
    return new Size(contentLength, contentLength);
};

Map2.prototype.metersPerPixel = function() {
    'use strict';
    return this.projectedRect.size.width / this.contentSize().width;
};

// var map = new Map2();
// map.zoom = 15;

// var point = map.coordinateToPixel(new Coordinate(35.3, 139.3));
// console.log(point); // Point {x: 7440229.262674059, y: 3314159.882238767}

// var coordinate = map.pixelToCoordinate(point);
// console.log(coordinate); // Coordinate {latitude: 139.3, longitude: 35.29999999999999}

var mapdivName = 'mapdiv';

// var width = innerWidth * 0.8;
var height = window.innerHeight * 0.6;

$('#' + mapdivName).css({height: height});

var map = L.map(mapdivName).setView([35.7, 139.7], 13);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var tmpleft = $('#' + mapdivName).width() / 2 - 5;
var tmptop = height / 2 - 5;
$('#map_center').css({left: tmpleft, top: tmptop});

map.on('move', function() {
    'use strict';
    var center = map.getCenter();
    $('#input1').val(center.lat + ',' + center.lng + ',' + map._zoom);
});

$('#ok').click(function() {
    'use strict';

    var x, y;

    var m = new Map2();
    m.zoom = map._zoom;

    var center = map.getCenter();

    var point = m.coordinateToPixel(new Coordinate(center.lat, center.lng));

    var indexX = Math.floor(point.x / 256);
    var indexY = Math.floor(point.y / 256);

    var length = parseInt($('#select1').val(), 10);

    var leftTopX = indexX - Math.floor(length / 2);
    var leftTopY = indexY - Math.floor(length / 2);

    var html = 'mkdir bigmap;cd bigmap; \\\n';
    for (x = leftTopX; x < leftTopX + length; x++) {
        html += 'mkdir ' + x + '; \\\n';
        html += 'cd ' + x + '; \\\n';
        html += 'curl -O http://tile.osm.org/' + map._zoom + '/' + x + '/[' + leftTopY + '-' + (leftTopY+length-1) + '].png; \\\n';
        html += 'convert -append ';
        for (y = leftTopY; y < leftTopY + length; y++) {
            html += y + '.png ';
        }
        html += 'tmp.png; \\\n';
        html += 'cd ..; \\\n';
    }
    html += 'convert +append ';
    for (x = leftTopX; x < leftTopX + length; x++) {
        html += x + '/tmp.png ';
    }
    html += 'comp.png; \\\n';
    html += 'rm -rf';
    for (x = leftTopX; x < leftTopX + length; x++) {
        html += ' ' + x;
    }
    html += '; cd ..';
    $('#textarea1').html(html);

    var html2 = '';
    for (y = 0; y < length; y++) {
        for (x = 0; x < length; x++) {
            html2 += 'convert -crop 256x256+' + (256 * x) + '+' + (256 * y) + ' comp.png ' + map._zoom + '-' + (leftTopX + x) + '-' + (leftTopY + y) + '.png; \\\n';
        }
    }
    $('#textarea2').html(html2);
});