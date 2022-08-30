import * as Bull from 'bull';

export function getQueue(qname: string): Bull.Queue {
  return new Bull(qname, `${process.env.REDIS_URL}`);
}
