import { SendMany } from './commands/send-many';
import { handle } from '@oclif/errors';

SendMany.run().then(null, handle);
