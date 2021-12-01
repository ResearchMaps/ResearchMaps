import collections
import utility_common as common
#------------------------------------------------------------------------

def getArrow(arrow):

    graph = common.load('graphMeta')
    edgeExps = common.load('edgeExps')

    nodeIns = {}
    nodeInSums = {}
    nodeOuts = {}
    nodeOutSums = {}
    for e in edgeExps:
        a,t = e[0], e[1]
        if t not in nodeIns: nodeIns[t] = {}
        nodeIns[t][a] = e[2][arrow]
        if t not in nodeInSums: nodeInSums[t] = 0.0
        nodeInSums[t] += e[2][arrow]
        if a not in nodeOuts: nodeOuts[a] = {}
        nodeOuts[a][t] = e[2][arrow]
        if a not in nodeOutSums: nodeOutSums[a] = 0.0
        nodeOutSums[a] += e[2][arrow]

    R = {}
    nlen = float(len(nodeIns))
    tot = 0.0
    for n in nodeIns:
        R[n] = nodeInSums[n]
        tot += R[n]

    R_prev = {}
    for n in R:
        R[n] = R[n] / tot
        R_prev[n] = R[n]

    d = 0.2 / nlen
    delta = 1.0
    while delta > 1e-10:
        tot = 0.0
        for n in nodeIns:
            nsum = nodeInSums[n]
            sum = 0.0
            for i in nodeIns[n]:
                r = 0.0 if i not in R else R[i]
                sum += r * (nodeIns[n][i] / nsum)
            R[n] = d + 0.8 * sum
            tot += R[n]

        R_hold = {}
        for n in R:
            R[n] = R[n] / tot
            R_hold[n] = R[n]

        delta = 0.0
        for n in R:
            delta += abs(R[n] - R_prev[n])

        print("diff: " + str(delta))
        R_prev = R_hold

    R_arr = [(x,R[x]) for x in R]
    R_sort = sorted(R_arr, key=lambda x: x[1], reverse=True)
    return R_sort
