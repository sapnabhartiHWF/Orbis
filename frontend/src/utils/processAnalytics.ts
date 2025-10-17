interface Process {
  id: string
  title: string
  description: string
  department: string
  priority: "Low" | "Medium" | "High" | "Critical"
  expectedROI: number
  status: "Submitted" | "Under Review" | "In Development" | "Deployed"
  submittedBy: string
  submittedDate: string
  estimatedSavings: number
  complexity: "Low" | "Medium" | "High"
  dependencies: string[]
  tags: string[]
}

interface DependencyNode {
  id: string
  title: string
  status: string
  dependencies: string[]
  dependents: string[]
  level: number
  x: number
  y: number
}

interface DuplicateMatch {
  process1: Process
  process2: Process
  similarity: number
  reasons: string[]
}

// Text similarity using Jaccard similarity coefficient
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(word => word.length > 2))
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(word => word.length > 2))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

// Tag similarity using Jaccard similarity
function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  const set1 = new Set(tags1.map(tag => tag.toLowerCase()))
  const set2 = new Set(tags2.map(tag => tag.toLowerCase()))
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

// Calculate overall similarity between two processes
export function calculateProcessSimilarity(process1: Process, process2: Process): number {
  if (process1.id === process2.id) return 0
  
  // Weight different factors
  const titleSimilarity = calculateTextSimilarity(process1.title, process2.title) * 0.4
  const descriptionSimilarity = calculateTextSimilarity(process1.description, process2.description) * 0.3
  const tagSimilarity = calculateTagSimilarity(process1.tags, process2.tags) * 0.2
  const departmentMatch = process1.department === process2.department ? 0.1 : 0
  
  return titleSimilarity + descriptionSimilarity + tagSimilarity + departmentMatch
}

// Find potential duplicates above a threshold
export function findDuplicates(processes: Process[], threshold: number = 0.6): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = []
  
  for (let i = 0; i < processes.length; i++) {
    for (let j = i + 1; j < processes.length; j++) {
      const similarity = calculateProcessSimilarity(processes[i], processes[j])
      
      if (similarity >= threshold) {
        const reasons: string[] = []
        
        if (calculateTextSimilarity(processes[i].title, processes[j].title) > 0.3) {
          reasons.push("Similar titles")
        }
        if (calculateTextSimilarity(processes[i].description, processes[j].description) > 0.4) {
          reasons.push("Similar descriptions")
        }
        if (calculateTagSimilarity(processes[i].tags, processes[j].tags) > 0.5) {
          reasons.push("Overlapping tags")
        }
        if (processes[i].department === processes[j].department) {
          reasons.push("Same department")
        }
        
        duplicates.push({
          process1: processes[i],
          process2: processes[j],
          similarity,
          reasons
        })
      }
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity)
}

