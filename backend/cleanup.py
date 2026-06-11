import re

with open('frontend/src/lib/applications.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# remove isDemo blocks
code = re.sub(r'if \(typeof window !== "undefined" && localStorage\.getItem\("teamflow_demo_auth"\) === "true"\) \{[\s\S]*?\n  \}', '', code)

with open('frontend/src/lib/applications.ts', 'w', encoding='utf-8') as f:
    f.write(code)
