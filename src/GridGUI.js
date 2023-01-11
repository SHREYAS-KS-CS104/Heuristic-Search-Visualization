GridGUI = function(container, mapText) {
    // construct a GUI in the given container
    var self = GUI(container);
    self.map = Grid(mapText);

    // legal actions passed into the search
    self.config = {};
    self.config.actions = [
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0]
    ];
    self.config.actionCosts = [141, 141, 141, 141, 100, 100, 100, 100];
    self.config.tiebreak = 'lessh';
    self.config.weight = 1;
    self.config.heuristic = 'diag';
    self.search = Search_AStar(self.map, self.config);
    self.pixelWidth = 768;
    self.pixelHeight = 768;
    self.sqSize = self.pixelWidth / self.map.width;
    self.showIterations = false;
    self.drawLists = true;
    self.drawParents = false;
    self.drawFGH = false;
    self.step = false;
    self.stepping = false;
    self.drawMethod = 'info';
    self.showGrid = true;
    self.animSpeed = 1;
    self.animSkip = 0;
    self.currentAnimSkip = self.animSkip;
    self.drawTime = 0;
    self.direction = 's2g';
    self.doDetailedSearch = false;
    self.detailedSearchHTML = "";
    self.visOptionsExpanded = false;
    self.instructionsHTML = "";

    // object size and maximum size, for this assignment it is 1
    self.osize = 1;
    self.maxSize = 1;
    self.mx = -1;
    self.my = -1;
    self.gx = -1;
    self.gy = -1;
    self.omx = -1;
    self.omy = -1;
    self.algorithm = 'astar';

    // the colors used to draw the map
    self.colors = ["#888888", "#00ff00", "#0066ff"];
    self.pathTime = 0; // time it took to calculate the previous path

    // draw the foreground, is called every 'frame'
    self.draw = function() {
        // clear the foreground to white
        self.fg_ctx.clearRect(0, 0, self.bg.width, self.bg.height);
        var t0 = performance.now();

        // if the left mouse button is down in a valid location
        if (self.omx != -1) {

            if (self.showIterations) {
                if (!self.stepping) {
                    if (self.currentAnimSkip > 0) {
                        self.currentAnimSkip--;
                    }
                    if (self.currentAnimSkip == 0) {
                        for (var a = 0; a < self.animSpeed; a++) {
                            self.search.searchIteration();
                            self.currentAnimSkip = self.animSkip;
                        }
                    }
                } else if (self.step) {
                    self.search.searchIteration();
                    self.step = false;
                }

            } else {
                var setTime = self.search.inProgress;
                var tt0 = performance.now();
                while (self.search.inProgress) {
                    self.search.searchIteration();
                }
                var tt1 = performance.now();
                if (setTime) {
                    self.pathTime = tt1 - tt0;
                }
            }

            var ix = self.omx;
            var iy = self.omy;

            // start the draw timer
            t0 = performance.now();

            var open = self.search.getOpen();
            // draw the remaining fringe of the BFS
            for (var i = 0; self.drawLists && i < open.length; i++) {
                self.drawAgent(open[i].x, open[i].y, self.osize, '#ffff00');
            }

            // draw the expanded states from the BFS
            var closed = self.search.getClosed();
            for (var i = 0; self.drawLists && i < closed.length; i++) {
                self.drawAgent(closed[i].x, closed[i].y, self.osize, '#ff0000');
            }

            var node = self.search.lastExpanded;
            //if (node != null) { self.drawAgent(node.x, node.y, self.osize, '#aa0000'); }
            while (self.drawMethod == 'step' && node != null) {
                self.drawAgent(node.x, node.y, self.osize, '#880000');
                node = node.parent;
            }

            // draw the path returned by the user's algorithm
            for (i = 0; i < self.search.path.length; i++) {
                self.drawAgent(self.search.path[i].x, self.search.path[i].y, self.osize, '#ffffff');
            }

            // draw the agent in yellow
            self.drawAgent(self.omx, self.omy, self.osize, '#ffffff');

            // draw path to parents
            for (var i = 0; self.drawLists && i < closed.length; i++) {
                if (self.drawParents) {
                    self.drawNodeLine(closed[i], '#ffffff');
                }
                if (self.drawFGH) {
                    fontSize = self.sqSize / 4;
                    self.drawText('g ' + closed[i].g, closed[i].x * self.sqSize + 3, closed[i].y * self.sqSize + fontSize + 3, '#000000', fontSize);
                    self.drawText('h ' + closed[i].h, closed[i].x * self.sqSize + 3, closed[i].y * self.sqSize + 2 * fontSize + 3, '#000000', fontSize);
                    self.drawText('f ' + (closed[i].g + closed[i].h), closed[i].x * self.sqSize + 3, closed[i].y * self.sqSize + 3 * fontSize + 3, '#000000', fontSize);
                }
            }

            for (var i = 0; self.drawLists && i < open.length; i++) {
                if (self.drawParents) {
                    self.drawNodeLine(open[i], '#ffffff');
                }
                if (self.drawFGH) {
                    fontSize = self.sqSize / 4;
                    self.drawText('g ' + open[i].g, open[i].x * self.sqSize + 3, open[i].y * self.sqSize + fontSize + 3, '#000000', fontSize);
                    self.drawText('h ' + open[i].h, open[i].x * self.sqSize + 3, open[i].y * self.sqSize + 2 * fontSize + 3, '#000000', fontSize);
                    self.drawText('f ' + (open[i].g + open[i].h), open[i].x * self.sqSize + 3, open[i].y * self.sqSize + 3 * fontSize + 3, '#000000', fontSize);
                }
            }
        }

        if (self.mx != -1 && self.mouse == 3) {
            for (var x = 0; x < self.map.width; x++) {
                for (var y = 0; y < self.map.height; y++) {
                    if (self.search.isConnected(self.mx, self.my, x, y, self.osize)) {
                        self.drawAgent(x, y, 1, '#ff22ff');
                    }
                }
            }
        }

        // if the mouse is on the screen, draw the current location
        if (self.mx != -1) {
            self.drawAgent(self.mx, self.my, self.osize, '#ffffff');
        }

        // if there's a search in progress, draw the goal
        // if the mouse is on the screen, draw the current location
        if (self.search.inProgress) {
            self.drawAgent(self.search.gx, self.search.gy, self.osize, '#ffffff');
        }

        // draw horizontal lines
        if (self.showGrid) {
            self.fg_ctx.fillStyle = "#000000";
            for (y = 0; y < self.map.height; y++) {
                self.fg_ctx.fillRect(0, y * self.sqSize, self.fg.width, 1);
            }
            for (x = 0; x < self.map.width; x++) {
                self.fg_ctx.fillRect(x * self.sqSize, 0, 1, self.fg.height);
            }
        }

        // calculate how long the drawing took
        var t1 = performance.now();
        self.drawTime = t1 - t0;

        if (self.doDetailedSearch) {
            self.displaySearchInfo(self.textDiv, false);
            self.doDetailedSearch = false;
        }
    }

    self.drawNodeLine = function(node, color) {
        if (node.parent == null) {
            return;
        }
        var half = self.sqSize / 2;
        self.fg_ctx.fillStyle = color;
        ox1 = node.x * self.sqSize + half;
        oy1 = node.y * self.sqSize + half;
        ox2 = ox1 - (node.action[0] / 3) * self.sqSize;
        oy2 = oy1 - (node.action[1] / 3) * self.sqSize;
        self.drawLine(ox1, oy1, ox2, oy2, color);
    }

    self.drawLine = function(x1, y1, x2, y2, color) {
        self.fg_ctx.fillStyle = color;
        self.fg_ctx.beginPath();
        self.fg_ctx.moveTo(x1, y1);
        self.fg_ctx.lineTo(x2, y2);
        self.fg_ctx.stroke();
    }

    self.drawText = function(text, x, y, color, size) {
        self.fg_ctx.font = size + 'px arial';
        self.fg_ctx.fillStyle = color;
        self.fg_ctx.fillText(text, x, y);
    }

    self.drawAgent = function(x, y, size, color) {
        self.fg_ctx.fillStyle = color;
        for (var sx = 0; sx < size; sx++) {
            for (var sy = 0; sy < size; sy++) {
                self.fg_ctx.fillRect((x + sx) * self.sqSize, (y + sy) * self.sqSize, self.sqSize, self.sqSize);
            }
        }
    }

    self.startSearch = function() {

        if (self.direction == 's2g') {
            self.search.startSearch(self.omx, self.omy, self.gx, self.gy, self.osize);
        } else if (self.direction == 'g2s') {
            self.search.startSearch(self.gx, self.gy, self.omx, self.omy, self.osize);
        }

    }

    // draw the background map, is called once on construction
    self.drawBackground = function() {
        for (y = 0; y < self.map.height; y++) {
            for (x = 0; x < self.map.width; x++) {
                self.bg_ctx.fillStyle = self.colors[self.map.get(x, y) - '0'];
                self.bg_ctx.fillRect(x * self.sqSize, y * self.sqSize, self.sqSize, self.sqSize);
            }
        }
    }

    self.addEventListeners = function() {
        self.fg.addEventListener('mousemove', function(evt) {
            var mousePos = self.getMousePos(self.fg, evt);
            var newmx = Math.floor(mousePos.x / self.sqSize);
            var newmy = Math.floor(mousePos.y / self.sqSize);

            // if this is a new mouse position
            if (self.mouse == 1) {
                self.gx = self.mx;
                self.gy = self.my;
                self.startSearch();
                self.doDetailedSearch = true;
            }

            self.mx = newmx;
            self.my = newmy;

        }, false);

        self.fg.addEventListener('mousedown', function(evt) {
            var mousePos = self.getMousePos(self.fg, evt);
            self.mouse = evt.which;

            if (self.mouse == 1) {
                if (self.omx != -1 && self.omx == self.gx && self.omy == self.gy) {
                    self.gx = self.mx;
                    self.gy = self.my;
                    self.startSearch();
                    self.doDetailedSearch = true;
                } else {
                    self.omx = Math.floor(mousePos.x / self.sqSize);
                    self.omy = Math.floor(mousePos.y / self.sqSize);
                    self.gx = self.mx;
                    self.gy = self.my;
                    self.startSearch();
                    self.doDetailedSearch = true;
                }
            }

            if (self.mouse == 2) {
                self.osize++;
                if (self.osize > self.maxSize) {
                    self.osize = 1;
                }
            }
        }, false);

        self.fg.addEventListener('mouseup', function(e) {
            self.mouse = -1;
            //self.omx = -1;
            //self.omy = -1;
        }, false);

        self.fg.oncontextmenu = function(e) {
            e.preventDefault();
        };
    }

    setAnimationSpeed = function(value) {
        self.animSkip = 1;
        if (value == '1/32') {
            self.animSpeed = 1;
            self.animSkip = 32;
        }
        if (value == '1/8') {
            self.animSpeed = 1;
            self.animSkip = 8;
        }
        if (value == '1/4') {
            self.animSpeed = 1;
            self.animSkip = 4;
        }
        if (value == '1/2') {
            self.animSpeed = 1;
            self.animSkip = 2;
        }
        if (value == '1') {
            self.animSpeed = 1;
        }
        if (value == '2') {
            self.animSpeed = 2;
        }
        if (value == '4') {
            self.animSpeed = 4;
        }
        if (value == '8') {
            self.animSpeed = 8;
        }
        if (value == '32') {
            self.animSpeed = 32;
        }
        self.currentAnimSkip = self.animSkip;
    }

    setObjectSize = function(value) {
        if (value == '1') {
            self.osize = 1;
        }
        if (value == '2') {
            self.osize = 2;
        }
        if (value == '3') {
            self.osize = 3;
        }
        setAlgorithm(self.algorithm);
    }

    setDirection = function(value) {
        self.direction = value;
        setAlgorithm(self.algorithm);
    }

    setAStarWeight = function(value) {
        if (value == '1') {
            self.config.weight = 1;
        }
        if (value == '1.1') {
            self.config.weight = 1.1;
        }
        if (value == '1.5') {
            self.config.weight = 1.5;
        }
        if (value == '2') {
            self.config.weight = 2;
        }
        if (value == '4') {
            self.config.weight = 4;
        }
        if (value == '8') {
            self.config.weight = 8;
        }
        setAlgorithm(self.algorithm);
    }

    setAStarTiebreak = function(value) {
        if (value == 'fonly') {
            self.config.tiebreak = 'fonly';
        }
        if (value == 'lessg') {
            self.config.tiebreak = 'lessg';
        }
        if (value == 'lessh') {
            self.config.tiebreak = 'lessh';
        }
        setAlgorithm(self.algorithm);
    }

    setHeuristic = function(value) {
        self.config.heuristic = value;
        setAlgorithm(self.algorithm);
    }

    setLegalActions = function(value) {
        if (value == 'card') {
            self.config.actions = [
                [0, 1],
                [0, -1],
                [1, 0],
                [-1, 0]
            ];
            self.config.actionCosts = [100, 100, 100, 100];
        }
        if (value == 'diag') {
            self.config.actions = [
                [1, 1],
                [-1, -1],
                [1, -1],
                [-1, 1],
                [0, 1],
                [0, -1],
                [1, 0],
                [-1, 0]
            ];
            self.config.actionCosts = [141, 141, 141, 141, 100, 100, 100, 100];
        }
        setAlgorithm(self.algorithm);
    }

    setMap = function(value) {
        if (value == 'default') {
            self.map = Grid(document.getElementById("defaultmap").value);
        }
        if (value == 'blank') {
            self.map = Grid(document.getElementById("blankmap").value);
        }
        if (value == 'wheel') {
            self.map = Grid(document.getElementById("wheelofwar").value);
        }
        if (value == 'caves') {
            self.map = Grid(document.getElementById("caves").value);
        }
        if (value == 'bigcaves') {
            self.map = Grid(document.getElementById("bigcaves").value);
        }
        if (value == 'lshape') {
            self.map = Grid(document.getElementById("lshapemap").value);
        }
        if (value == '256maze') {
            self.map = Grid(document.getElementById("256maze").value);
        }
        if (value == '128maze') {
            self.map = Grid(document.getElementById("128maze").value);
        }
        if (value == '64maze') {
            self.map = Grid(document.getElementById("64maze").value);
        }

        self.sqSize = self.pixelWidth / self.map.width;
        self.bg_ctx.clearRect(0, 0, self.pixelWidth, self.pixelHeight);
        self.omx = -1;
        self.omy = -1;
        self.gx = -1;
        self.gy = -1;
        self.drawBackground();
        setAlgorithm(self.algorithm);
    }

    setAlgorithm = function(algorithm) {
        self.detailedSearchHTML = "";
        self.pathTime = 0;
        self.algorithm = algorithm;
        document.getElementById('astartiebreak').style.display = 'none';
        document.getElementById('astarweight').style.display = 'none';
        document.getElementById('heuristic').disabled = true;
        self.search = getAlgorithm(algorithm);
        if (algorithm == 'gbefs') {
            document.getElementById('heuristic').disabled = false;
        }
        if (algorithm == 'astar') {
            document.getElementById('astartiebreak').style.display = 'inline';
            document.getElementById('heuristic').disabled = false;
        }
        if (algorithm == 'wastar') {
            document.getElementById('astarweight').style.display = 'inline';
            document.getElementById('heuristic').disabled = false;
        }
        if (self.omx != -1) {
            self.doDetailedSearch = true;
        }
        self.startSearch();
    }

    getAlgorithm = function(algorithm) {
        if (algorithm == 'bfs') {
            return Search_BFS(self.map, self.config);
        } else if (algorithm == 'dfs') {
            return Search_DFS(self.map, self.config);
        } else if (algorithm == 'ucs') {
            return Search_UCS(self.map, self.config);
        } else if (algorithm == 'idastar') {
            return Search_IDAStar(self.map, self.config);
        } else if (algorithm == 'gbefs') {
            return Search_GreedyBeFS(self.map, self.config);
        } else if (algorithm == 'astar') {
            return Search_AStar(self.map, self.config);
        } else if (algorithm == 'wastar') {
            return Search_WAStar(self.map, self.config);
        } else {
            return null;
        }
    }

    var expanded = false;

    showCheckboxes = function() {
        var checkboxes = document.getElementById("checkboxes");
        if (!expanded) {
            checkboxes.style.display = "block";
            expanded = true;
        } else {
            checkboxes.style.display = "none";
            expanded = false;
        }
    }


    setDrawMethod = function(value) {
        document.getElementById('stepbutton').style.display = "none";
        document.getElementById('animspeed').style.display = "none";
        if (value == 'info') {
            self.showIterations = false;
            self.drawInfo = true;
            self.stepping = false;
        } else if (value == 'iter') {
            self.showIterations = true;
            self.drawInfo = true;
            self.stepping = false;
            document.getElementById('animspeed').style.display = "inline";
            if (self.drawMethod == 'info') {
                self.startSearch();
            }
        } else if (value == 'step') {
            self.showIterations = true;
            self.drawInfo = true;
            self.stepping = true;
            document.getElementById('stepbutton').style.display = "inline";
            if (self.drawMethod == 'info') {
                self.startSearch();
            }
        }
        self.drawMethod = value;
    }

    getAlgorithmDetails = function(algorithm) {
        var search = getAlgorithm(algorithm);
        var t0 = performance.now();
        search.startSearch(self.omx, self.omy, self.gx, self.gy, self.osize);
        while (search.inProgress) {
            search.searchIteration();
        }
        var t1 = performance.now();
        var ms = t1 - t0;

        var rowHTML = "<tr><td>" + search.name + "</td>";
        rowHTML += "<td>" + (self.omx == -1 ? '-' : "(" + self.omx + "," + self.omy + ")") + "</td>";
        rowHTML += "<td>" + (self.gx == -1 ? '-' : "(" + self.gx + "," + self.gy + ")") + "</td>";
        rowHTML += "<td>" + search.cost + "</td><td>" + search.nodesExpanded + "</td>";
        rowHTML += "<td>" + ms.toFixed(4) + "</td><td>" + Math.round(search.nodesExpanded / ms) + " k</td>";
        rowHTML += "<td>" + Math.round(search.totalOpenSize / search.nodesExpanded) + "</td>";
        rowHTML += "</tr>";
        return rowHTML;
    }

    self.displaySearchInfo = function(div, all) {

        var algorithms = ['astar', 'ucs', 'wastar', 'gbefs', 'bfs', 'dfs'];

        self.detailedSearchHTML = "<table border='1px black'>";
        self.detailedSearchHTML += "<tr><th>Algorithm</th><th>Start<br>Location</th><th>Goal<br>Location</th><th>Path<br>Cost</th><th>Closed<br>List Size</th><th>Search<br>Time (ms)</th><th>Node<br>Per Sec</th><th>Avg<br>Open</th></tr>"

        if (all) {
            for (var i = 0; i < algorithms.length; i++) {
                self.detailedSearchHTML += getAlgorithmDetails(algorithms[i]);
            }
        } else {
            var nps = (self.pathTime == 0 || self.showIterations) ? '-' : Math.round(self.search.nodesExpanded / self.pathTime) + ' k';
            var rowHTML = "<tr><td>" + self.search.name + "</td>";
            rowHTML += "<td>" + (self.omx == -1 ? '-' : "(" + self.omx + "," + self.omy + ")") + "</td>";
            rowHTML += "<td>" + (self.gx == -1 ? '-' : "(" + self.gx + "," + self.gy + ")") + "</td>";
            rowHTML += "<td>" + self.search.cost + "</td>";
            rowHTML += "<td>" + self.search.nodesExpanded + "</td>";
            rowHTML += "<td>" + (self.showIterations ? '-' : self.pathTime.toFixed(4)) + "</td><td>" + nps + "</td>";
            rowHTML += "<td>" + Math.round(self.search.totalOpenSize / self.search.nodesExpanded) + "</td>";
            rowHTML += "</tr>";
            self.detailedSearchHTML += rowHTML;
        }

        self.detailedSearchHTML += "</table>"
        div.innerHTML = self.detailedSearchHTML;
    }

    self.displaySearchInfo2 = function(div) {
        var html = "<table border='1px black'>";
        html += "<tr><td>Algorithm</td><td>" + self.search.name + "</td></tr>";
        html += "<tr><td>Path Cost</td><td>" + self.search.cost + "</td></tr>";
        html += "<tr><td>Nodes Expanded</td><td>" + self.search.nodesExpanded + "</td></tr>";
        html += "<tr><td>Compute Time</td><td>" + self.pathTime.toFixed(4) + " ms</td></tr>";
        html += "<tr><td>Nodes / s</td><td>" + Math.round(self.search.nodesExpanded / self.pathTime) + " k</td></tr>";
        html += "<tr><td>Mouse Pos</td><td>(" + self.mx + "," + self.my + ")</td></tr>";
        html += "<tr><td>Heuristic</td><td>" + (self.search.gx == -1 ? 'No Goal Selected' : self.search.estimateCost(self.mx, self.my, self.search.gx, self.search.gy)) + "</td></tr>";

        html += "<tr><td>Draw Time</td><td>" + Math.round(self.drawTime) + " ms</td></tr>";
        html += "</table>";

        div.innerHTML = html;
    }

    self.setHTML = function() {
        self.createCanvas(self.map.width * self.sqSize + 1, self.map.height * self.sqSize + 1);
        self.bannerDiv = self.create('div', 'BannerContainer', self.fg.width + 30, 0, 600, 40);
        self.controlDiv = self.create('div', 'ContronContainer', self.fg.width + 30, 60, 600, 350);
        self.textDiv = self.create('div', 'TextContainer', self.fg.width + 30, 450, 600, 400);

        self.controlDiv.innerHTML += "<label id='labelmap'>Select Map:</label>";
        self.controlDiv.innerHTML += "<label id='labelalg'>Search Algorithm:</label>";
        self.controlDiv.innerHTML += "<label id='labeldir'>Search Direction:</label>";
        self.controlDiv.innerHTML += "<label id='labelsize'>Object Size:</label>";
        self.controlDiv.innerHTML += "<label id='labelactions'>Legal Actions:</label>";
        self.controlDiv.innerHTML += "<label id='labelh'>Heuristic Function:</label>";
        self.controlDiv.innerHTML += "<label id='labelvis'>Visualization:</label>";
        self.controlDiv.innerHTML += "<select id='selectmap' onchange='setMap(value)';> \
                                        <option value='default'>Default (64 x 64)</option> \
                                        <option value='lshape'>L-Shape Wall (16 x 16)</option> \
                                        <option value='caves'>Sparse Caves (128 x 128)</option> \
                                        <option value='bigcaves'>Dense Caves (256 x 256)</option> \
                                        <option value='wheel'>StarCraft: Wheel of War (256 x 256)</option> \
                                        <option value='64maze'>Small Maze (64 x 64)</option> \
                                        <option value='128maze'>Medium Maze (128 x 128)</option> \
                                        <option value='256maze'>Large Maze (256 x 256)</option> \
                                        <option value='blank'>Blank (32 x 32)</option> \
                                        </select><button id='togglegrid'>Toggle Grid</button><br><br>";
        self.controlDiv.innerHTML += "<select id='algorithm' onchange='setAlgorithm(value)';> \
                                        <option value='astar'>A* Search (A*)</option> \
                                        <option value='wastar'>Weighted A* Search (WA*)</option> \
                                        <option value='bfs'>Breadth-First Search (BFS)</option> \
                                        <option value='dfs'>Depth-First Search (DFS)</option> \
                                        <option value='ucs'>Uniform Cost Search (UCS)</option> \
                                        <option value='gbefs'>Greedy Best-First Search (GBeFS)</option></select>";
        //<option value='idastar'>Iterative Deepening A* (IDA*)</option> \
        self.controlDiv.innerHTML += "<select id='astarweight' onchange='setAStarWeight(value)';> \
                                        <option value='1'>1x Heuristic</option> \
                                        <option value='1.1'>1.1x Heuristic</option> \
                                        <option value='1.5'>1.5x Heuristic</option> \
                                        <option value='2'>2x Heuristic</option> \
                                        <option value='4'>4x Heuristic</option> \
                                        <option value='8'>8x Heuristic</option></select>";
        self.controlDiv.innerHTML += "<select id='astartiebreak' onchange='setAStarTiebreak(value)';> \
                                        <option value='lessh'>Tiebreak Min H</option> \
                                        <option value='lessg'>Tiebreak Min G</option> \
                                        <option value='fonly'>Select Min F Only</option></select><br><br>";
        self.controlDiv.innerHTML += "<select id='direction' onchange='setDirection(value)';> \
                                        <option value='s2g'>Start to Goal</option> \
                                        <option value='g2s'>Goal to Start</option><br><br>";
        self.controlDiv.innerHTML += "<select id='objectsize' onchange='setObjectSize(value)';> \
                                        <option value='1'>1x1 Square</option> \
                                        <option value='2'>2x2 Square</option> \
                                        <option value='3'>3x3 Square</option></select><br><br>";
        self.controlDiv.innerHTML += "<select id='legalactions' onchange='setLegalActions(value)';> \
                                        <option value='diag'>8 Directions (4 Cardinal + Diagonals)</option> \
                                        <option value='card'>4 Cardinal (Up, Down, Left, Right)</option> </select><br><br>";
        self.controlDiv.innerHTML += "<select id='heuristic' onchange='setHeuristic(value)';> \
                                        <option value='diag'>8 Direction Manhattan</option> \
                                        <option value='card'>4 Direction Manhattan</option> \
                                        <option value='dist'>2D Euclidean Distance</option> \
                                        <option value='zero'>Zero (No Heuristic)</option></select><br><br>";
        self.controlDiv.innerHTML += "<select id='drawMethod' onchange='setDrawMethod(value)';> \
                                        <option value='info'>Instant Path</option> \
                                        <option value='iter'>Animated Search</option> \
                                        <option value='step'>Single Step</option></select><button id='stepbutton'>Step</button>";
        self.controlDiv.innerHTML += "<label id='showlistlabel'><input type='checkbox' id='showlists' checked/>Show Open / Closed Lists</label>"
        self.controlDiv.innerHTML += "<label id='showparlabel'><input type='checkbox' id='showparent' />Show Parent Pointers</label>"
        self.controlDiv.innerHTML += "<label id='showfghlabel'><input type='checkbox' id='showfgh' />Show f/g/h Data</label>"

        self.controlDiv.innerHTML += "<select id='animspeed' onchange='setAnimationSpeed(value)';> \
                                        <option value='1/32'>1/32x Speed</option> \
                                        <option value='1/8'>1/8x Speed</option> \
                                        <option value='1/4'>1/4x Speed</option> \
                                        <option value='1/2'>1/2x Speed</option> \
                                        <option value='1' selected='selected'>1x Speed</option> \
                                        <option value='2'>2x Speed</option> \
                                        <option value='4'>4x Speed</option> \
                                        <option value='8'>8x Speed</option> \
                                        <option value='32'>32x Speed</option></select><br><br>";

        //self.controlDiv.innerHTML += "Toggle Drawing: <button id='lists'>Open/Closed</button><button id='parents'>Parents</button><button id='fgh'>F/G/H</button><br><br><br>";
        self.controlDiv.innerHTML += "<button id='rerun'>Re-Run Previous</button>";
        self.controlDiv.innerHTML += "<button id='runall'>Run All Algorithms</button>";
        self.controlDiv.innerHTML += "<button id='instructions'>Instructions</button>";

        self.bannerDiv.innerHTML = "<b>HTML5 Heuristic Search Visualization</b> - <a href='http://www.cs.mun.ca/~dchurchill/'>vi</a>";

        self.instructionsHTML = "<b>Search Visualization Instructions:</b><br>";
        self.instructionsHTML += "<ul>";
        self.instructionsHTML += "<li><font color='#ff0000'><b>DESKTOP: LEFT CLICK AND DRAG TO SET START AND GOAL TILE</b></font></li>";
        self.instructionsHTML += "<li><font color='#ff0000'><b>MOBILE: TAP START TILE THEN TAP GOAL TILE (no drag)</b></font></li>";
        self.instructionsHTML += "<li>Right Click a tile to see all tiles connected to that tile</li>";
        self.instructionsHTML += "<li>Object can only move through same color tiles in the grid</li>";
        self.instructionsHTML += "<li>Click any drop-down menu above to change the search settings</li>";
        self.instructionsHTML += "<li>Choose 'Animate Search' visualization to see real-time search progress</li>";
        self.instructionsHTML += "<li>Re-Run Previous - Performs previous search again (useful when animating)</li>";
        self.instructionsHTML += "<li>Run All Algorithms - Runs all algorithms on current path (slow on large maps)</li>";
        self.instructionsHTML += "</ul>";
        self.instructionsHTML += "<b>Visualization Legend:</b><br>";
        self.instructionsHTML += "<ul>";
        self.instructionsHTML += "<li>Blue / Green / Grey Tile - Terrain type, object can move within a colour</li>";
        self.instructionsHTML += "<li>Red Tile - Node is in closed list (has been expanded)</li>";
        self.instructionsHTML += "<li>Yellow Tile - Node is in open list (generated, but not expanded) </li>";
        self.instructionsHTML += "<li>White Tile - Node is on the generated path</li>";
        self.instructionsHTML += "<li>Pink Tile - Node is connected to the right-clicked tile</li>";
        self.instructionsHTML += "<li>Parent Pointers - Line points from tile to its search parent node</li>";
        self.instructionsHTML += "<li>F/G/H Values - Too small to read on anything bigger than 16x16 map</li>";
        self.instructionsHTML += "</ul>";
        self.textDiv.innerHTML = self.instructionsHTML;

        var stylePrefix = 'position:absolute;';
        var ch = '25px',
            c1l = '0px',
            c2l = '150px',
            c3l = '425px',
            c1w = '140px',
            c2w = '250px',
            c3w = '150px';

        // Map Selection
        document.getElementById('labelmap').style = stylePrefix + ' left:' + c1l + '; top:0;   width:' + c1w + '; height:' + ch + ';';
        document.getElementById('selectmap').style = stylePrefix + ' left:' + c2l + '; top:0;   width:' + c2w + '; height:' + ch + ';';
        document.getElementById('togglegrid').style = stylePrefix + ' left:' + c3l + '; top:0;   width:' + c3w + '; height:' + ch + ';';

        // Algorithm Selection
        document.getElementById('labelalg').style = stylePrefix + ' left:' + c1l + '; top:40;  width:' + c1w + '; height:' + ch + ';';
        document.getElementById('algorithm').style = stylePrefix + ' left:' + c2l + '; top:40;  width:' + c2w + '; height:' + ch + ';';
        document.getElementById('astartiebreak').style = stylePrefix + ' left:' + c3l + '; top:40;  width:' + c3w + '; height:' + ch + ';';
        document.getElementById('astarweight').style = stylePrefix + ' left:' + c3l + '; top:40;  width:' + c3w + '; height:' + ch + '; display:none;';

        // Direction Selection
        document.getElementById('labeldir').style = stylePrefix + ' left:' + c1l + '; top:80;  width:' + c1w + '; height:' + ch + ';';
        document.getElementById('direction').style = stylePrefix + ' left:' + c2l + '; top:80;  width:' + c2w + '; height:' + ch + ';';

        // Object Size Selection
        document.getElementById('labelsize').style = stylePrefix + ' left:' + c1l + '; top:120;  width:' + c1w + '; height:' + ch + ';';
        document.getElementById('objectsize').style = stylePrefix + ' left:' + c2l + '; top:120;  width:' + c2w + '; height:' + ch + ';';

        // Action Selection
        document.getElementById('labelactions').style = stylePrefix + ' left:' + c1l + '; top:160; width:' + c1w + '; height:' + ch + ';';
        document.getElementById('legalactions').style = stylePrefix + ' left:' + c2l + '; top:160; width:' + c2w + '; height:' + ch + ';';

        // Heuristic Selection
        document.getElementById('labelh').style = stylePrefix + ' left:' + c1l + '; top:200; width:' + c1w + '; height:' + ch + ';';
        document.getElementById('heuristic').style = stylePrefix + ' left:' + c2l + '; top:200; width:' + c2w + '; height:' + ch + ';';

        // Visualization Selection
        document.getElementById('labelvis').style = stylePrefix + ' left:' + c1l + '; top:240; width:' + c1w + '; height:' + ch + ';';
        document.getElementById('drawMethod').style = stylePrefix + ' left:' + c2l + '; top:240; width:' + c2w + '; height:' + ch + ';';
        document.getElementById('stepbutton').style = stylePrefix + ' left:' + c3l + '; top:240; width:' + c3w + '; height:' + ch + '; display:none;';
        document.getElementById('animspeed').style = stylePrefix + ' left:' + c3l + '; top:240; width:' + c3w + '; height:' + ch + '; display:none;';

        // Advanced Visualization Options
        document.getElementById('showlistlabel').style = stylePrefix + ' left:' + c2l + '; top:270; width:' + c2w + '; height:' + ch + ';';
        document.getElementById('showparlabel').style = stylePrefix + ' left:' + c2l + '; top:290; width:' + c2w + '; height:' + ch + ';';
        document.getElementById('showfghlabel').style = stylePrefix + ' left:' + c2l + '; top:310; width:' + c2w + '; height:' + ch + ';';

        document.getElementById('rerun').style = stylePrefix + ' left:110px; top:340; width:140px; height:' + ch + ';';
        document.getElementById('runall').style = stylePrefix + ' left:260px; top:340; width:140px; height:' + ch + ';';
        document.getElementById('instructions').style = stylePrefix + ' left:0px; top:340; width:100px; height:' + ch + ';';

        document.getElementById('stepbutton').onclick = function() {
            self.step = true;
        }
        document.getElementById('togglegrid').onclick = function() {
            self.showGrid = !self.showGrid;
        }

        document.getElementById('rerun').onclick = function() {
            self.startSearch();
            self.doDetailedSearch = true;
        }
        document.getElementById('showlists').onclick = function() {
            self.drawLists = !self.drawLists;
        }
        document.getElementById('showparent').onclick = function() {
            self.drawParents = !self.drawParents;
            self.drawFGH = false;
            document.getElementById('showfgh').checked = false;
        }
        document.getElementById('showfgh').onclick = function() {
            self.drawFGH = !self.drawFGH;
            self.drawParents = false;
            document.getElementById('showparent').checked = false;
        }
        document.getElementById('runall').onclick = function() {
            self.displaySearchInfo(self.textDiv, true);
        }
        document.getElementById('instructions').onclick = function() {
            self.textDiv.innerHTML = self.instructionsHTML;
        }
    }

    self.setHTML();
    self.addEventListeners();
    self.drawBackground();
    return self;
}