#!/usr/bin/env python3
"""Verify team scope updates."""

import re

def verify_team_scopes():
    """Verify TEAM_SCOPES were updated correctly."""

    print("="*60)
    print("VERIFYING TEAM SCOPE UPDATE")
    print("="*60)

    file_path = '/Users/tanguydeherdt/Desktop/MatchIQ/packages/shared-types/src/index.ts'

    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return 1

    # Find TEAM_SCOPES array
    pattern = r'export const TEAM_SCOPES.*?\[(.*?)\];'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        print("❌ TEAM_SCOPES not found")
        return 1

    array_content = match.group(1)

    # Extract all labels (handle both single and double quotes)
    label_pattern = r"label:\s*['\"]([^'\"]*(?:\\'[^'\"]*)*)['\"]"
    labels = []
    for match in re.finditer(r"label:\s*(['\"])(.+?)\1", array_content):
        labels.append(match.group(2))

    print(f"\n✓ Total team scopes: {len(labels)}")
    print("\nTeam Scope Options:")
    print("-" * 40)

    for i, label in enumerate(labels, 1):
        print(f"  {i:2d}. {label}")

    # Check for expected new entries
    expected = [
        'Either team',
        "Either team's opponent",
        'Favorite playing Home',
        'Favorite playing Away',
        'Underdog playing Home',
        'Underdog playing Away'
    ]

    print("\n" + "="*60)
    print("✓ Verification:")
    print("-" * 40)

    for exp in expected:
        if exp in labels:
            print(f"  ✓ '{exp}' found")
        else:
            print(f"  ❌ '{exp}' NOT found")

    # Check total count
    if len(labels) == 14:
        print(f"\n✅ All 14 team scope options present")
        return 0
    else:
        print(f"\n⚠ Expected 14 options, found {len(labels)}")
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(verify_team_scopes())
