import { handle } from '@oclif/errors';
import flush from '@oclif/command/flush';

import { run } from '@oclif/command';

run().then(flush, handle);
