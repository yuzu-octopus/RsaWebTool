import { attacks, testcaseGenerators } from '../../attacks';

/**
 * Generate a testcase for an attack and verify frontendCheck produces a result.
 */
export async function testAttackFrontendCheck(attackId: string): Promise<{ success: boolean; result: string | null }> {
  const attack = attacks.find(a => a.id === attackId);
  if (!attack) throw new Error(`Attack ${attackId} not found`);
  if (!attack.frontendCheck) return { success: true, result: null }; // no frontendCheck = skip

  // Generate testcase
  const gen = testcaseGenerators[attackId];
  if (!gen) return { success: true, result: null };

  const vals = gen();
  const result = await attack.frontendCheck(vals);
  return { success: result !== null, result };
}
