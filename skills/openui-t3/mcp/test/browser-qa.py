#!/usr/bin/env python3
"""SDK-host regression QA, through agent-browser only. No listening server or live T3 messages."""
import json, re, subprocess, sys, time
from pathlib import Path
out = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/openui-step3-qa').resolve()
out.mkdir(parents=True, exist_ok=True)
session = 'openui-opus-design'
def cli(*args):
    p = subprocess.run(['agent-browser', '--session', session, *args], text=True, capture_output=True)
    if p.returncode: raise AssertionError(p.stdout + p.stderr)
    return p.stdout

def js(code):
    return json.loads(cli('--json', 'eval', code))['data']['result']

def until(code):
    for _ in range(80):
        result = js(code)
        if result: return result
        time.sleep(.1)
    raise AssertionError('Timed out: ' + code)

def snap(): return cli('snapshot')

def ref(role, name):
    s = snap()
    match = re.search(r'\b' + re.escape(role) + r' "' + re.escape(name) + r'"[^\n]*?\bref=(e\d+)\]', s)
    assert match, s
    return '@' + match[1]

def click(role, name): cli('click', ref(role, name))

def fill(name, value):
    target = ref('searchbox', name)
    if value: cli('fill', target, value)
    else:
        cli('focus', target)
        cli('press', 'Meta+A' if sys.platform == 'darwin' else 'Control+A')
        cli('press', 'Backspace')

def state(): return js('window.qaDiagnostics.state')

def context(): return js('window.contextUpdates.length ? JSON.parse(window.contextUpdates.at(-1).content[0].text) : null')

LATEST = 'JSON.parse(window.contextUpdates.at(-1).content[0].text)'
ASK_DISABLED = 'button "Ask agent about selection" [disabled'

def edges_aligned():
    edges = until('window.qaDiagnostics.edges && window.qaDiagnostics.edges[".selection-summary"] !== undefined && window.qaDiagnostics.edges')
    assert max(edges.values()) - min(edges.values()) <= 1, edges
    return edges

