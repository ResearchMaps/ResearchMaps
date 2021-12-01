import collections
import utility_common as common
#------------------------------------------------------------------------
def mapDir(d):
    if d == '<--': return 'incoming'
    if d == '-->': return 'outgoing'
    if d == '||': return 'no_connections'
    raise
#------------------------------------------------------------------------
def getStream(graph, a, t, dir, delta, rev=False):
    if rev:
        dir = '<--' if dir == '-->' else '-->'
    n = a if dir == '<--' else t
    e2 = a if n == t else t
    seen = {}
    seen[e2] = None
    q = collections.deque([{'n':n, 'p':delta, 'pr':delta, 'h':0, 'seen':{}, 'path':[]}])
    key = mapDir(dir)
    paths = []
    while len(q) > 0:
        cm = q.popleft()
        c = cm['n']
        localPath = common.clone(cm['path'])
        localPath.append(cm)
        seen[c] = True
        if cm['pr'] < 0.01:
            paths.append(localPath)
            continue
        added = False
        for e in graph[c]:
            if e in seen: continue
            if graph[c][e][key] == 0: continue
            p = graph[c][e]['theta'][key]
            cs = cm['pr'] * graph[c][e]['theta'][key]
            q.append({'n':e, 'p':p, 'pr':cs, 'h':cm['h']+1, 'seen':{}, 'path':localPath})
            added = True
        if not added: paths.append(localPath)
    return paths
#------------------------------------------------------------------------
def getScore(graph, a, t, dir, delta):
    upstream = getStream(graph, a, t, dir, delta)
    downstream = getStream(graph, a, t, dir, delta, rev=True)
    sum = delta
    for d in downstream:
        for i in reversed(range(1, len(d))):
            p = delta*d[i]['p']
            for j in reversed(range(1, len(d))):
                p *= d[j]['p']
            if p < 0.001: continue
            for u in upstream:
                for m in range(1, len(u)):
                    p *= u[m]['p']
                    if p < 0.001: continue
                    sum += p
    return sum
#------------------------------------------------------------------------
def getOthers(exp):
    if exp == 'no_connections': return 'incoming', 'outgoing'
    if exp == 'incoming': return 'no_connections', 'outgoing'
    if exp == 'outgoing': return 'incoming', 'no_connections'
    raise
#------------------------------------------------------------------------
def incrementExp(graph, a, t, expRaw):
    exp = mapDir(expRaw)
    added = graph[a][t][exp] + 1
    other1Key, other2Key = getOthers(exp)
    other1 = graph[a][t][other1Key]
    other2 = graph[a][t][other2Key]
    tot = float(added + other1 + other2)
    added_pr = float(added)/tot
    other1_pr = float(other1)/tot
    other2_pr = float(other2)/tot
    theta = {exp:added_pr,other1Key:other1_pr,other2Key:other2_pr}
    return  theta
#------------------------------------------------------------------------
graph = common.load('graphMeta')
tot = 0
progress = common.load('graphScoreProgress2') if common.loadHas('graphScoreProgress2') else {'seen':{}, 'edgeExps':[]}
common.save(progress, 'graphScoreProgress2')
for a in graph:
    for t in graph[a]:
        assert a != t
        if a > t: continue
        key = a + '::' + t
        progress = common.load('graphScoreProgress2')
        if key in progress['seen']: continue
        progress['seen'][key] = True
        common.log("tot: " + str(tot))
        tot += 1
        d1 = graph[a][t]['theta']['incoming']
        score_in1 = getScore(graph, a, t, '<--', d1)
        d2 = incrementExp(graph, a, t, '<--')['incoming']
        score_in2 = getScore(graph, a, t, '<--', d2)
        delta_in = abs(score_in2-score_in1)
        d1 = graph[a][t]['theta']['outgoing']
        score_out1 = getScore(graph, a, t, '-->', d1)
        d2 = incrementExp(graph, a, t, '<--')['outgoing']
        score_out2 = getScore(graph, a, t, '-->', d2)
        delta_out = abs(score_out2 - score_out1)
        del_in = d1 * (delta_in+delta_out)

        d1 = graph[a][t]['theta']['outgoing']
        score_out1 = getScore(graph, a, t, '-->', d1)
        d2 = incrementExp(graph, a, t, '-->')['outgoing']
        score_out2 = getScore(graph, a, t, '-->', d2)
        delta_out = abs(score_out2 - score_out1)
        d1 = graph[a][t]['theta']['incoming']
        score_in1 = getScore(graph, a, t, '<--', d1)
        d2 = incrementExp(graph, a, t, '-->')['incoming']
        score_in2 = getScore(graph, a, t, '<--', d2)
        delta_in = abs(score_in2 - score_in1)
        del_out = d1 * (delta_in + delta_out)

        d1 = graph[a][t]['theta']['outgoing']
        score_in1 = getScore(graph, a, t, '<--', d1)
        d2 = incrementExp(graph, a, t, '||')['incoming']
        score_in2 = getScore(graph, a, t, '<--', d2)
        delta_in_nc = abs(score_in2 - score_in1)
        d1 = graph[a][t]['theta']['outgoing']
        score_out1 = getScore(graph, a, t, '-->', d1)
        d2 = incrementExp(graph, a, t, '||')['outgoing']
        score_out2 = getScore(graph, a, t, '-->', d2)
        delta_out_nc = abs(score_out2 - score_out1)

        del_nc = graph[a][t]['theta']['no_connections'] * (delta_in_nc+delta_out_nc)
        maxAbs = max([del_in, del_out, del_nc])
        maxAbsDir = '||'
        if maxAbs == del_in: maxAbsDir = '<--'
        if maxAbs == del_out: maxAbsDir = '-->'
        maxPos = max([del_in, del_out])
        maxPosDir = '-->'
        if maxPos == delta_in: maxPosDir = '<--'
        expMeta = {'<--':del_in, '-->':del_out, '||':del_nc}
        progress['edgeExps'].append((a,t, expMeta, maxAbs, maxAbsDir, maxPos, maxPosDir))
        common.save(progress, 'graphScoreProgress2')
common.save(progress['edgeExps'], 'edgeExps')