// Build dependency graph for visualization
export function buildDependencyGraph(processes: Process[]): { nodes: DependencyNode[], edges: Array<{from: string, to: string}> } {
  const processMap = new Map(processes.map(p => [p.id, p]))
  const dependencyMap = new Map<string, Set<string>>()
  const dependentMap = new Map<string, Set<string>>()
  
  // Build dependency relationships
  processes.forEach(process => {
    dependencyMap.set(process.id, new Set())
    dependentMap.set(process.id, new Set())
  })
  
  processes.forEach(process => {
    process.dependencies.forEach(depName => {
      // Find processes that match dependency names (simplified matching)
      const depProcess = processes.find(p => 
        p.title.toLowerCase().includes(depName.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(depName.toLowerCase()))
      )
      
      if (depProcess) {
        dependencyMap.get(process.id)?.add(depProcess.id)
        dependentMap.get(depProcess.id)?.add(process.id)
      }
    })
  })
  
  // Calculate levels for layout
  const levels = new Map<string, number>()
  const visited = new Set<string>()
  
  function calculateLevel(processId: string): number {
    if (levels.has(processId)) return levels.get(processId)!
    if (visited.has(processId)) return 0 // Circular dependency
    
    visited.add(processId)
    const deps = dependencyMap.get(processId) || new Set()
    const maxDepLevel = Array.from(deps).reduce((max, depId) => {
      return Math.max(max, calculateLevel(depId))
    }, 0)
    
    const level = maxDepLevel + 1
    levels.set(processId, level)
    visited.delete(processId)
    return level
  }
  
  processes.forEach(p => calculateLevel(p.id))
  
  // Create nodes with positions
  const nodes: DependencyNode[] = []
  const levelGroups = new Map<number, string[]>()
  
  processes.forEach(process => {
    const level = levels.get(process.id) || 1
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)!.push(process.id)
  })
  
  // Position nodes
  Array.from(levelGroups.entries()).forEach(([level, processIds]) => {
    processIds.forEach((processId, index) => {
      const process = processMap.get(processId)!
      const y = level * 150
      const x = (index - (processIds.length - 1) / 2) * 200
      
      nodes.push({
        id: processId,
        title: process.title,
        status: process.status,
        dependencies: Array.from(dependencyMap.get(processId) || []),
        dependents: Array.from(dependentMap.get(processId) || []),
        level,
        x,
        y
      })
    })
  })
  
  // Create edges
  const edges: Array<{from: string, to: string}> = []
  dependencyMap.forEach((deps, processId) => {
    deps.forEach(depId => {
      edges.push({ from: depId, to: processId })
    })
  })
  
  return { nodes, edges }
}

// Detect circular dependencies
export function detectCircularDependencies(processes: Process[]): string[][] {
  const graph = new Map<string, string[]>()
  const processMap = new Map(processes.map(p => [p.id, p]))
  
  // Build adjacency list
  processes.forEach(process => {
    const deps: string[] = []
    process.dependencies.forEach(depName => {
      const depProcess = processes.find(p => 
        p.title.toLowerCase().includes(depName.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(depName.toLowerCase()))
      )
      if (depProcess) {
        deps.push(depProcess.id)
      }
    })
    graph.set(process.id, deps)
  })
  
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const cycles: string[][] = []
  
  function dfs(node: string, path: string[]): void {
    visited.add(node)
    recursionStack.add(node)
    path.push(node)
    
    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path])
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor)
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), neighbor])
        }
      }
    }
    
    recursionStack.delete(node)
  }
  
  processes.forEach(process => {
    if (!visited.has(process.id)) {
      dfs(process.id, [])
    }
  })
  
  return cycles
}

// Analyze dependency impact
export function analyzeDependencyImpact(processId: string, processes: Process[]): {
  directDependencies: Process[]
  indirectDependencies: Process[]
  dependents: Process[]
  impactScore: number
} {
  const processMap = new Map(processes.map(p => [p.id, p]))
  const targetProcess = processMap.get(processId)
  
  if (!targetProcess) {
    return { directDependencies: [], indirectDependencies: [], dependents: [], impactScore: 0 }
  }
  
  // Find direct dependencies
  const directDeps: Process[] = []
  targetProcess.dependencies.forEach(depName => {
    const depProcess = processes.find(p => 
      p.title.toLowerCase().includes(depName.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(depName.toLowerCase()))
    )
    if (depProcess) {
      directDeps.push(depProcess)
    }
  })
  
  // Find processes that depend on this one
  const dependents = processes.filter(p => 
    p.dependencies.some(depName => 
      targetProcess.title.toLowerCase().includes(depName.toLowerCase()) ||
      targetProcess.tags.some(tag => tag.toLowerCase().includes(depName.toLowerCase()))
    )
  )
  
  // Calculate impact score based on dependencies and ROI
  const impactScore = (directDeps.length * 10) + 
                     (dependents.length * 15) + 
                     (targetProcess.expectedROI / 10000)
  
  return {
    directDependencies: directDeps,
    indirectDependencies: [], // Could be expanded with recursive dependency finding
    dependents,
    impactScore
  }
}