import { supabase } from './supabase';

async function debugRules() {
  console.log('=== DEBUG RULES ===\n');

  // Load all strategies
  const { data: strategies, error: stratError } = await supabase
    .from('strategies')
    .select('*')
    .eq('is_active', true);

  if (stratError) {
    console.error('Error loading strategies:', stratError);
    return;
  }

  console.log(`Found ${strategies?.length || 0} active strategies\n`);

  for (const strategy of strategies || []) {
    console.log(`Strategy: "${strategy.name}"`);
    console.log(`  ID: ${strategy.id}`);
    console.log(`  Active: ${strategy.is_active}`);

    // Load rules
    const { data: rules, error: rulesError } = await supabase
      .from('rules')
      .select('*')
      .eq('strategy_id', strategy.id);

    if (rulesError) {
      console.error('  Error loading rules:', rulesError);
      continue;
    }

    console.log(`  Rules (${rules?.length || 0}):`);
    for (const rule of rules || []) {
      console.log(`    - Metric: ${rule.metric}`);
      console.log(`      Team Scope: ${rule.team_scope || 'none'}`);
      console.log(`      Comparator: ${rule.comparator}`);
      console.log(`      Value: ${rule.value}`);
      console.log(`      Value Type: ${rule.value_type}`);
      console.log(`      Rule ID: ${rule.id}`);
    }
    console.log('');
  }

  process.exit(0);
}

debugRules();
