// script.js
const width = 800;
const height = 600;

let svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Definindo um marcador de seta para mostrar a direção do fluxo
svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "blue");

// script.js
// ...

function generateRandomGraph() {
    // Limpa o SVG anterior
    svg.selectAll("*").remove();

    // Adiciona novamente o marcador de seta
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "blue");

    // Gera um grafo aleatório
    const numNodes = Math.floor(Math.random() * 6) + 5; // 5 a 10 nós
    const nodes = Array.from({ length: numNodes }, (_, i) => ({ id: `Node${i}` }));
    const links = [];

    for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
            if (i !== j && Math.random() > 0.7) { // 30% chance de ter uma aresta
                const capacity = Math.floor(Math.random() * 20) + 1; // Capacidade de 1 a 20
                links.push({ source: `Node${i}`, target: `Node${j}`, capacity: capacity, weight: Math.floor(Math.random() * 10) + 1 }); // Adiciona o peso aleatório
            }
        }
    }

    // Define source e sink
    const source = "Node0";
    const sink = `Node${numNodes - 1}`;

    // Desenha o grafo
    drawGraph({ nodes, links }, source, sink);

    // Executa o algoritmo de Edmonds-Karp
    const C = createCapacityMatrix(nodes, links);
    edmondsKarp(C, source, sink).then(result => {
        document.getElementById("max-flow").textContent = result.maxFlow;
        document.getElementById("flow-path").textContent = result.path;
    });
}

function drawGraph(graph, source, sink) {
    const simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => Math.sqrt(d.capacity))
        .attr("title", d => `Peso: ${d.weight}`); // Adiciona tooltip com o peso

    const node = svg.append("g")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node");

    node.append("circle")
        .attr("r", 20)
        .style("fill", d => d.id === source ? "green" : d.id === sink ? "red" : "#69b3a2");

    node.append("text")
        .attr("x", 6)
        .attr("y", 3)
        .text(d => d.id);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

// ...


function createCapacityMatrix(nodes, links) {
    const C = {};
    nodes.forEach(node => {
        C[node.id] = {};
        nodes.forEach(n => {
            C[node.id][n.id] = 0;
        });
    });

    links.forEach(link => {
        C[link.source][link.target] = link.capacity;
    });

    return C;
}

function bfs(C, F, source, sink, parent) {
    let visited = new Set();
    let queue = [source];
    visited.add(source);

    while (queue.length > 0) {
        let u = queue.shift();

        for (let v in C[u]) {
            if (!visited.has(v) && C[u][v] - F[u][v] > 0) {
                queue.push(v);
                visited.add(v);
                parent[v] = u;

                if (v === sink) {
                    return true;
                }
            }
        }
    }
    return false;
}

async function edmondsKarp(C, source, sink) {
    let F = {};
    for (let u in C) {
        F[u] = {};
        for (let v in C[u]) {
            F[u][v] = 0;
        }
    }

    let maxFlow = 0;
    let parent = {};

    while (await bfs(C, F, source, sink, parent)) {
        let pathFlow = Infinity;
        let s = sink;

        while (s !== source) {
            pathFlow = Math.min(pathFlow, C[parent[s]][s] - F[parent[s]][s]);
            s = parent[s];
        }

        let v = sink;
        while (v !== source) {
            let u = parent[v];
            F[u][v] += pathFlow;
            F[v][u] -= pathFlow;
            v = parent[v];
        }

        maxFlow += pathFlow;
        await visualizeFlow(parent, source, sink, pathFlow, C, F);
    }
    return maxFlow;
}

async function visualizeFlow(parent, source, sink, pathFlow, C, F) {
    let path = [];
    let v = sink;

    while (v !== source) {
        path.push(v);
        v = parent[v];
    }
    path.push(source);
    path.reverse();

    for (let i = 0; i < path.length - 1; i++) {
        let u = path[i];
        let v = path[i + 1];

        const sourceNode = d3.select(`text:contains("${u}")`).node().parentNode;
        const targetNode = d3.select(`text:contains("${v}")`).node().parentNode;

        const sourceX = d3.select(sourceNode).datum().x;
        const sourceY = d3.select(sourceNode).datum().y;
        const targetX = d3.select(targetNode).datum().x;
        const targetY = d3.select(targetNode).datum().y;

        svg.append("path")
            .attr("class", "path-arrow")
            .attr("d", d3.line()([[sourceX, sourceY], [targetX, targetY]]))
            .attr("marker-end", "url(#arrowhead)")
            .transition()
            .duration(1000)
            .attr("opacity", 0)
            .remove();
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
}

// Gera um grafo aleatório ao carregar a página
generateRandomGraph();
