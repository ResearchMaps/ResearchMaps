import collections
import random
import utility_graph as utility
import utility_common as common

def getNextExp(expHash, edgeEligibleExps):
    expec_exps_i_j = []
    maxDof = 0
    for e in edgeEligibleExps:
        entropy = edgeEligibleExps[e]['entropy']
        eligible = edgeEligibleExps[e]['eligible']
        localDof = 0
        split = e.split('::')
        i = int(split[0])
        j = int(split[1])
        expec = entropy['E_I_double_J']
        exps = "X,Y,Positive|Y,X,Positive"
        expec_exps_i_j.append((expec, exps, i, j))

        expec = entropy['E_I_J']
        exps = "X,Y,Positive"
        expec_exps_i_j.append((expec, exps, i, j))
        localDof = localDof+1 if 1 in eligible and eligible[1] > 0 else localDof

        expec = entropy['E_J_I']
        exps = "Y,X,Positive"
        expec_exps_i_j.append((expec, exps, i, j))
        localDof = localDof + 1 if 2 in eligible and eligible[2] > 0 else localDof

        expec = entropy['E_IJ']
        exps = "X,Y,NIP|Y,X,NIP"
        expec_exps_i_j.append((expec, exps, i, j))
        localDof = localDof + 2 if 0 in eligible and eligible[0] > 0 else localDof
        maxDof = max(maxDof, localDof)

    random.shuffle(expec_exps_i_j)
    for threshold in range(maxDof+1):
        expec_exps_i_j.sort(key=lambda x: x[0], reverse=True)
        for expec,exps,i,j in expec_exps_i_j:
            expecExps = [ utility.stringExpToExp(str(i)+'::'+str(j), x) for x in exps.split('|') ]
            executed = len( [ x for x in expecExps if x in expHash ] )
            if executed > threshold or executed == len(expecExps): continue
            choose = [ x for x in expecExps if x not in expHash ]
            random.shuffle(choose)
            return utility.expFromString(choose[0])

    all = [ x for x in expHash if not expHash[x] ]
    random.shuffle(all)
    return utility.expFromString(all[0])

def subGraph(edges, graphOrig):
    edgeArr = [x for x in edges]
    edgeArr.sort(key=lambda x: x)
    n = len(edgeArr)
    if n == 1: return {edgeArr[0]:{}}
    graph = {}
    for i,e in enumerate(edgeArr):
        for j in range(i+1, n):
            e1 = e
            e2 = edgeArr[j]
            graph[e1] = graph[e1] if e1 in graph else {}
            graph[e2] = graph[e2] if e2 in graph else {}
            if graphOrig[e1][e2] == '--': graph[e1][e2] = '--'
            if graphOrig[e1][e2] == '--': graph[e2][e1] = '--'
    return graph

def getForest(graphOrig):
    graph = common.jsonClone(graphOrig)
    nodes = {x:False for x in graph}
    treesNodes = []
    for n in nodes:
        if nodes[n]: continue
        treeNodes = {}
        q = collections.deque([])
        q.append(n)
        while len(q) > 0:
            c = q.popleft()
            if nodes[c]: continue
            treeNodes[c] = True
            nodes[c] = True
            for e in graph[c]:
                if nodes[e]: continue
                if graph[c][e] == '||': continue
                q.append(e)
            del graph[c]
        treesNodes.append(treeNodes)
    subs = []
    for g in treesNodes:
        sub = subGraph(g, graphOrig)
        subs.append(sub)
    return subs

def treeGraphCounts(graph):
    edgeArr = [ x for x in graph ]
    edgeArr.sort(key=lambda x: x)
    n = len(edgeArr)
    assert n > 0
    if n == 1: return 0
    tots = 1
    for i, e in enumerate(edgeArr):
        for j in range(i + 1, n):
            e1 = e
            e2 = edgeArr[j]
            if e2 not in graph[e1]: continue
            if graph[e1][e2] == '--': tots *= 2
    return tots

def getCycleSingle(e1, e2, graph):
    root = e2
    stack = [{'node':root, 'count':0, 'length': 0}]
    visited = {e1: True}
    cycles = 0
    while len(stack) > 0:
        c = stack.pop()
        visited[c['node']] = True
        c['count'] += 1
        if c['count'] == 2: del visited[c['node']]
        if c['count'] == 2: continue
        stack.append(c)
        isLeaf = True
        for x in graph[c['node']]:
            if graph[c['node']][x] == '<--': continue
            illegalCycle = x == e1 and graph[c['node']][x] == '-->'
            if illegalCycle:
                pass
            if x == e1: cycles += 1
            if x in visited: continue
            isLeaf = False
            si = { 'node':x, 'count':0, 'length':c['length']+1 }
            stack.append(si)
        if isLeaf: del visited[c['node']]
        if isLeaf: stack.pop()
    return cycles

def getCycles(rootEdge, graph):
    e1, e2 = rootEdge
    if e2 not in graph[e1]: return (-1, -1)
    if graph[e1][e2] == '--': return (getCycleSingle(e1, e2, graph), getCycleSingle(e2, e1, graph))
    if graph[e1][e2] == '<--': return (-1, getCycleSingle(e2, e1, graph))
    if graph[e1][e2] == '-->': return (getCycleSingle(e1, e2, graph), -1)