report = []
try:
    for template in ['decision', 'plan', 'snapshot', 'demo']:
        fixture = out / f'{template}.html'
        subprocess.run(['node', 'test/make-browser-fixture.mjs', str(fixture), template], check=True, capture_output=True)
        cli('set', 'viewport', '1440', '900')
        cli('open', fixture.as_uri() + '?theme=light')
        until('window.hostReady && window.qaDiagnostics')
        assert js('window.qaDiagnostics.errors.length') == 0
        if template == 'demo':
            click('button', '30 days')
            until('window.qaDiagnostics.state.$days === "30"')
            click('button', 'Reset')
            until('window.qaDiagnostics.state.$days === "7"')
            cli('fill', ref('textbox', 'Experiment description (editable)'), 'SDK host test description')
            until('window.qaDiagnostics.state.$goal === "SDK host test description"')
            click('button', 'Send to agent')
            until('window.handoffMessages.length === 1')
            assert 'SDK host test description' in js('window.handoffMessages[0].content[0].text')
            report.append('demo: editable description, local range/reset, compact request and renderer passed')
            continue
        names = {'decision': 'Option comparison', 'plan': 'Inspect current contract', 'snapshot': 'Example missing empty state'}
        ids = {'decision': 'comparison', 'plan': 'inspect', 'snapshot': 'finding-1'}
        # A fresh mount writes one empty envelope for its interface, replacing anything an earlier mount shared.
        until(f'window.contextUpdates.length === 1 && JSON.stringify({LATEST}.selection) === "{{}}"')
        assert context()['interfaceId'] == js('window.fixtureResult.structuredContent.interfaceId')
        assert ASK_DISABLED in snap(), 'Ask stays visible but disabled with nothing selected'
        completion = re.search(r'\d of \d supplied steps complete', snap())
        cli('focus', ref('checkbox', names[template]))
        cli('press', 'Space')
        until(f'window.qaDiagnostics.state.$selectedOptions?.[{json.dumps(ids[template])}] === true')
        cli('press', 'Space')
        until('JSON.stringify(window.qaDiagnostics.state.$selectedOptions) === "{}"')  # deselect deletes, never stores false
        cli('press', 'Space')
        until(f'JSON.stringify(window.qaDiagnostics.state.$selectedOptions) === {json.dumps(json.dumps({ids[template]: True}, separators=(",", ":")))}')
        if completion: assert completion[0] in snap(), 'selection never changes supplied completion'
        assert 'Ask agent about selection' in snap() and ASK_DISABLED not in snap()
        assert js('window.contextUpdates.length') == 1, 'sharing starts off'
        click('button', 'Share selection')
        until('window.contextUpdates.length > 1')
        assert context()['library'] == 'openui-personal@1'
        cli('select', ref('combobox', 'Discussion focus'), 'risks')
        until('window.contextUpdates.length > 2 && JSON.parse(window.contextUpdates.at(-1).content[0].text).selection.reviewFocus === "risks"')
        fill('Search', 'details')  # field names are not searchable content
        assert 'No matching entries' in snap()
        fill('Search', 'no matching rows')
        assert '1 hidden by filters' in snap()
        assert 'No matching entries' in snap()
        assert state()['$selectedOptions'][ids[template]] is True
        click('button', 'Clear filters')
        cli('select', ref('combobox', 'Order'), 'title')
        cli('select', ref('combobox', 'Status'), 'complete' if template == 'plan' else ('unverified' if template == 'snapshot' else 'proposed'))
        if template == 'snapshot': assert '1 hidden by filters' in snap()
        cli('select', ref('combobox', 'Status'), '')
        # Expand the first details disclosure and check that content can be read.
        cli('focus', ref('checkbox', names[template]))
        cli('press', 'Tab')
        cli('press', 'Enter')
        assert 'Scope' in snap() if template == 'decision' else ('Evidence' in snap())
        click('button', 'Ask agent about selection')
        until('window.handoffMessages.length === 1')
        message = js('window.handoffMessages[0].content[0].text')
        payload = json.loads(message.split('OpenUI selection: ')[1])
        assert payload['selection']['selected'][0]['id'] == ids[template]
        assert payload['selection']['reviewFocus'] == 'risks'
        assert 'criteria' not in payload['selection']
        js('window.testMode = "decline"')
        click('button', 'Ask agent about selection')
        until('window.handoffRequests === 2')
        assert js('window.handoffMessages.length') == 1
        assert 'Message declined' in snap()
        click('button', 'Clear selection')
        until('JSON.stringify(window.qaDiagnostics.state.$selectedOptions) === "{}"')
        until('JSON.stringify(JSON.parse(window.contextUpdates.at(-1).content[0].text).selection.selectedOptions) === "{}"')
        assert ASK_DISABLED in snap()
        click('button', 'Stop sharing')
        until('JSON.stringify(JSON.parse(window.contextUpdates.at(-1).content[0].text).selection) === "{}"')
        for theme in ['light', 'dark']:
            for label, width, height in [('desktop', 1440, 900), ('inline', 728, 900), ('phone', 393, 852)]:
                cli('set', 'viewport', str(width), str(height))
                cli('open', fixture.as_uri() + '?theme=' + theme)
                until('window.hostReady && window.qaDiagnostics')
                assert js('window.qaDiagnostics.errors.length') == 0
                assert js('window.qaDiagnostics.scrollWidth <= window.qaDiagnostics.width'), 'horizontal overflow'
                until('window.qaDiagnostics.height >= window.qaDiagnostics.scrollHeight')
                time.sleep(.3)  # allow the SDK resize notification to settle before screenshot capture
                edges = edges_aligned()
                assert abs(edges['#sharing'] - (16 if label == 'phone' else 20)) <= 1, edges
                cli('screenshot', str(out / f'{template}-{label}-{theme}.png'))
                if label != 'desktop':
                    cli('focus', ref('checkbox', names[template]))
                    cli('press', 'Space')
                    until(f'window.qaDiagnostics.state.$selectedOptions?.[{json.dumps(ids[template])}] === true')
                    cli('scroll', 'up', '2000')
                    time.sleep(.3)
                    cli('screenshot', str(out / f'{template}-{label}-{theme}-selected.png'))
                if label == 'phone':
                    cli('scroll', 'down', '2000')
                    cli('screenshot', str(out / f'{template}-{label}-{theme}-footer.png'))
        report.append(template + ': initial stale clear, disabled Ask, keyboard select/deselect without false values, opt-in state/focus, field-name search miss, search/status/sort, hidden retention, details, compact request, decline, clear, 6 viewports/themes with aligned content edges passed')
    # Common bridge edge cases on a real rendered workflow.
    fixture = out / 'snapshot.html'
    cli('open', fixture.as_uri() + '?no-context')
    until('window.hostReady && window.qaDiagnostics')
    assert 'button "Share selection" [disabled' in snap()
    assert 'Selection sharing is unavailable in this host.' in snap()
    time.sleep(.5)
    assert js('window.contextUpdates.length') == 0, 'no context writes without the capability'
    cli('open', fixture.as_uri())
    until('window.hostReady && window.qaDiagnostics')
    click('checkbox', 'Example missing empty state')
    js('window.testMode = "delay"')
    click('button', 'Ask agent about selection')
    until('window.handoffRequests === 1 && typeof window.approvePending === "function"')
    assert 'Waiting for your approval' in snap()
    js('window.approvePending()')
    until('window.handoffMessages.length === 1')
    js('window.testMode = "error"')
    click('button', 'Ask agent about selection')
    until('window.handoffRequests === 2')
    assert 'Delivery was not confirmed' in snap()
    assert js('window.handoffMessages.length') == 1
    # Abrupt remount (T3 virtualization): same interfaceId, default controls, earlier shared selection must be cleared.
    cli('open', fixture.as_uri())
    until('window.hostReady && window.qaDiagnostics')
    until('window.contextUpdates.length === 1')
    cli('focus', ref('checkbox', 'Example missing empty state'))
    cli('press', 'Space')
    click('button', 'Share selection')
    until(f'{LATEST}.selection.selectedOptions?.["finding-1"] === true')
    shared_id = context()['interfaceId']
    before = js('window.contextUpdates.length')
    js('window.remount(); true')
    until(f'window.hostReady && window.contextUpdates.length === {before + 1}')
    assert context()['selection'] == {} and context()['interfaceId'] == shared_id, context()
    until('JSON.stringify(window.qaDiagnostics.state.$selectedOptions) === "{}"')
    assert 'Sharing is off.' in snap()
    # A share made while the clear is still in flight is queued after it and stays the final context.
    js('window.contextDelay = 1500; window.remount(); true')
    until('window.hostReady')
    assert 'Clearing any earlier shared selection' in snap()
    cli('focus', ref('checkbox', 'Example missing empty state'))
    cli('press', 'Space')
    click('button', 'Share selection')
    until(f'{LATEST}.selection.selectedOptions?.["finding-1"] === true')
    time.sleep(2)
    assert context()['selection']['selectedOptions'] == {'finding-1': True}, context()
    assert 'Selection shared with T3; changes update it.' in snap()
    # A failed clear is reported, not hidden.
    js('window.contextDelay = 0; window.contextFail = true; window.remount(); true')
    until('window.hostReady')
    until('document.querySelector("iframe") && true')
    for _ in range(40):
        if 'Could not clear an earlier shared selection' in snap(): break
        time.sleep(.1)
    else: raise AssertionError(snap())
    js('window.contextFail = false')
    # Larger data: search, status filter and sort over 12 entries keep stable selections.
    many = [{'id': f'svc-{i}', 'title': f'{name} service', 'status': 'degraded' if i % 3 == 0 else 'healthy', 'details': 'Disk nearly full' if i == 4 else 'Nominal', 'criteria': {'Region': f'region-{i}'}} for i, name in enumerate(['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima'])]
    many_code = 'root = Card([SnapshotTable("Fleet snapshot", "Sample data", ' + json.dumps(many) + ', $ids, $focus)])\n$ids = {}\n$focus = "risks"'
    js('window.qaBridge.sendToolResult({...window.fixtureResult, structuredContent:{...window.fixtureResult.structuredContent, code:' + json.dumps(many_code) + '}})')
    until('window.qaDiagnostics.state.$ids !== undefined')
    assert 'Could not clear an earlier shared selection' in snap(), 'a re-render keeps the failed-clear warning'
    click('checkbox', 'Alpha service'); click('checkbox', 'Bravo service')
    until('Object.keys(window.qaDiagnostics.state.$ids).length === 2')
    fill('Search', 'disk')
    s = snap(); assert 'checkbox "Echo service"' in s and 'checkbox "Golf service"' not in s and '2 hidden by filters' in s
    fill('Search', 'criteria')
    assert 'No matching entries' in snap()
    click('button', 'Clear filters')
    cli('select', ref('combobox', 'Status'), 'healthy')
    s = snap(); assert 'checkbox "Alpha service"' not in s and '1 hidden by filters' in s
    cli('select', ref('combobox', 'Status'), '')
    cli('select', ref('combobox', 'Order'), 'status')
    s = snap(); assert s.index('checkbox "Juliet service"') < s.index('checkbox "Bravo service"'), 'degraded sorts before healthy'
    assert js('JSON.stringify(window.qaDiagnostics.state.$ids)') == '{"svc-0":true,"svc-1":true}'
    # Empty data and long unbroken evidence stay renderable on phone.
    # Use a separately constructed valid program for explicit empty/long fixtures.
    empty_code = 'root = Card([SnapshotTable("Empty snapshot", "Sample data", [], $ids, $focus)])\n$ids = {}\n$focus = "risks"'
    js('window.qaBridge.sendToolResult({...window.fixtureResult, structuredContent:{...window.fixtureResult.structuredContent, code:' + json.dumps(empty_code) + '}})')
    until('window.qaDiagnostics.state.$ids !== undefined')
    assert 'No entries supplied' in snap()
    long_rows = [{'id':'long-1','title':'Long example','status':'awaiting-external-security-review-' * 4,'details':'evidence/' * 150,'criteria':{'Path':'path/' * 100}}]
    long_code = 'root = Card([SnapshotTable("Long snapshot", "Sample data", ' + json.dumps(long_rows) + ', $ids, $focus)])\n$ids = {}\n$focus = "risks"'
    js('window.qaBridge.sendToolResult({...window.fixtureResult, structuredContent:{...window.fixtureResult.structuredContent, code:' + json.dumps(long_code) + '}})')
    cli('set', 'viewport', '393', '852')
    until('window.qaDiagnostics.width === 393')
    cli('focus', ref('checkbox','Long example'))
    cli('press','Tab')
    cli('press','Enter')
    until('window.qaDiagnostics.scrollWidth <= window.qaDiagnostics.width')
    edges_aligned()
    cli('screenshot','--full',str(out / 'snapshot-long-phone-dark.png'))
    legacy = out / 'legacy-demo.html'
    subprocess.run(['node','test/make-browser-fixture.mjs',str(legacy),'demo','render_openui_legacy'],check=True,capture_output=True)
    cli('open',legacy.as_uri())
    until('window.hostReady && window.qaDiagnostics')
    assert js('window.qaDiagnostics.errors.length') == 0
    click('button','30 days')
    until('window.qaDiagnostics.state.$days === "30"')
    click('button','Share selection')
    until('window.contextUpdates.length > 0 && JSON.stringify(' + LATEST + '.selection) !== "{}"')
    assert context()['library'] == 'openui-chat@0.18.1'
    report.append('common bridge: unsupported context, pending request, transport error, remount stale clear/serialized share/failed clear, 12-row search/status/sort, empty data, long phone evidence and legacy chart/demo state passed')
    (out / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print('\n'.join(report))
finally:
    cli('close')
