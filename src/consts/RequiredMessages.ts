import { Buffer } from 'buffer';

const RequiredMessages = {
    1: Buffer.from('05338b11000000000000', 'hex'),
    2: Buffer.from('05338b1102001200000006ba4988d521ea126401dcf4bb5d486d93bc', 'hex'),
    3: Buffer.from('05338b112f00010000000005338b11050000000000', 'hex'),
}

const StartStreamMessage = Buffer.from('05338b110e000400000000000000', 'hex');


export { RequiredMessages, StartStreamMessage  };