def inferGraphs(graph):
    while True:
        end = True
        for n in graph:
            root = n
            stack = [{'node': root, 'count': 0, 'length': 0}]
            visited = {}
            breakFor = False
            while len(stack) > 0:
                breakWhile = False
                c = stack.pop()
                visited[c['node']] = True
                c['count'] += 1
                if c['count'] == 2: del visited[c['node']]
                if c['count'] == 2: continue
                stack.append(c)
                isLeaf = True
                for x in graph[c['node']]:
                    if graph[c['node']][x] == '<--': continue
                    if x == root and c['length'] > 1 and graph[c['node']][x] == '--':
                        breakFor = True
                        breakWhile = True
                        end = False
                        graph[c['node']][x] = '<--'
                        break
                    if x in visited: continue
                    if graph[c['node']][x] == '--': continue
                    isLeaf = False
                    si = {'node': x, 'count': 0, 'length': c['length'] + 1}
                    stack.append(si)
                if isLeaf: del visited[c['node']]
                if isLeaf: stack.pop()
                if breakWhile: break
            if breakFor: break
        if end: break

def eqSeventeen(truthComplete, allExps, allGraphs):
    graph = {}
    n = len(allGraphs[0]['actual'])
    subSetEdges = []
    for i in range(n):
        for j in range(i+1, n):
            subSetEdges.append(str(i) + '::' + str(j))

    candidateGraphs = common.jsonClone(allGraphs)
    obsDirect = truthComplete['obsDirect']
    obsZero = truthComplete['obsZero']
    for k in obsDirect: graph[k] = {}
    expsSet = common.jsonClone(allExps)
    expHash = { x:False for x in expsSet}
    cnt = 0
    countsAll = [-1]
    lens = [len(candidateGraphs)]
    for edge in subSetEdges:
        exp = edge + '::0::+'
        result = utility.getResult(exp, obsDirect, obsZero)
        cnt += 1
        candidateGraphs = utility.confirm(exp, candidateGraphs) if result else utility.exclude(exp, candidateGraphs)
        lens.append(len(candidateGraphs))
        edgeSplit = edge.split('::')
        e1, e2 = int(edgeSplit[0]), int(edgeSplit[1])
        if result: graph[e1][e2] = '||'
        if result: graph[e2][e1] = '||'
        if not result: graph[e1][e2] = '--'
        if not result: graph[e2][e1] = '--'

        expHash[exp] = True
        notRun = [x for x in expHash if not expHash[x]]
        edgeCandidates = utility.getEdgeCandidates(notRun, candidateGraphs)
        countsArr = [(x, utility.getCounts(x, edgeCandidates)) for x in notRun]
        counts = {'Cat1': 0, 'Cat2': 0, 'Cat3': 0}
        for exp_count in countsArr:
            count = exp_count[1]
            counts['Cat1'] += count['Cat1']
            counts['Cat2'] += count['Cat2']
            counts['Cat3'] += count['Cat3']
        countsAll.append(counts)

        if len(candidateGraphs) == 1: break
    if len(candidateGraphs) == 1: return cnt, truthComplete, lens, expsSet, countsAll

    forest = getForest(graph)
    candidateCountsTree = [ (treeGraphCounts(x), x) for x in forest ]
    candidateCountsTreeNonZero = [ (x[0],x[1]) for x in candidateCountsTree if x[0] > 1 ]
    while len(candidateCountsTreeNonZero) > 0:
        graphCycles = []
        for _,g in candidateCountsTreeNonZero:
            edgeArr = [x for x in g]
            edgeArr.sort(key=lambda x: x)
            n = len(edgeArr)
            assert n > 1
            edgePairs = []
            for i, e in enumerate(edgeArr):
                for j in range(i + 1, n):
                    e1 = e
                    e2 = edgeArr[j]
                    edgePairs.append((e1, e2))
            cycles = [ (x, getCycles(x, g)) for x in edgePairs ]
            graphCycles.append((g, cycles))
        maxGraph = graphCycles[0][0]
        maxEdge = graphCycles[0][1][0][0]
        maxCycles = max(graphCycles[0][1][0][1][0], graphCycles[0][1][0][1][1])
        for g, edge_cycles in graphCycles:
            for e,c in edge_cycles:
                if c[0] > maxCycles or c[1] > maxCycles:
                    maxGraph = g
                    maxEdge = e
                    maxCycles = max(c[0], c[1])

        exp = str(maxEdge[0]) + '::' + str(maxEdge[1]) + '::1::+'
        result = utility.getResult(exp, obsDirect, obsZero)
        cnt += 1
        candidateGraphs = utility.confirm(exp, candidateGraphs) if result else utility.exclude(exp, candidateGraphs)
        lens.append(len(candidateGraphs))
        e1, e2 = maxEdge
        if result: maxGraph[e1][e2] = '-->'
        if result: maxGraph[e2][e1] = '<--'
        if not result: maxGraph[e1][e2] = '<--'
        if not result: maxGraph[e2][e1] = '-->'

        expHash[exp] = True
        notRun = [x for x in expHash if not expHash[x]]
        edgeCandidates = utility.getEdgeCandidates(notRun, candidateGraphs)
        countsArr = [(x, utility.getCounts(x, edgeCandidates)) for x in notRun]
        counts = {'Cat1': 0, 'Cat2': 0, 'Cat3': 0}
        for exp_count in countsArr:
            count = exp_count[1]
            counts['Cat1'] += count['Cat1']
            counts['Cat2'] += count['Cat2']
            counts['Cat3'] += count['Cat3']
        countsAll.append(counts)
        inferGraphs(maxGraph)
        candidateCountsTree = [(treeGraphCounts(x), x) for x in forest]
        candidateCountsTreeNonZero = [(x[0], x[1]) for x in candidateCountsTree if x[0] > 1]
    print "total: " + str(cnt)
    return cnt, truthComplete, lens, expsSet, countsAll

def run(n):
    utility.shell(eqSeventeen, 'eqSeventeen_{n}'.format(n=n))

if __name__ == '__main__':
    run(3)