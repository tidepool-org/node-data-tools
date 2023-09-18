/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';
import util from 'util';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'output');
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

let returnValue = 0;

function testFixture(fixturePath, fixture, units) {
  const outputFile = crypto
    .createHash('sha256')
    .update(path.parse(fixture).name)
    .digest('hex');

  process.stdout.write(`Testing fixture ${fixture} in ${units} (writing to ${outputFile}.xlsx)... `);
  const convert = spawnSync(`${process.argv[0]} ${__dirname}/../index.js convert -i ${fixturePath}/${fixture} -u '${units}' -f xlsx -o ${__dirname}/output`, { shell: true });
  const compare = spawnSync(`${process.argv[0]} --max-old-space-size=8192 ${__dirname}/exporter.test.js -i ${fixturePath}/${fixture} -u '${units}' -o ${__dirname}/output/${outputFile}.xlsx`, { shell: true });
  if (convert.status === 0 && compare.status === 0) {
    console.log('OK');
  } else {
    console.log('FAILED');
    returnValue = 1;
  }
}

(async () => {
  const readdir = util.promisify(fs.readdir);
  const fixturePath = path.join(__dirname, 'fixtures');
  const fixtures = (process.argv.length > 2) ? process.argv.slice(2) : await readdir(fixturePath);
  // eslint-disable-next-line no-restricted-syntax
  for (const fixture of fixtures.filter((fn) => fn.endsWith('.json'))) {
    testFixture(fixturePath, fixture, 'mmol/L');
    testFixture(fixturePath, fixture, 'mg/dL');
  }

  if (returnValue !== 0) {
    console.log('\n*** One or more tests failed ***');
  }

  process.exit(returnValue);
})();
