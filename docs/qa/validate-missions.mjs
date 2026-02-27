import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const missionsFile = path.join(root, 'data/missions.json');
const validationSource = fs.readFileSync(path.join(root, 'js/mission-validation.js'), 'utf8');
const missions = JSON.parse(fs.readFileSync(missionsFile, 'utf8')).missions;

const sandbox = {
  module: { exports: {} },
  exports: {},
  globalThis: {}
};
vm.createContext(sandbox);
vm.runInContext(validationSource, sandbox);

const validation = sandbox.module.exports.validateMissions(missions);
if (validation.warnings.length) {
  console.warn('Mission validation warnings:');
  validation.warnings.forEach(warning => console.warn(` - ${warning}`));
}

if (validation.errors.length) {
  console.error('Mission validation errors:');
  validation.errors.forEach(error => console.error(` - ${error}`));
  process.exit(1);
}

console.log(`Validated ${missions.length} missions with no schema errors.`);
