class Graph { //classe grafo
    constructor(size) {
        this.size = size;
        this.adjMatrix = Array.from({ length: size }, () => Array(size).fill(0));
        this.nodes = [];
        this.edges = [];
    }

    addEdge(from, to, capacity) { //adciona aresta ao grafo
        if (!this.adjMatrix[from][to]) {
            this.adjMatrix[from][to] = capacity; // adciona aresta com peso ao array caso ela não exista
            this.edges.push({ source: from, target: to, capacity: capacity });
        }
    }
  
    bfs(source, sink, parent) { //faz busca por bfs para ser utilizado no fordFulkerson
        let visited = Array(this.size).fill(false); //array com os nós visitados
        let queue = []; //fila de nós restantes
        queue.push(source);
        visited[source] = true; //marca o nó da vez como visitado

        while (queue.length > 0) {
            let u = queue.shift(); //remove o primeiro nó da fila

            for (let v = 0; v < this.size; v++) { //percorre dos nós adjacentes ao atual
                if (visited[v] === false && this.adjMatrix[u][v] > 0) {
                    queue.push(v); //adciona o nó adjacente à fila
                    visited[v] = true; //marca-o como visitado
                    parent[v] = u; //marca-o como o pai do próximo nó
                }
            }
        }

        return visited[sink];
    }
    //ford fulkerson
    fordFulkerson(source, sink) {
        let parent = Array(this.size).fill(-1); //array que armazena pais encontrados na busca bfs
        let maxFlow = 0; //variável do fluxo máximo
        let minCapacity = Infinity; //variável da capacidade mínima

        while (this.bfs(source, sink, parent)) {
            let pathFlow = Infinity; //no começo inicializa o fluxo como infinito

            // Encontra o mínimo pelo caminho dado pelo BFS
            for (let v = sink; v !== source; v = parent[v]) {
                let u = parent[v];
                pathFlow = Math.min(pathFlow, this.adjMatrix[u][v]);
            }

            // Atualiza as capacidades que sobraram das arestas
            for (let v = sink; v !== source; v = parent[v]) {
                let u = parent[v];
                this.adjMatrix[u][v] -= pathFlow;
                this.adjMatrix[v][u] += pathFlow;
            }

            // Adciona o fluxo encontrado ao fluxo máximo
            maxFlow += pathFlow;
            minCapacity = Math.min(minCapacity, pathFlow); //atualiza a capacidade mínima conforme o que o código encontrou
        }

        return { maxFlow, minCapacity };
    }

    randomizeNodes(width, height) {
        for (let i = 0; i < this.size; i++) {
            this.nodes.push({ id: i, x: Math.random() * width, y: Math.random() * height });
        }
    }
}

function drawGraph(graph) {
    const width = 600;
    const height = 400;
    const svg = d3.select("#graph-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.edges).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.edges)
        .enter().append("line")
        .attr("stroke-width", d => Math.sqrt(d.capacity))
        .attr("stroke", "#999");

    const linkText = svg.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(graph.edges)
        .enter().append("text")
        .attr("dy", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#555")
        .text(d => d.capacity);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 10)
        .attr("fill", "#007bff")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const text = svg.append("g")
        .attr("class", "texts")
        .selectAll("text")
        .data(graph.nodes)
        .enter().append("text")
        .attr("dy", -15)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text(d => d.id);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkText
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        text
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

document.getElementById('runAlgorithm').addEventListener('click', () => {
    d3.select("#graph-container").selectAll("*").remove(); // Clear previous graph

    const graph = new Graph(6);
    graph.randomizeNodes(600, 400); // Randomize node positions within the SVG dimensions

    graph.addEdge(0, 1, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(0, 2, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(1, 2, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(1, 3, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(2, 4, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(3, 2, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(3, 5, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(4, 3, Math.floor(Math.random() * 20) + 1);
    graph.addEdge(4, 5, Math.floor(Math.random() * 20) + 1);

    const source = 0;
    const sink = 5;

    const { maxFlow, minCapacity } = graph.fordFulkerson(source, sink);

    document.getElementById('result').textContent = `O fluxo máximo é ${maxFlow} e o fluxo mínimo é ${minCapacity}`;
    drawGraph(graph);
   });