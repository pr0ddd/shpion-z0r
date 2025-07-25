import tcpp from 'tcp-ping';

export async function ping(host: string, port = 443, timeout = 3000): Promise<number | null> {
  return new Promise((resolve) => {
    tcpp.ping({ address: host, port, timeout }, (err, data) => {
      if (err || !data || typeof data.avg !== 'number') return resolve(null);
      resolve(Math.round(data.avg));
    });
  });
} 