#!/usr/bin/env python3
"""SDK-host regression QA, through agent-browser only. No listening server or live T3 messages."""
import json, re, subprocess, sys, time
from pathlib import Path
out = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/openui-step3-qa').resolve()
out.mkdir(parents=True, exist_ok=True)
session = 'openui-step3-regression'
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
        cli('focus', ref('checkbox', names[template]))
        cli('press', 'Space')
        until(f'window.qaDiagnostics.state.$selectedOptions?.[{json.dumps(ids[template])}] === true')
        assert js('window.contextUpdates.length') == 0, 'sharing starts off'
        click('button', 'Share selection')
        until('window.contextUpdates.length > 0')
        assert context()['library'] == 'openui-personal@1'
        cli('select', ref('combobox', 'Discussion focus'), 'risks')
        until('window.contextUpdates.length > 1 && JSON.parse(window.contextUpdates.at(-1).content[0].text).selection.reviewFocus === "risks"')
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
        assert 'Ask agent about selection' not in snap()
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
                cli('screenshot', str(out / f'{template}-{label}-{theme}.png'))
                if label == 'phone':
                    cli('scroll', 'down', '2000')
                    cli('screenshot', str(out / f'{template}-{label}-{theme}-footer.png'))
        report.append(template + ': keyboard selection, opt-in state/focus, search/status/sort, hidden retention, details, compact request, decline, clear, 6 viewports/themes passed')
    # Common bridge edge cases on a real rendered workflow.
    fixture = out / 'snapshot.html'
    cli('open', fixture.as_uri() + '?no-context')
    until('window.hostReady && window.qaDiagnostics')
    assert 'button "Share selection" [disabled' in snap()
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
    # Empty data and long unbroken evidence stay renderable on phone.
    # Use a separately constructed valid program for explicit empty/long fixtures.
    empty_code = 'root = Card([SnapshotTable("Empty snapshot", "Sample data", [], $ids, $focus)])\n$ids = {}\n$focus = "risks"'
    js('window.qaBridge.sendToolResult({...window.fixtureResult, structuredContent:{...window.fixtureResult.structuredContent, code:' + json.dumps(empty_code) + '}})')
    until('window.qaDiagnostics.state.$ids !== undefined')
    assert 'No entries supplied' in snap()
    long_rows = [{'id':'long-1','title':'Long example','status':'pending','details':'evidence/' * 150,'criteria':{'Path':'path/' * 100}}]
    long_code = 'root = Card([SnapshotTable("Long snapshot", "Sample data", ' + json.dumps(long_rows) + ', $ids, $focus)])\n$ids = {}\n$focus = "risks"'
    js('window.qaBridge.sendToolResult({...window.fixtureResult, structuredContent:{...window.fixtureResult.structuredContent, code:' + json.dumps(long_code) + '}})')
    cli('set', 'viewport', '393', '852')
    until('window.qaDiagnostics.width === 393')
    cli('focus', ref('checkbox','Long example'))
    cli('press','Tab')
    cli('press','Enter')
    until('window.qaDiagnostics.scrollWidth <= window.qaDiagnostics.width')
    cli('screenshot','--full',str(out / 'snapshot-long-phone-dark.png'))
    legacy = out / 'legacy-demo.html'
    subprocess.run(['node','test/make-browser-fixture.mjs',str(legacy),'demo','render_openui_legacy'],check=True,capture_output=True)
    cli('open',legacy.as_uri())
    until('window.hostReady && window.qaDiagnostics')
    assert js('window.qaDiagnostics.errors.length') == 0
    click('button','30 days')
    until('window.qaDiagnostics.state.$days === "30"')
    click('button','Share selection')
    until('window.contextUpdates.length > 0')
    assert context()['library'] == 'openui-chat@0.18.1'
    report.append('common bridge: unsupported context, pending request, transport error, empty data, long phone evidence and legacy chart/demo state passed')
    (out / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print('\n'.join(report))
finally:
    cli('close')
