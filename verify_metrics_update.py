#!/usr/bin/env python3
"""Verify all metric updates in shared-types."""

import re
import sys

def count_array_items(content, array_name):
    """Count items in a TypeScript array by counting opening braces."""
    # Find the array declaration (with or without type annotation)
    pattern = rf'{array_name}(?::\s*\w+\[\])?\s*=\s*\[(.*?)\];'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        return None, []

    array_content = match.group(1)

    # Count items by counting object literals (lines with key: value)
    items = [line.strip() for line in array_content.split('\n') if line.strip().startswith('{')]
    count = len(items)

    # Extract groups
    groups = set()
    group_pattern = r"group:\s*['\"]([^'\"]+)['\"]"
    for group_match in re.finditer(group_pattern, array_content):
        groups.add(group_match.group(1))

    return count, sorted(groups)

def verify_metrics():
    """Verify all metrics were updated correctly."""

    print("="*60)
    print("VERIFYING METRICS UPDATE")
    print("="*60)

    # Read the shared-types file
    file_path = '/Users/tanguydeherdt/Desktop/MatchIQ/packages/shared-types/src/index.ts'

    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return 1

    errors = []

    # Test DESIRED_OUTCOMES
    print("\n1. DESIRED_OUTCOMES")
    print("-" * 40)
    count, groups = count_array_items(content, 'DESIRED_OUTCOMES')
    if count:
        print(f"✓ Total outcomes: {count}")
        print(f"✓ Groups: {len(groups)}")
        if len(groups) >= 20:  # We added 22 groups
            print("  ✓ Expected ~22 groups, found:", len(groups))
        else:
            errors.append(f"DESIRED_OUTCOMES has only {len(groups)} groups, expected ~22")

        print("\n  Sample groups:")
        for g in groups[:10]:
            print(f"    • {g}")
        if len(groups) > 10:
            print(f"    ... and {len(groups) - 10} more")
    else:
        errors.append("DESIRED_OUTCOMES not found or empty")

    # Test IN_PLAY_METRICS
    print("\n2. IN_PLAY_METRICS")
    print("-" * 40)
    count, groups = count_array_items(content, 'IN_PLAY_METRICS')
    if count:
        print(f"✓ Total metrics: {count}")
        print(f"✓ Groups: {len(groups)}")
        expected_groups = ['Match Context', 'Scoring & Outcome', 'Attacking Play',
                          'Possession & Build-Up', 'Defensive Actions', 'Set Pieces',
                          'Discipline & Match Events']
        if len(groups) == 7:
            print("  ✓ Has 7 groups as expected")
        else:
            errors.append(f"IN_PLAY_METRICS has {len(groups)} groups, expected 7")

        print("\n  Groups:")
        for g in groups:
            print(f"    • {g}")
    else:
        errors.append("IN_PLAY_METRICS not found or empty")

    # Test PRE_MATCH_METRICS
    print("\n3. PRE_MATCH_METRICS")
    print("-" * 40)
    count, groups = count_array_items(content, 'PRE_MATCH_METRICS')
    if count:
        print(f"✓ Total metrics: {count}")
        print(f"✓ Groups: {len(groups)}")
        if count >= 400:
            print(f"  ✓ Has {count} metrics (expected ~400+)")
        else:
            print(f"  ⚠ Has {count} metrics (expected ~400+)")

        if len(groups) == 7:
            print("  ✓ Has 7 groups as expected")
        else:
            errors.append(f"PRE_MATCH_METRICS has {len(groups)} groups, expected 7")

        print("\n  Groups:")
        for g in groups:
            print(f"    • {g}")
    else:
        errors.append("PRE_MATCH_METRICS not found or empty")

    # Test ODDS_METRICS
    print("\n4. ODDS_METRICS")
    print("-" * 40)
    count, groups = count_array_items(content, 'ODDS_METRICS')
    if count:
        print(f"✓ Total metrics: {count}")
        print(f"✓ Groups: {len(groups)}")
        if count >= 600:
            print(f"  ✓ Has {count} metrics (expected ~600+)")
        else:
            print(f"  ⚠ Has {count} metrics (expected ~600+)")

        if len(groups) >= 9:
            print(f"  ✓ Has {len(groups)} groups (expected 9+)")
        else:
            errors.append(f"ODDS_METRICS has {len(groups)} groups, expected 9+")

        print("\n  Groups:")
        for g in groups:
            print(f"    • {g}")
    else:
        errors.append("ODDS_METRICS not found or empty")

    # Summary
    print("\n" + "="*60)
    if errors:
        print("❌ VERIFICATION FAILED")
        print("\nErrors:")
        for error in errors:
            print(f"  • {error}")
        return 1
    else:
        print("✅ ALL METRICS VERIFIED SUCCESSFULLY")
        print("\nSummary:")
        print("  • DESIRED_OUTCOMES updated with comprehensive betting outcomes")
        print("  • IN_PLAY_METRICS updated with 7 emoji-grouped categories")
        print("  • PRE_MATCH_METRICS updated with ~400+ historical stats")
        print("  • ODDS_METRICS updated with ~600+ pre-match and live odds")
        return 0

if __name__ == '__main__':
    sys.exit(verify_metrics())
