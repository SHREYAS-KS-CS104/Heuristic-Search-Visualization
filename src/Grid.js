Grid = function(mapText) {
    var self = {};
    self.grid = mapText.split("\n");

    self.width = self.grid.length;
    self.height = self.grid[0].length;
    self.maxSize = 3;

    self.get = function(x, y) {
        return self.grid[y][x];
    }

    self.isOOB = function(x, y, size) {
        return x < 0 || y < 0 || (x + size) > self.width || (y + size) > self.height;
    }

    return self;
}