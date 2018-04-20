const fs = require("fs-extra");

const { getImports } = require("./imports");

class DependencyGraph {
  constructor(entryPoints) {
    this.dependenciesPerFile = new Map();
    this.entryPoints = entryPoints;
  }

  static async createFromEntryPoint(resolver, entryPoint) {
    return DependencyGraph.createFromMultipleEntryPoints(resolver, [
      entryPoint
    ]);
  }

  static async createFromMultipleEntryPoints(resolver, entryPoints) {
    const graph = new DependencyGraph(entryPoints);

    for (const entryPoint of entryPoints) {
      if (!graph.dependenciesPerFile.has(entryPoint)) {
        await graph.addDependenciesFrom(resolver, entryPoint);
      }
    }

    return graph;
  }

  getResolvedFiles() {
    return this.dependenciesPerFile.keys();
  }

  async addDependenciesFrom(resolver, file) {
    const dependencies = new Set();
    this.dependenciesPerFile.set(file, dependencies);

    const imports = await getImports(file);

    for (const imp of imports) {
      const dependency = await resolver.resolveImport(file, imp);
      dependencies.add(dependency);

      if (!this.dependenciesPerFile.has(dependency)) {
        await this.addDependenciesFrom(resolver, dependency);
      }
    }
  }
}

module.exports = DependencyGraph;
