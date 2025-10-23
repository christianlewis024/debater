/**
 * Global setup for Playwright E2E tests
 * This runs once before all tests
 */
export default async function globalSetup() {
  console.log('🔧 Global setup for E2E tests');

  // Check if Firebase emulators are running
  // In production, you would start emulators here
  // For now, we assume they are already running via `npm run dev`

  console.log('✅ Firebase emulators should be running on:');
  console.log('   - Auth: http://localhost:9099');
  console.log('   - Firestore: http://localhost:8080');
  console.log('   - Realtime DB: http://localhost:9000');
  console.log('   - Emulator UI: http://localhost:4000');
  console.log('');
  console.log('💡 Make sure to run `npm run dev` before running E2E tests');
}
